# Paradoxes Atlas

A catalog of 267 paradoxes with a bold index and deep‑dive pages, generated from `paradoxes.csv` and enriched with LLM output. The site is a Next.js app designed for Netlify.

## Structure

- `paradoxes.csv` — source dataset.
- `content/meta/*.json` — list‑view metadata (generated).
- `content/expo/*.json` — deep‑dive content (generated).
- `site/` — Next.js app.

## Local Development

```bash
cd site
npm install
npm run dev
```

Open http://localhost:3000

## Generate Content

Requires `OPENAI_API_KEY` in `.env` (do not commit the key).

```bash
python3 generate_paradoxes.py --model gpt-4o-mini
```

Outputs:
- `content/meta/<id>.json`
- `content/expo/<id>.json`
- `paradoxes.meta.json`
- `paradoxes.expo.json`

## Netlify

This repo includes `netlify.toml`:
- Base: `site`
- Build: `npm run build`
- Publish: `.next`

Deploy by connecting the GitHub repo in Netlify.

### Site URL (for SEO)

Canonical URLs, `sitemap.xml`, `robots.txt`, and Open Graph tags use
`NEXT_PUBLIC_SITE_URL`. Set it to your production domain in the Netlify
environment (Site settings → Environment variables), e.g.:

```
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
```

If unset, it falls back to `https://paradoxes-atlas.netlify.app`.

## SEO & discoverability

- Per‑page `<title>`, meta description, canonical link, and Open Graph tags.
- `JSON‑LD` structured data (`WebSite` on the index, `DefinedTerm` on each page).
- Auto‑generated `sitemap.xml` and `robots.txt`.

## Features

- Searchable, filterable index (by domain and paradox type) with **shareable
  URLs** — filters sync to query params (`?q=…&domain=…&type=…`).
- Per‑paradox deep dives: narrative, mechanism, solutions, practice, context,
  aliases, structure tags, and related‑paradox links.
- **Dark mode** via `prefers-color-scheme`.

## Notes on data

The generated content is normalized at read time (`site/lib/paradoxes.js`) so
inconsistent shapes from the LLM (e.g. a numbered string vs. an array for
`mechanism.steps`) render consistently. Regenerating with the updated
`generate_paradoxes.py` enforces these shapes at the source and drops generic
filler prompts. Always verify against primary sources before citing.

