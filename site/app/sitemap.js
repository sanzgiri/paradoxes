import { getAllParadoxes } from "../lib/paradoxes";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paradoxes-atlas.netlify.app").replace(/\/$/, "");

export default function sitemap() {
  const now = new Date();
  const paradoxes = getAllParadoxes().map((p) => ({
    url: `${SITE_URL}/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...paradoxes,
  ];
}
