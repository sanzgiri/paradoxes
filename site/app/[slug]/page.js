import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllParadoxIds, getParadoxDetail, getParadoxById } from "../../lib/paradoxes";
import styles from "./page.module.css";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paradoxes-atlas.netlify.app").replace(/\/$/, "");

export async function generateStaticParams() {
  return getAllParadoxIds().map((item) => ({ slug: item.params.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const paradox = getParadoxById(slug);
  if (!paradox) {
    return { title: "Paradox not found — Paradoxes Atlas" };
  }
  const description =
    paradox.hook ||
    paradox.summary ||
    `An overview of the ${paradox.name}, a ${paradox.type} paradox.`;
  const url = `${SITE_URL}/${paradox.id}`;
  return {
    title: `${paradox.name} — Paradoxes Atlas`,
    description,
    keywords: [paradox.name, ...paradox.domains, ...paradox.tags, "paradox"],
    alternates: { canonical: url },
    openGraph: {
      title: paradox.name,
      description,
      url,
      type: "article",
      siteName: "Paradoxes Atlas",
    },
    twitter: {
      card: "summary",
      title: paradox.name,
      description,
    },
  };
}

export default async function ParadoxPage({ params }) {
  const { slug } = await params;
  const paradox = getParadoxDetail(slug);

  if (!paradox) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: paradox.name,
    description: paradox.hook || paradox.summary || "",
    url: `${SITE_URL}/${paradox.id}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Paradoxes Atlas",
      url: SITE_URL,
    },
    ...(paradox.expo?.context?.history
      ? { description: `${paradox.hook || paradox.summary}. ${paradox.expo.context.history}` }
      : {}),
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Back to index
        </Link>
        <h1>{paradox.name}</h1>
        {paradox.aliases.length > 0 && (
          <p className={styles.aliasLine}>
            Also known as: {paradox.aliases.join(", ")}
          </p>
        )}
        <div className={styles.meta}>
          {paradox.domains.map((domain) => (
            <span key={domain} className="badge">
              {domain.replace(/_/g, " ")}
            </span>
          ))}
          <span className="badge accent">{paradox.type}</span>
          {paradox.difficulty && (
            <span className="badge cool">{paradox.difficulty}</span>
          )}
        </div>
      </header>

      <section className={styles.card}>
        <h2>Core paradox</h2>
        <p>{paradox.summary}</p>
        {paradox.key_lesson && (
          <p className={styles.lesson}>
            <strong>Key lesson:</strong> {paradox.key_lesson}
          </p>
        )}
      </section>

      {paradox.expo?.narrative && (
        <section className={styles.panel}>
          <h3>Narrative</h3>
          {paradox.expo.narrative.story && (
            <p className={styles.lead}>{paradox.expo.narrative.story}</p>
          )}
          <div className={styles.twoCol}>
            <div>
              <h4>Wrong reasoning</h4>
              <p>{paradox.expo.narrative.wrong_reasoning || "—"}</p>
            </div>
            <div>
              <h4>Paradox</h4>
              <p>{paradox.expo.narrative.paradox || "—"}</p>
            </div>
          </div>
        </section>
      )}

      {paradox.expo?.mechanism && (
        <section className={styles.panel}>
          <h3>Mechanism</h3>
          <div className={styles.twoCol}>
            <div>
              <h4>Assumptions</h4>
              <List items={paradox.expo.mechanism.assumptions} empty="No assumptions recorded." />
            </div>
            <div>
              <h4>Steps</h4>
              <List items={paradox.expo.mechanism.steps} empty="No steps recorded." ordered />
              {paradox.expo.mechanism.math && (
                <>
                  <h4>Math</h4>
                  <p>{paradox.expo.mechanism.math}</p>
                </>
              )}
              {paradox.expo.mechanism.truth && (
                <>
                  <h4>Truth</h4>
                  <p>{paradox.expo.mechanism.truth}</p>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {paradox.expo?.solutions && (
        <section className={styles.panel}>
          <h3>Solutions</h3>
          <div className={styles.twoCol}>
            <div>
              <h4>Paths</h4>
              <List items={paradox.expo.solutions.paths} empty="No solution paths yet." />
            </div>
            <div>
              <h4>Tradeoffs</h4>
              <List items={paradox.expo.solutions.tradeoffs} empty="No tradeoffs recorded." />
              {paradox.expo.solutions.status && (
                <>
                  <h4>Status</h4>
                  <p>{paradox.expo.solutions.status}</p>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {paradox.expo?.practice && (
        <section className={styles.panel}>
          <h3>Practice</h3>
          <div className={styles.twoCol}>
            <div>
              <h4>Patterns</h4>
              <List items={paradox.expo.practice.patterns} empty="No patterns yet." />
            </div>
            <div>
              <h4>Prompts</h4>
              <List items={paradox.expo.practice.prompts} empty="No prompts yet." />
              <h4>Warnings</h4>
              <List items={paradox.expo.practice.warnings} empty="No warnings yet." />
            </div>
          </div>
        </section>
      )}

      <section className={styles.grid}>
        <div className={styles.panel}>
          <h3>Aliases</h3>
          <List items={paradox.aliases} empty="No common aliases listed." />
        </div>
        <div className={styles.panel}>
          <h3>Structure tags</h3>
          <div className={styles.tags}>
            {paradox.tags.length ? (
              paradox.tags.map((tag) => (
                <span key={tag} className="badge cool">
                  {tag.replace(/_/g, " ")}
                </span>
              ))
            ) : (
              <span className={styles.muted}>No tags yet.</span>
            )}
          </div>
        </div>
      </section>

      {paradox.related.length > 0 && (
        <section className={styles.panel}>
          <h3>Related paradoxes</h3>
          <div className={styles.relatedGrid}>
            {paradox.related.map((rel) => (
              <Link key={rel.id} href={`/${rel.id}`} className={styles.relatedLink}>
                {rel.name} →
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <h3>Context</h3>
        <p>{paradox.expo?.context?.history || "No historical notes yet."}</p>
        {paradox.expo?.context?.sources &&
          Object.keys(paradox.expo.context.sources).length > 0 && (
            <div className={styles.sources}>
              <h4>Sources</h4>
              <ul>
                {Object.entries(paradox.expo.context.sources).map(([key, value]) => (
                  <li key={key}>
                    <span className={styles.sourceKey}>{key}:</span>{" "}
                    {/^https?:\/\//.test(value) ? (
                      <a href={value} target="_blank" rel="noopener noreferrer">
                        {value}
                      </a>
                    ) : (
                      <span>{value}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className={styles.sourceNote}>
                Sources are starting points — verify with primary references before citing.
              </p>
            </div>
          )}
      </section>
    </div>
  );
}

function List({ items, empty, ordered = false }) {
  if (!items || items.length === 0) {
    return <p className={styles.muted}>{empty}</p>;
  }
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </Tag>
  );
}
