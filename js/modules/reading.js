import {
  parseOrg,
  renderOrg,
  orgReadingStats,
  formatDuration,
  formatWords,
} from "../org/engine.js";

async function loadReadingOrg() {
  const res = await fetch("./data/reading.org?v=" + Date.now());
  if (!res.ok) throw new Error("reading.org load failed");
  return res.text();
}

function statsAsOrg(stats) {
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");

  const recent = (stats.recent.length ? stats.recent : stats.books.slice(0, 8))
    .slice(0, 8)
    .map((b) => {
      const ts = b.date ? ` <${b.date}>` : "";
      const tags = b.tags?.length ? ` :${b.tags.join(":")}:` : "";
      const metaLine =
        `\n:PROPERTIES:\n:WORDS: ${b.words || 0}\n:DURATION: ${formatDuration(b.durationMin || 0)}\n:END:`;
      return `** ${b.todo} ${b.title}${ts}${tags}${metaLine}`;
    })
    .join("\n");

  const byBook = stats.books
    .filter((b) => b.words || b.durationMin)
    .sort((a, b) => (b.words || 0) - (a.words || 0))
    .slice(0, 12)
    .map((b) => `- ${b.title} :: 字数 ${formatWords(b.words)} · 时长 ${formatDuration(b.durationMin)}`)
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:READING: ${stats.reading}
:DONE: ${stats.done}
:RECENT_DAYS: ${stats.recentDays}
:RECENT_COUNT: ${stats.recent.length}
:WORDS_TOTAL: ${stats.totalWords}
:DURATION_TOTAL: ${formatDuration(stats.totalDurationMin)}
:WORDS_RECENT: ${stats.recentWords}
:DURATION_RECENT: ${formatDuration(stats.recentDurationMin)}
:END:

** 字数与时长
- 总字数 :: ${formatWords(stats.totalWords)}（${stats.totalWords}）
- 总时长 :: ${formatDuration(stats.totalDurationMin)}（${stats.totalDurationMin} 分钟）
- 在读字数 :: ${formatWords(stats.readingWords)}
- 在读时长 :: ${formatDuration(stats.readingDurationMin)}
- 已读完字数 :: ${formatWords(stats.doneWords)}
- 已读完时长 :: ${formatDuration(stats.doneDurationMin)}
- 近 ${stats.recentDays} 天字数 :: ${formatWords(stats.recentWords)}
- 近 ${stats.recentDays} 天时长 :: ${formatDuration(stats.recentDurationMin)}

** 按条目
${byBook || "- （条目尚未填写 :WORDS: / :DURATION:）"}

** TODO 计数
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
    if (fold && !fold.disabled) fold.classList.toggle("is-collapsed", !expand);
    const row = h.querySelector(":scope > .org-h-row");
    if (row) row.setAttribute("aria-expanded", expand ? "true" : "false");
  });
}

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
    const merged = statsAsOrg(stats) + text;
    const doc = parseOrg(merged);
    renderOrg(doc, orgRoot, { classic: true });

    const ml = root.querySelector("#org-modeline-stats");
    if (ml) {
      ml.textContent =
        `字数 ${formatWords(stats.totalWords)} · 时长 ${formatDuration(stats.totalDurationMin)} · ` +
        `READING:${stats.reading} DONE:${stats.done}`;
    }

    root.querySelector("#org-showall")?.addEventListener("click", () => setOutline(orgRoot, true));
    root.querySelector("#org-overview")?.addEventListener("click", () => setOutline(orgRoot, false));
  } catch (e) {
    console.error(e);
    orgRoot.innerHTML = '<p class="empty">无法加载 data/reading.org</p>';
  }
}
