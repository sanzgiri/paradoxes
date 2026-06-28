import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "..", "paradoxes.csv");
const metaDir = path.join(process.cwd(), "..", "content", "meta");
const expoDir = path.join(process.cwd(), "..", "content", "expo");

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTags(value) {
  return splitList(value).map((tag) =>
    tag
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  );
}

/**
 * Coerce a value into a clean array of strings.
 * Handles the inconsistent LLM output where a field may be:
 *   - an array of strings        -> trimmed & de-duplicated
 *   - an array of {name, ...}     -> mapped to the `name`
 *   - a single string with "1. ..." / ";" / newline separators -> split
 *   - empty / null                -> []
 */
function toList(value) {
  if (value == null) return [];

  let items = [];
  if (Array.isArray(value)) {
    items = value.map((item) => {
      if (item && typeof item === "object") {
        return item.name || item.label || item.title || "";
      }
      return String(item);
    });
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    // Split numbered steps ("1. ... 2. ...") or semicolon/newline lists.
    if (/\n|;|\d+\.\s/.test(trimmed)) {
      items = trimmed
        .split(/\n|;|(?=\d+\.\s)/)
        .map((part) => part.replace(/^\s*\d+\.\s*/, ""));
    } else {
      items = [trimmed];
    }
  } else {
    items = [String(value)];
  }

  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const item = String(raw).trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Coerce a value into a clean single string (joins arrays sensibly). */
function toText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => (v && typeof v === "object" ? v.name || "" : String(v)))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof value === "object") return value.name || "";
  return String(value).trim();
}

/**
 * Normalize a raw expository JSON object into a stable shape the UI can rely on,
 * smoothing over inconsistencies in the generated data.
 */
function normalizeExpo(expo) {
  if (!expo || typeof expo !== "object") return null;

  const narrative = expo.narrative || {};
  const mechanism = expo.mechanism || {};
  const solutions = expo.solutions || {};
  const practice = expo.practice || {};
  const context = expo.context || {};

  return {
    narrative: {
      story: toText(narrative.story),
      wrong_reasoning: toText(narrative.wrong_reasoning),
      paradox: toText(narrative.paradox),
    },
    mechanism: {
      assumptions: toList(mechanism.assumptions),
      steps: toList(mechanism.steps),
      math: toText(mechanism.math),
      truth: toText(mechanism.truth),
    },
    solutions: {
      paths: toList(solutions.paths),
      tradeoffs: toList(solutions.tradeoffs),
      status: toText(solutions.status),
    },
    practice: {
      patterns: toList(practice.patterns),
      prompts: toList(practice.prompts),
      warnings: toList(practice.warnings),
    },
    context: {
      history: toText(context.history),
      sources:
        context.sources && typeof context.sources === "object"
          ? context.sources
          : {},
    },
  };
}

function parseCSVData() {
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  const raw = fs.readFileSync(dataPath, "utf8");
  const rows = parseCSV(raw);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

let cachedParadoxes = null;

export function getAllParadoxes() {
  if (cachedParadoxes) return cachedParadoxes;

  if (fs.existsSync(metaDir)) {
    const fileNames = fs.readdirSync(metaDir).filter((name) => name.endsWith(".json"));
    if (fileNames.length) {
      cachedParadoxes = fileNames
        .map((file) => {
          const raw = fs.readFileSync(path.join(metaDir, file), "utf8");
          const meta = JSON.parse(raw);
          return {
            id: meta.id,
            name: meta.title,
            aliases: toList(meta.aliases),
            domain: meta.domains?.[0] || "other",
            domains: meta.domains || [],
            type: meta.paradox_type || "veridical",
            difficulty: meta.difficulty || "",
            tags: meta.tags || [],
            related: toList(meta.related),
            summary: meta.hook || "",
            hook: meta.hook || "",
            key_lesson: meta.key_lesson || "",
          };
        })
        .filter((item) => item.id && item.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      return cachedParadoxes;
    }
  }

  const rows = parseCSVData();
  cachedParadoxes = rows
    .map((row) => {
      const tags = parseTags(row.tags || "");
      const domains = [row.domain].filter(Boolean).map((d) => d.trim());
      if (row.logic === "1") domains.push("logic");
      if (row.physics === "1") domains.push("physics");
      if (row.decision_theory === "1") domains.push("decision_theory");

      return {
        id: row.id,
        name: row.name,
        aliases: splitList(row.aliases),
        domain: row.domain,
        domains: Array.from(new Set(domains)),
        type: row.type,
        difficulty: "",
        tags,
        related: [],
        summary: row.summary,
        hook: row.summary,
        key_lesson: "",
      };
    })
    .filter((item) => item.id && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  return cachedParadoxes;
}

export function getParadoxById(id) {
  return getAllParadoxes().find((item) => item.id === id) || null;
}

export function getAllParadoxIds() {
  return getAllParadoxes().map((item) => ({ params: { slug: item.id } }));
}

/**
 * Resolve a list of related-paradox references (which may be ids, titles, or
 * loose names) into actual catalog entries so we can render links.
 */
function resolveRelated(refs) {
  if (!refs?.length) return [];
  const all = getAllParadoxes();
  const byId = new Map(all.map((p) => [p.id, p]));
  const byName = new Map(all.map((p) => [p.name.toLowerCase(), p]));
  const slug = (s) =>
    "p_" + String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const out = [];
  const seen = new Set();
  for (const ref of refs) {
    const r = String(ref).trim();
    if (!r) continue;
    const match =
      byId.get(r) || byName.get(r.toLowerCase()) || byId.get(slug(r));
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      out.push({ id: match.id, name: match.name });
    }
  }
  return out;
}

export function getParadoxDetail(id) {
  const base = getParadoxById(id);
  if (!base) return null;

  const related = resolveRelated(base.related);

  const expoPath = path.join(expoDir, `${id}.json`);
  if (!fs.existsSync(expoPath)) {
    return { ...base, related };
  }

  const raw = fs.readFileSync(expoPath, "utf8");
  const expo = normalizeExpo(JSON.parse(raw));
  return { ...base, related, expo };
}

export function getDomainOptions() {
  const domains = new Set();
  getAllParadoxes().forEach((item) => {
    item.domains.forEach((domain) => domains.add(domain));
  });
  return Array.from(domains).sort();
}

export function getTypeOptions() {
  const types = new Set();
  getAllParadoxes().forEach((item) => {
    if (item.type) types.add(item.type);
  });
  return Array.from(types).sort();
}
