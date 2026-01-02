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

export function getAllParadoxes() {
  if (fs.existsSync(metaDir)) {
    const fileNames = fs.readdirSync(metaDir).filter((name) => name.endsWith(".json"));
    if (fileNames.length) {
      return fileNames
        .map((file) => {
          const raw = fs.readFileSync(path.join(metaDir, file), "utf8");
          const meta = JSON.parse(raw);
          return {
            id: meta.id,
            name: meta.title,
            aliases: [],
            domain: meta.domains?.[0] || "other",
            domains: meta.domains || [],
            type: meta.paradox_type || "veridical",
            tags: meta.tags || [],
            summary: meta.hook || "",
            hook: meta.hook || "",
            key_lesson: meta.key_lesson || "",
          };
        })
        .filter((item) => item.id && item.name)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const rows = parseCSVData();
  return rows
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
        tags,
        summary: row.summary,
      };
    })
    .filter((item) => item.id && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getParadoxById(id) {
  return getAllParadoxes().find((item) => item.id === id) || null;
}

export function getAllParadoxIds() {
  return getAllParadoxes().map((item) => ({ params: { slug: item.id } }));
}

export function getParadoxDetail(id) {
  const base = getParadoxById(id);
  if (!base) return null;

  const expoPath = path.join(expoDir, `${id}.json`);
  if (!fs.existsSync(expoPath)) {
    return { ...base };
  }

  const raw = fs.readFileSync(expoPath, "utf8");
  const expo = JSON.parse(raw);
  return { ...base, expo };
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
