import { Suspense } from "react";
import ParadoxIndex from "./components/ParadoxIndex";
import { getAllParadoxes, getDomainOptions, getTypeOptions } from "../lib/paradoxes";
import styles from "./page.module.css";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paradoxes-atlas.netlify.app").replace(/\/$/, "");

export default function Home() {
  const items = getAllParadoxes();
  const domains = getDomainOptions();
  const types = getTypeOptions();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Paradoxes Atlas",
    url: SITE_URL,
    description: `A catalog of ${items.length} paradoxes with sharp summaries and structured deep dives.`,
  };

  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Paradoxes Atlas</p>
          <h1>Sharp contradictions. Clear thinking.</h1>
          <p className={styles.subhead}>
            Explore {items.length} paradoxes across logic, math, philosophy, and decision theory.
          </p>
        </div>
        <div className={styles.heroCard}>
          <p className={styles.heroQuote}>
            &ldquo;A paradox is a signpost: it marks a place where intuition breaks and new structure begins.&rdquo;
          </p>
          <div className={styles.heroMeta}>
            <span className="badge accent">Curated list</span>
            <span className="badge cool">CSV source</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Suspense fallback={null}>
          <ParadoxIndex items={items} domains={domains} types={types} />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>Paradoxes Atlas</strong>
          <span>Built locally for review before Netlify deployment.</span>
        </div>
        <span className={styles.footerNote}>Verify with primary sources before citing.</span>
      </footer>
    </div>
  );
}
