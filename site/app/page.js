import ParadoxIndex from "./components/ParadoxIndex";
import { getAllParadoxes, getDomainOptions, getTypeOptions } from "../lib/paradoxes";
import styles from "./page.module.css";

export default function Home() {
  const items = getAllParadoxes();
  const domains = getDomainOptions();
  const types = getTypeOptions();

  return (
    <div className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Paradoxes Atlas</p>
          <h1>Sharp contradictions. Clear thinking.</h1>
          <p className={styles.subhead}>
            Explore 269 paradoxes across logic, math, philosophy, and decision theory.
          </p>
        </div>
        <div className={styles.heroCard}>
          <p className={styles.heroQuote}>
            "A paradox is a signpost: it marks a place where intuition breaks and new structure begins."
          </p>
          <div className={styles.heroMeta}>
            <span className="badge accent">Curated list</span>
            <span className="badge cool">CSV source</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <ParadoxIndex items={items} domains={domains} types={types} />
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
