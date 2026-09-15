import { parseOrg, renderOrg, orgReadingStats } from "../org/engine.js";

async function loadReadingOrg() {
  const res = await fetch("./data/reading.org?v=" + Date.now());
  if (!res.ok) throw new Error("reading.org load failed");
  return res.text();
}

/** Build an org-mode preamble for stats (also rendered by the org engine). */
function statsAsOrg(stats) {
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");
  const recent = (stats.recent.length ? stats.recent : stats.books.slice(0, 8))
    .slice(0, 8)
    .map((b) => {
      const ts = b.date ? ` <${b.date}>` : "";
      const tags = b.tags?.length ? ` :${b.tags.join(":")}:` : "";
      return `** ${b.todo} ${b.title}${ts}${tags}`;
    })
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:READING: ${stats.reading}
:DONE: ${stats.done}
:RECENT_DAYS: ${stats.recentDays}
:RECENT_COUNT: ${stats.recent.length}
:END:
按 TODO 关键字计数：
${todoLines || "- （无）"}

** 近 ${stats.recentDays} 天
${recent || "*** （暂无带日期的条目）"}

`;
}

function setOutline(orgRoot, expand) {
  const nodes = expand
    ? orgRoot.querySelectorAll(".org-h")
    : orgRoot.querySelectorAll('.org-h[data-level]:not([data-level="1"])');
  nodes.forEach((h) => {
    if (expand) h.classList.remove("is-collapsed");
    else h.classList.add("is-collapsed");
    const body = h.querySelector(":scope > .org-h-body");
    const fold = h.querySelector(":scope > .org-h-row .org-fold");
    if (body) body.hidden = !expand;
    if (fold && !fold.disabled) fold.textContent = expand ? "▾" : "▸";
    const row = h.querySelector(":scope > .org-h-row");
    if (row) row.setAttribute("aria-expanded", expand ? "true" : "false");
  });
}

/**
 * Render reading log as a classic org-mode buffer (not a dashboard).
 * @param {HTMLElement} root
 */
export async function renderReading(root) {
  root.innerHTML = `
    <div class="org-buffer">
      <div class="org-buffer-bar">
        <span class="org-buffer-name">reading.org</span>
        <span class="org-buffer-mode">Org</span>
        <span class="org-buffer-actions">
          <button type="button" class="org-buf-btn" id="org-showall" title="Show All">Show All</button>
          <button type="button" class="org-buf-btn" id="org-overview" title="Overview">Overview</button>
        </span>
      </div>
      <div class="org-buffer-body" id="reading-org"><p class="empty">Loading…</p></div>
      <div class="org-modeline">
        <span>Org</span>
        <span id="org-modeline-stats">—</span>
        <span>data/reading.org</span>
      </div>
    </div>
  `;

  const orgRoot = root.querySelector("#reading-org");
  try {
    const text = await loadReadingOrg();
    const baseDoc = parseOrg(text);
    const stats = orgReadingStats(baseDoc);
    // Prepend stats as real org text, then render everything with the org engine
    const merged = statsAsOrg(stats) + text;
    const doc = parseOrg(merged);
    renderOrg(doc, orgRoot, { classic: true });

    const ml = root.querySelector("#org-modeline-stats");
    if (ml) {
      ml.textContent = `L1  (READING:${stats.reading} DONE:${stats.done} ALL:${stats.totalTracked})`;
    }

    root.querySelector("#org-showall")?.addEventListener("click", () => setOutline(orgRoot, true));
    root.querySelector("#org-overview")?.addEventListener("click", () => setOutline(orgRoot, false));
  } catch (e) {
    console.error(e);
    orgRoot.innerHTML = '<p class="empty">无法加载 data/reading.org</p>';
  }
}
