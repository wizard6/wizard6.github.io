import { parseOrg, renderOrg, orgReadingStats } from "../org/engine.js";
import { esc } from "../utils.js";

async function loadReadingOrg() {
  const res = await fetch("./data/reading.org?v=" + Date.now());
  if (!res.ok) throw new Error("reading.org load failed");
  return res.text();
}

function renderStats(stats, host) {
  const todoChips = Object.entries(stats.byTodo)
    .map(([k, v]) => `<span class="read-chip"><b>${esc(k)}</b> ${v}</span>`)
    .join("");

  const recentRows = (stats.recent.length ? stats.recent : stats.books.slice(0, 8))
    .slice(0, 10)
    .map(
      (b) => `
      <li class="read-row">
        <span class="org-todo ${b.done ? "is-done" : "is-todo"}">${esc(b.todo)}</span>
        <span class="read-title">${esc(b.title)}</span>
        <span class="read-date">${esc(b.date || "—")}</span>
      </li>`
    )
    .join("");

  host.innerHTML = `
    <div class="read-stats">
      <div class="read-stat"><strong>${stats.totalTracked}</strong><span>条目</span></div>
      <div class="read-stat"><strong>${stats.reading}</strong><span>在读</span></div>
      <div class="read-stat"><strong>${stats.done}</strong><span>已读完</span></div>
      <div class="read-stat"><strong>${stats.recent.length}</strong><span>${stats.recentDays}天内</span></div>
    </div>
    <div class="read-chips">${todoChips || '<span class="muted">暂无 TODO 状态</span>'}</div>
    <h3 class="read-h">最近动态</h3>
    <ul class="read-recent">${recentRows || '<li class="empty">暂无读书记录</li>'}</ul>
  `;
}

/**
 * @param {HTMLElement} root
 */
export async function renderReading(root) {
  root.innerHTML = `
    <div class="reading-app">
      <div class="reading-toolbar">
        <span class="muted">org-mode 显示引擎 · data/reading.org</span>
        <button type="button" class="read-btn" id="read-expand">全部展开</button>
        <button type="button" class="read-btn" id="read-collapse">全部折叠</button>
      </div>
      <div class="reading-stats" id="reading-stats"></div>
      <div class="reading-org" id="reading-org"><p class="empty">加载中…</p></div>
    </div>
  `;

  try {
    const text = await loadReadingOrg();
    const doc = parseOrg(text);
    const stats = orgReadingStats(doc);
    renderStats(stats, root.querySelector("#reading-stats"));
    const orgRoot = root.querySelector("#reading-org");
    renderOrg(doc, orgRoot);

    root.querySelector("#read-expand")?.addEventListener("click", () => {
      orgRoot.querySelectorAll(".org-h").forEach((h) => {
        h.classList.remove("is-collapsed");
        const body = h.querySelector(":scope > .org-h-body");
        const fold = h.querySelector(":scope > .org-h-row .org-fold");
        if (body) body.hidden = false;
        if (fold && !fold.disabled) fold.textContent = "▾";
      });
    });
    root.querySelector("#read-collapse")?.addEventListener("click", () => {
      orgRoot.querySelectorAll('.org-h[data-level]:not([data-level="1"])').forEach((h) => {
        h.classList.add("is-collapsed");
        const body = h.querySelector(":scope > .org-h-body");
        const fold = h.querySelector(":scope > .org-h-row .org-fold");
        if (body) body.hidden = true;
        if (fold && !fold.disabled) fold.textContent = "▸";
      });
    });
  } catch (e) {
    console.error(e);
    root.querySelector("#reading-org").innerHTML =
      '<p class="empty">无法加载 data/reading.org，请检查仓库文件。</p>';
  }
}
