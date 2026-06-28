# Changelog

## [Unreleased]

### Added
- SEO: per-page `generateMetadata` (title, description, canonical, Open Graph,
  Twitter cards) and root `metadataBase`.
- JSON-LD structured data: `WebSite` on the index, `DefinedTerm` on each page.
- Auto-generated `sitemap.xml` and `robots.txt`.
- Dark mode via `prefers-color-scheme` (CSS variables, backgrounds, badges, inputs).
- URL-synced search/filters — state persists in `?q=&domain=&type=` for shareable views.
- Related-paradoxes link grid, aliases line, key-lesson callout, difficulty badge,
  and clickable source URLs on detail pages.
- "Clear filters" control and an empty state on the index.
- `CHANGELOG.md`.

### Changed
- `site/lib/paradoxes.js`: normalization layer coerces inconsistent LLM output
  into stable shapes (e.g. `mechanism.steps` numbered string -> list), de-dupes
  items, and wires through `related`/`aliases`/`difficulty`/`key_lesson`.
- `generate_paradoxes.py`: stricter prompt + `coerce_list`/`coerce_text`
  enforcement and a generic-prompt filter so future regenerations are clean.
- `next.config.mjs`: pinned `turbopack.root` to silence stray-lockfile warning.
- README: corrected count 269 -> 267, documented `NEXT_PUBLIC_SITE_URL`, SEO,
  features, and data notes.

### Fixed
- Escaped quotes in hero copy (ESLint `react/no-unescaped-entities`).
- Wrapped `useSearchParams()` in a Suspense boundary so the index prerenders.
- `.gitignore`: explicit log entries; removed stray `dev.log`/`generation.log`.
