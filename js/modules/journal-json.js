import { esc } from "../utils.js";
import { parseDurationMinutes, formatDuration } from "../org/engine.js";

async function loadJournalJson() {
  const res = await fetch("./data/journal.json?v=" + Date.now());
  if (!res.ok) throw new Error("journal.json load failed");
  return res.json();
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function buildStats(entries) {
  const byType = {};
  let durationMin = 0;
  for (const e of entries) {
    const t = e.type || "NOTE";
    byType[t] = (byType[t] || 0) + 1;
    durationMin += parseDurationMinutes(e.duration || e.时长 || 0);
  }
  const recentDays = 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);
  const cut = cutoff.toISOString().slice(0, 10);
  const recent = entries.filter((e) => e.date && e.date >= cut);
  return { byType, durationMin, recentDays, recentCount: recent.length, total: entries.length };
}

/**
 * @param {HTMLElement} root
 */
export async function renderJournalJson(root) {
  root.innerHTML = `
    <div class="json-log">
      <div class="json-log-bar">
        <span class="json-log-name">journal.json</span>
        <span class="json-log-badge">JSON</span>
        <span class="json-log-hint">与 org 日志并存 · data/journal.json</span>
      </div>
      <div class="json-log-stats" data-stats></div>
      <div class="json-log-list" data-list><p class="empty">Loading…</p></div>
      <div class="json-log-foot">
        <span data-ml>—</span>
        <span>schema v1</span>
      </div>
    </div>
  `;

  const statsEl = root.querySelector("[data-stats]");
  const listEl = root.querySelector("[data-list]");
  const ml = root.querySelector("[data-ml]");

  try {
    const data = await loadJournalJson();
    const entries = sortEntries(Array.isArray(data.entries) ? data.entries : []);
    const stats = buildStats(entries);

    const typeChips = Object.entries(stats.byType)
      .map(([k, v]) => `<span class="json-chip"><b>${esc(k)}</b>${v}</span>`)
      .join("");

    statsEl.innerHTML = `
      <div class="json-stat"><strong>${stats.total}</strong><span>条目</span></div>
      <div class="json-stat"><strong>${stats.recentCount}</strong><span>${stats.recentDays}天内</span></div>
      <div class="json-stat"><strong>${esc(formatDuration(stats.durationMin))}</strong><span>总时长</span></div>
      <div class="json-chips">${typeChips || '<span class="muted">暂无类型</span>'}</div>
    `;

    if (!entries.length) {
      listEl.innerHTML = `
        <p class="empty">entries 为空。填写说明见 data/journal-json-guide.md</p>
        <pre class="json-sample">{
  "id": "2026-09-15-1",
  "date": "2026-09-15",
  "type": "NOTE",
  "title": "标题",
  "body": "正文",
  "tags": [],
  "duration": "25m"
}</pre>`;
    } else {
      listEl.innerHTML = entries
        .map((e) => {
          const tags = (e.tags || []).map((t) => `<span class="json-tag">${esc(t)}</span>`).join("");
          const meta = [
            e.date || "—",
            e.duration ? `时长 ${e.duration}` : null,
            e.mood ? `心情 ${e.mood}` : null,
            e.project ? `项目 ${e.project}` : null,
          ]
            .filter(Boolean)
            .map(esc)
            .join(" · ");
          return `
            <article class="json-entry">
              <header>
                <span class="json-type">${esc(e.type || "NOTE")}</span>
                <h3>${esc(e.title || "(无标题)")}</h3>
              </header>
              <div class="json-meta">${meta}</div>
              ${tags ? `<div class="json-tags">${tags}</div>` : ""}
              ${e.body ? `<p class="json-body">${esc(e.body)}</p>` : ""}
            </article>`;
        })
        .join("");
    }

    if (ml) {
      ml.textContent = `${data.title || "JSON 日志"} · ${stats.total} 条 · ${formatDuration(stats.durationMin)}`;
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p class="empty">无法加载 data/journal.json</p>';
  }
}
