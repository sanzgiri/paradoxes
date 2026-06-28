import argparse
import csv
import json
import os
import re
import time
import urllib.request
import urllib.error
from html import unescape

OPENAI_URL = "https://api.openai.com/v1/chat/completions"

ALLOWED_DIFFICULTY = {"intro", "intermediate", "advanced", "technical"}
ALLOWED_PARADOX_TYPE = {"veridical", "falsidical", "antinomy"}

DOMAIN_ENUM = {
    "logic",
    "mathematics",
    "probability",
    "statistics",
    "physics",
    "decision_theory",
    "social_choice",
    "economics",
    "philosophy",
    "linguistics",
    "biology",
    "computer_science",
    "psychology",
    "other",
}


def load_env(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("\"'")
            if key and key not in os.environ:
                os.environ[key] = value


def call_openai(prompt: str, model: str, api_key: str) -> dict:
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You output only valid JSON. No markdown.",
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        OPENAI_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read().decode("utf-8")
    outer = json.loads(raw)
    content = outer["choices"][0]["message"]["content"]
    return json.loads(content)


def normalize_domain(value: str) -> str:
    if not value:
        return "other"
    v = value.strip().lower().replace(" ", "_").replace("-", "_")
    mapping = {
        "math": "mathematics",
        "maths": "mathematics",
        "stat": "statistics",
        "stats": "statistics",
        "decision": "decision_theory",
        "social": "social_choice",
        "computer": "computer_science",
    }
    v = mapping.get(v, v)
    return v if v in DOMAIN_ENUM else "other"


def parse_list(value: str) -> list[str]:
    if not value:
        return []
    parts = re.split(r"[;,|]", value)
    return [p.strip() for p in parts if p.strip()]


def parse_tags(value: str) -> list[str]:
    tags = []
    for part in parse_list(value):
        t = re.sub(r"\s+", "_", part.strip().lower())
        t = re.sub(r"[^a-z0-9_]+", "", t)
        if t:
            tags.append(t)
    seen = set()
    deduped = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            deduped.append(t)
    return deduped


def normalize_title(value: str) -> str:
    v = value.lower()
    v = re.sub(r"[^a-z0-9]+", "", v)
    return v


def load_wikipedia_slug_map(html_path: str) -> dict[str, str]:
    if not os.path.exists(html_path):
        return {}
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()
    pattern = re.compile(r'<a[^>]+href="/wiki/([^"#:]*)"[^>]*>([^<]+)</a>')
    mapping = {}
    for slug, text in pattern.findall(html):
        text = unescape(text)
        norm = normalize_title(text)
        if norm and norm not in mapping:
            mapping[norm] = slug
    return mapping


def load_text(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_snippet(text: str, name: str, window: int = 500) -> str:
    if not text or not name:
        return ""
    idx = text.lower().find(name.lower())
    if idx == -1:
        return ""
    start = max(0, idx - window)
    end = min(len(text), idx + window)
    snippet = text[start:end]
    snippet = re.sub(r"\s+", " ", snippet)
    return snippet.strip()


def build_prompt(base: dict, sources: dict) -> str:
    return (
        "Generate two JSON objects using the schemas below. Output JSON with keys: metadata, expository.\n"
        "Metadata schema: {id, title, hook, domains, difficulty, paradox_type, key_lesson, tags, related}.\n"
        "Expository schema: {id, narrative{story, wrong_reasoning, paradox}, mechanism{assumptions, steps, math, truth}, "
        "solutions{paths, tradeoffs, status}, practice{patterns, prompts, warnings}, context{history, sources}}.\n"
        "Constraints:\n"
        "- hook <= 100 chars, key_lesson <= 80 chars.\n"
        "- narrative.story <= 600 chars; wrong_reasoning <= 400; paradox <= 300.\n"
        "- mechanism.assumptions MUST be a JSON array of short strings (max 6).\n"
        "- mechanism.steps MUST be a JSON array of short strings, one per step (max 8). Do NOT number them.\n"
        "- mechanism.math <= 400; truth <= 100.\n"
        "- solutions.paths MUST be a JSON array of strings, max 4 items; tradeoffs max 8 items.\n"
        "- practice.patterns max 8; prompts max 6; warnings max 5. Make prompts SPECIFIC to this paradox, "
        "not generic (avoid 'What assumptions are you making?').\n"
        "- difficulty must be one of [intro, intermediate, advanced, technical].\n"
        "- paradox_type must be one of [veridical, falsidical, antinomy].\n"
        "- domains must be a list of domain enums.\n"
        "- Use concise, accurate content.\n\n"
        "Known data:\n"
        f"id: {base['id']}\n"
        f"title: {base['title']}\n"
        f"one_line: {base['one_line']}\n"
        f"domains: {json.dumps(base['domains'])}\n"
        f"tags: {json.dumps(base['tags'])}\n"
        f"wikipedia_slug: {base.get('wikipedia_slug')}\n\n"
        "Source snippets (may be empty):\n"
        f"Whitcraft: {sources.get('whitcraft', '')}\n"
        f"Szpiro: {sources.get('szpiro', '')}\n"
        f"Wikipedia list: {sources.get('wikipedia_list', '')}\n\n"
        "If unsure, keep related empty and keep history short."
    )


def clamp_enum(value: str, allowed: set[str], fallback: str) -> str:
    v = (value or "").strip().lower()
    return v if v in allowed else fallback


def normalize_metadata(data: dict, base: dict) -> dict:
    data["id"] = base["id"]
    data["title"] = base["title"]
    data["domains"] = [d for d in data.get("domains", base["domains"]) if d in DOMAIN_ENUM]
    if not data["domains"]:
        data["domains"] = base["domains"]
    data["difficulty"] = clamp_enum(data.get("difficulty"), ALLOWED_DIFFICULTY, "intermediate")
    data["paradox_type"] = clamp_enum(data.get("paradox_type"), ALLOWED_PARADOX_TYPE, "veridical")
    data.setdefault("tags", base["tags"])
    data.setdefault("related", [])
    return data


GENERIC_PROMPTS = {
    "what assumptions are you making?",
    "what assumptions are we making?",
    "what assumptions are being made?",
    "how does this relate to other paradoxes?",
    "what are the implications of this paradox?",
    "what questions remain unanswered?",
    "what are the potential outcomes?",
}


def coerce_list(value, max_items=None) -> list:
    """Coerce assorted shapes into a clean list of de-duplicated strings."""
    items = []
    if value is None:
        items = []
    elif isinstance(value, list):
        for v in value:
            if isinstance(v, dict):
                items.append(str(v.get("name") or v.get("label") or v.get("title") or "").strip())
            else:
                items.append(str(v).strip())
    elif isinstance(value, str):
        text = value.strip()
        if text:
            if re.search(r"\n|;|\d+\.\s", text):
                parts = re.split(r"\n|;|(?=\d+\.\s)", text)
                items = [re.sub(r"^\s*\d+\.\s*", "", p).strip() for p in parts]
            else:
                items = [text]
    else:
        items = [str(value).strip()]

    seen = set()
    out = []
    for item in items:
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    if max_items is not None:
        out = out[:max_items]
    return out


def coerce_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        parts = [
            (v.get("name", "") if isinstance(v, dict) else str(v)).strip()
            for v in value
        ]
        return " ".join(p for p in parts if p)
    if isinstance(value, dict):
        return str(value.get("name", "")).strip()
    return str(value).strip()


def normalize_expository(data: dict, base: dict) -> dict:
    data["id"] = base["id"]
    narrative = data.get("narrative") or {}
    mechanism = data.get("mechanism") or {}
    solutions = data.get("solutions") or {}
    practice = data.get("practice") or {}
    context = data.get("context") or {}
    if not isinstance(context, dict):
        context = {}

    data["narrative"] = {
        "story": coerce_text(narrative.get("story")),
        "wrong_reasoning": coerce_text(narrative.get("wrong_reasoning")),
        "paradox": coerce_text(narrative.get("paradox")),
    }
    data["mechanism"] = {
        "assumptions": coerce_list(mechanism.get("assumptions"), max_items=6),
        "steps": coerce_list(mechanism.get("steps"), max_items=8),
        "math": coerce_text(mechanism.get("math")),
        "truth": coerce_text(mechanism.get("truth")),
    }
    data["solutions"] = {
        "paths": coerce_list(solutions.get("paths"), max_items=4),
        "tradeoffs": coerce_list(solutions.get("tradeoffs"), max_items=8),
        "status": coerce_text(solutions.get("status")),
    }
    prompts = [
        p for p in coerce_list(practice.get("prompts"))
        if p.strip().lower() not in GENERIC_PROMPTS
    ][:6]
    data["practice"] = {
        "patterns": coerce_list(practice.get("patterns"), max_items=8),
        "prompts": prompts,
        "warnings": coerce_list(practice.get("warnings"), max_items=5),
    }
    if "sources" not in context or not isinstance(context.get("sources"), dict):
        context["sources"] = {}
    context["history"] = coerce_text(context.get("history"))
    data["context"] = context
    return data


def generate_entry(base: dict, sources: dict, model: str, api_key: str, retries: int = 2) -> tuple[dict, dict]:
    prompt = build_prompt(base, sources)
    last_error = None
    for _ in range(retries + 1):
        try:
            output = call_openai(prompt, model, api_key)
            metadata = normalize_metadata(output.get("metadata", {}), base)
            expository = normalize_expository(output.get("expository", {}), base)
            return metadata, expository
        except Exception as exc:
            last_error = exc
            time.sleep(1.0)
    raise last_error


def load_csv(path: str) -> list[dict]:
    rows = []
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate paradox JSON entries with OpenAI.")
    parser.add_argument("--csv", default="paradoxes.csv", help="Path to CSV")
    parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI model name")
    parser.add_argument("--outdir", default="content", help="Output directory")
    parser.add_argument("--combined_meta", default="paradoxes.meta.json", help="Combined metadata JSON")
    parser.add_argument("--combined_expo", default="paradoxes.expo.json", help="Combined expository JSON")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of entries")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    load_env()
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required in environment or .env")

    meta_dir = os.path.join(args.outdir, "meta")
    expo_dir = os.path.join(args.outdir, "expo")
    os.makedirs(meta_dir, exist_ok=True)
    os.makedirs(expo_dir, exist_ok=True)

    wiki_map = load_wikipedia_slug_map(os.path.join("sources", "wikipedia_list_of_paradoxes.html"))
    whitcraft_text = load_text(os.path.join("sources", "text", "whitcraft_list_of_paradoxes.txt"))
    szpiro_text = load_text(os.path.join("sources", "text", "szpiro23.txt"))
    wiki_list_text = load_text(os.path.join("sources", "wikipedia_list_of_paradoxes.html"))

    rows = load_csv(args.csv)
    if args.limit:
        rows = rows[: args.limit]

    meta_results = []
    expo_results = []

    total = len(rows)
    for idx, row in enumerate(rows, start=1):
        entry_id = row.get("id", "").strip()
        if not entry_id:
            print(f"[{idx}/{total}] Skipping row with missing id")
            continue

        meta_path = os.path.join(meta_dir, f"{entry_id}.json")
        expo_path = os.path.join(expo_dir, f"{entry_id}.json")

        if os.path.exists(meta_path) and os.path.exists(expo_path) and not args.overwrite:
            print(f"[{idx}/{total}] Skipping {entry_id} (exists)")
            with open(meta_path, "r", encoding="utf-8") as f:
                meta_results.append(json.load(f))
            with open(expo_path, "r", encoding="utf-8") as f:
                expo_results.append(json.load(f))
            continue

        name = row.get("name", "").strip()
        domain_primary = normalize_domain(row.get("domain", ""))
        domains = [domain_primary]
        if row.get("logic", "0") == "1" and "logic" not in domains:
            domains.append("logic")
        if row.get("physics", "0") == "1" and "physics" not in domains:
            domains.append("physics")
        if row.get("decision_theory", "0") == "1" and "decision_theory" not in domains:
            domains.append("decision_theory")

        tags = parse_tags(row.get("tags", ""))

        norm = normalize_title(name)
        wikipedia_slug = wiki_map.get(norm)
        wikipedia_url = f"https://en.wikipedia.org/wiki/{wikipedia_slug}" if wikipedia_slug else ""

        sources = {
            "whitcraft": extract_snippet(whitcraft_text, name),
            "szpiro": extract_snippet(szpiro_text, name),
            "wikipedia_list": extract_snippet(wiki_list_text, name),
        }

        base = {
            "id": entry_id,
            "title": name,
            "one_line": row.get("summary", "").strip(),
            "domains": domains,
            "tags": tags,
            "wikipedia_slug": wikipedia_slug or "",
        }

        print(f"[{idx}/{total}] Generating {entry_id}...")
        metadata, expository = generate_entry(base, sources, args.model, api_key)

        sources_obj = expository.setdefault("context", {}).setdefault("sources", {})
        sources_obj.setdefault("wikipedia_list", "https://en.wikipedia.org/wiki/List_of_paradoxes")
        sources_obj.setdefault("whitcraft", "List-of-Paradoxes.pdf")
        sources_obj.setdefault("szpiro", "szpiro23.pdf")
        if wikipedia_url:
            sources_obj["wikipedia"] = wikipedia_url

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=True, indent=2)
        with open(expo_path, "w", encoding="utf-8") as f:
            json.dump(expository, f, ensure_ascii=True, indent=2)

        meta_results.append(metadata)
        expo_results.append(expository)

        with open(args.combined_meta, "w", encoding="utf-8") as f:
            json.dump(meta_results, f, ensure_ascii=True, indent=2)
        with open(args.combined_expo, "w", encoding="utf-8") as f:
            json.dump(expo_results, f, ensure_ascii=True, indent=2)

        time.sleep(0.3)

    print(f"Done. Wrote {len(meta_results)} entries.")


if __name__ == "__main__":
    main()
