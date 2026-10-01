#!/usr/bin/env node
// Summarize a `clize seo check --domain <site>` JSON into the handful of facts a round starts from.
// Usage: node summarize.mjs check.json        (no dependencies; reads only the file you pass)
import { readFileSync } from "node:fs";

const c = JSON.parse(readFileSync(process.argv[2] ?? "check.json", "utf8"));
const g = c.gsc ?? {};
const brand = (c.brand ?? "").toLowerCase();
const isBrand = (q) => brand && q.toLowerCase().includes(brand);
const line = (k, v) => console.log(`${k.padEnd(34)} ${v}`);

console.log(`# ${c.domain} — checked ${c.ranAt}`);
line("Search Console window", g.window ? `${g.window.from} → ${g.window.to}` : "no Search Console access (see notes)");
line("Impressions / clicks (all)", g.impressions != null ? `${g.impressions} / ${g.clicks}` : "—");
const top = g.topQueries ?? [];
const nb = top.filter((q) => !isBrand(q.query) && !q.query.startsWith("site:"));
line("Top non-brand queries (of top 15)", nb.slice(0, 5).map((q) => `${q.query} ${q.impressions}@${q.position}`).join(" · ") || "—");

const close = (c.rank?.latest ?? [])
  .filter((r) => r.position != null && r.position <= 20 && !isBrand(r.keyword))
  .sort((a, b) => a.position - b.position)
  .slice(0, 5);
line("Tracked words in the top 20", close.map((r) => `${r.keyword} ${r.position} (${r.impressions} impr.)`).join(" · ") || "none");

const t = c.traffic ?? {};
if (t.status !== "measured") line("Traffic", "no sensor (not measured — not zero)");
else {
  line(`AI referrals (${t.ai?.window?.days ?? 7} days)`, `${t.ai?.total ?? 0} ${JSON.stringify(t.ai?.byEngine ?? {})}`);
  const ai = (t.pages?.rows ?? []).filter((r) => r.ai > 0).map((r) => `${r.path} ${r.ai}`);
  line("  …landing on", ai.join(" · ") || "—");
  line("Pages with any use / external entry", `${t.pages?.recorded ?? "—"} / ${t.pages?.external ?? "—"} (7 days, sampled)`);
}
line("Sitemap pages", c.gsc?.pages?.sitemap?.urls ?? c.cells?.byStatus?.built ?? "—");
console.log("\nnotes:");
for (const n of c.notes ?? []) console.log(" - " + n.slice(0, 160) + (n.length > 160 ? "…" : ""));
