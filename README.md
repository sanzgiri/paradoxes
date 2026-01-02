# Paradoxes Atlas

A paradox catalog with a bold index and deep‑dive pages, generated from `paradoxes.csv` and enriched with LLM output. The site is a Next.js app designed for Netlify.

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
