"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ParadoxIndex.module.css";

export default function ParadoxIndex({ items, domains, types }) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.summary || "").toLowerCase().includes(q) ||
        (item.hook || "").toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.includes(q));

      const matchesDomain =
        domainFilter === "all" || item.domains.includes(domainFilter);
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesQuery && matchesDomain && matchesType;
    });
  }, [items, query, domainFilter, typeFilter]);

  return (
    <section className={styles.section}>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <label htmlFor="search">Search paradoxes</label>
          <input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: liar, infinity, selection bias"
          />
        </div>
        <div className={styles.filters}>
          <label>
            Domain
            <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)}>
              <option value="all">All domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Paradox type
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.results}>
        <span>{filtered.length} paradoxes</span>
        <span className={styles.hint}>Click any card to open the deep dive.</span>
      </div>

      <div className={styles.grid}>
        {filtered.map((item) => (
          <Link key={item.id} href={`/${item.id}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>{item.name}</h3>
              <span className={styles.type}>{item.type}</span>
            </div>
            <p className={styles.summary}>{item.summary || item.hook}</p>
            <div className={styles.meta}>
              <div className={styles.domains}>
                {item.domains.map((domain) => (
                  <span key={domain} className="badge">
                    {domain.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              <div className={styles.tags}>
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="badge cool">
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
