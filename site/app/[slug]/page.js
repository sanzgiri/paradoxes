import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllParadoxIds, getParadoxDetail } from "../../lib/paradoxes";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return getAllParadoxIds().map((item) => ({ slug: item.params.slug }));
}

export default async function ParadoxPage({ params }) {
  const { slug } = await params;
  const paradox = getParadoxDetail(slug);

  if (!paradox) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Back to index
        </Link>
        <h1>{paradox.name}</h1>
        <div className={styles.meta}>
          {paradox.domains.map((domain) => (
            <span key={domain} className="badge">
              {domain.replace(/_/g, " ")}
            </span>
          ))}
          <span className="badge accent">{paradox.type}</span>
        </div>
      </header>

      <section className={styles.card}>
        <h2>Core paradox</h2>
        <p>{paradox.summary}</p>
      </section>

      {paradox.expo?.narrative && (
        <section className={styles.panel}>
          <h3>Narrative</h3>
          <p className={styles.lead}>{paradox.expo.narrative.story}</p>
          <div className={styles.twoCol}>
            <div>
              <h4>Wrong reasoning</h4>
              <p>{paradox.expo.narrative.wrong_reasoning}</p>
            </div>
            <div>
              <h4>Paradox</h4>
              <p>{paradox.expo.narrative.paradox}</p>
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
              {Array.isArray(paradox.expo.mechanism.assumptions) &&
              paradox.expo.mechanism.assumptions.length ? (
                <ul>
                  {paradox.expo.mechanism.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No assumptions recorded.</p>
              )}
            </div>
            <div>
              <h4>Steps</h4>
              <p>{paradox.expo.mechanism.steps}</p>
              <h4>Math</h4>
              <p>{paradox.expo.mechanism.math}</p>
              <h4>Truth</h4>
              <p>{paradox.expo.mechanism.truth}</p>
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
              {paradox.expo.solutions.paths?.length ? (
                <ul>
                  {paradox.expo.solutions.paths.map((path) => (
                    <li key={path.name || path}>{path.name || path}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No solution paths yet.</p>
              )}
            </div>
            <div>
              <h4>Tradeoffs</h4>
              {paradox.expo.solutions.tradeoffs?.length ? (
                <ul>
                  {paradox.expo.solutions.tradeoffs.map((tradeoff) => (
                    <li key={tradeoff}>{tradeoff}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No tradeoffs recorded.</p>
              )}
              <h4>Status</h4>
              <p>{paradox.expo.solutions.status}</p>
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
              {paradox.expo.practice.patterns?.length ? (
                <ul>
                  {paradox.expo.practice.patterns.map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No patterns yet.</p>
              )}
            </div>
            <div>
              <h4>Prompts</h4>
              {paradox.expo.practice.prompts?.length ? (
                <ul>
                  {paradox.expo.practice.prompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No prompts yet.</p>
              )}
              <h4>Warnings</h4>
              {paradox.expo.practice.warnings?.length ? (
                <ul>
                  {paradox.expo.practice.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>No warnings yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className={styles.grid}>
        <div className={styles.panel}>
          <h3>Aliases</h3>
          {paradox.aliases.length ? (
            <ul>
              {paradox.aliases.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No common aliases listed.</p>
          )}
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

      <section className={styles.panel}>
        <h3>Context</h3>
        <p>{paradox.expo?.context?.history || "No historical notes yet."}</p>
        {paradox.expo?.context?.sources && (
          <div className={styles.sources}>
            <h4>Sources</h4>
            <ul>
              {Object.entries(paradox.expo.context.sources).map(([key, value]) => (
                <li key={key}>
                  <span className={styles.sourceKey}>{key}:</span>{" "}
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
