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

function typeClass(type) {
  const t = String(type || "NOTE").toUpperCase();
  const map = {
    NOTE: "is-note",
    WORK: "is-work",
    LIFE: "is-life",
    EVENT: "is-event",
    TODO: "is-todo",
    DONE: "is-done",
  };
  return map[t] || "is-note";
}

function cell(text, cls) {
  const v = text == null || text === "" ? "—" : String(text);
  return `<span class="jl-cell ${cls}" title="${esc(v)}">${esc(v)}</span>`;
}

function rowHtml(e) {
  const type = (e.type || "NOTE").toUpperCase();
  const tags = Array.isArray(e.tags) ? e.tags.join(",") : e.tags || "";
  return `
    <div class="jl-row ${typeClass(type)}" role="row">
      ${cell(e.date || "—", "jl-date")}
      ${cell(type, "jl-type")}
      ${cell(e.title || "(无标题)", "jl-title")}
      ${cell(tags || "—", "jl-tags")}
      ${cell(e.duration || "—", "jl-dur")}
      ${cell(e.mood || "—", "jl-mood")}
      ${cell(e.project || "—", "jl-proj")}
      ${cell(e.body || "—", "jl-body")}
    </div>`;
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
        <span class="json-log-hint">单行固定列 · 超长省略 · data/journal.json</span>
      </div>
      <div class="json-log-stats" data-stats></div>
      <div class="jl-head" role="row">
        <span class="jl-cell jl-date">DATE</span>
        <span class="jl-cell jl-type">TYPE</span>
        <span class="jl-cell jl-title">TITLE</span>
        <span class="jl-cell jl-tags">TAGS</span>
        <span class="jl-cell jl-dur">DUR</span>
        <span class="jl-cell jl-mood">MOOD</span>
        <span class="jl-cell jl-proj">PROJECT</span>
        <span class="jl-cell jl-body">BODY</span>
      </div>
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
      .map(([k, v]) => `<span class="json-chip ${typeClass(k)}"><b>${esc(k)}</b>${v}</span>`)
      .join("");

    statsEl.innerHTML = `
      <div class="json-stat"><strong>${stats.total}</strong><span>条目</span></div>
      <div class="json-stat"><strong>${stats.recentCount}</strong><span>${stats.recentDays}天内</span></div>
      <div class="json-stat"><strong>${esc(formatDuration(stats.durationMin))}</strong><span>总时长</span></div>
      <div class="json-chips">${typeChips || '<span class="muted">暂无类型</span>'}</div>
    `;

    if (!entries.length) {
      listEl.innerHTML = `
        <p class="empty">entries 为空。说明见 data/journal-json-guide.md</p>
        <div class="jl-row is-note jl-demo" role="row">
          ${cell("2026-09-15", "jl-date")}
          ${cell("NOTE", "jl-type")}
          ${cell("示例标题（超长会被省略成省略号）", "jl-title")}
          ${cell("工作,心情", "jl-tags")}
          ${cell("25m", "jl-dur")}
          ${cell("平静", "jl-mood")}
          ${cell("许德拉", "jl-proj")}
          ${cell("这是正文预览，一行显示，超出部分显示……", "jl-body")}
        </div>`;
    } else {
      listEl.innerHTML = entries.map(rowHtml).join("");
    }

    if (ml) {
      ml.textContent = `${data.title || "JSON 日志"} · ${stats.total} 条 · ${formatDuration(stats.durationMin)}`;
    }
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p class="empty">无法加载 data/journal.json</p>';
  }
}
