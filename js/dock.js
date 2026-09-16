/**
 * Left vertical dock — renders from config.shortcuts
 */

const DEFAULTS = [
  { id: "overview", icon: "⌂", title: "概览" },
  { id: "todos", icon: "☐", title: "待办" },
  { id: "status", icon: "●", title: "状态" },
  { id: "templates", icon: "▦", title: "模板" },
  { id: "nav", icon: "⧉", title: "导航" },
  { id: "stack", icon: "⊞", title: "软件账号" },
  { id: "reading", icon: "≡", title: "读书" },
  { id: "booklist", icon: "☰", title: "书单" },
  { id: "writing", icon: "✎", title: "创作" },
  { id: "ideas", icon: "✶", title: "灵感" },
  { id: "journal", icon: "▣", title: "日志" },
  { id: "journal-json", icon: "⊡", title: "JSON日志" },
  { id: "calendar", icon: "▥", title: "日历" },
  { id: "stats-db", icon: "⬡", title: "数值库" },
  { id: "stickers", icon: "▤", title: "贴图" },
  { id: "run", icon: "▷", title: "运行" },
];

function normalizeList(shortcuts) {
  return Array.isArray(shortcuts) && shortcuts.length ? shortcuts : DEFAULTS;
}

function renderButtons(dock, list) {
  dock.innerHTML = list
    .map(
      (s) => `
    <button type="button" class="dock-btn" data-id="${s.id}" title="${s.title}" aria-label="${s.title}">
      <span class="dock-ico" aria-hidden="true">${s.icon}</span>
      <span class="dock-tip">${s.title}</span>
    </button>
  `
    )
    .join("");
}

function wire(dock, onOpen) {
  dock.querySelectorAll(".dock-btn").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (id && typeof onOpen === "function") onOpen(id);
    };
  });
}

/**
 * @param {Array<{id:string,icon:string,title:string}>} shortcuts
 * @param {(id: string) => void} onOpen
 */
export function initDock(shortcuts, onOpen) {
  const dock = document.getElementById("dock");
  if (!dock) return;
  const list = normalizeList(shortcuts);
  // Always (re)render so config icons/titles win; static HTML is fallback before JS
  renderButtons(dock, list);
  wire(dock, onOpen);
}

export function setDockActive(id) {
  document.querySelectorAll(".dock-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.id === id);
  });
}

export function renderDesktopIcons(shortcuts, onOpen) {
  const host = document.getElementById("desktop-icons");
  if (!host) return;
  const list = normalizeList(shortcuts).filter((s) => !["stickers", "run"].includes(s.id));
  host.innerHTML = list
    .map(
      (s) => `
    <button type="button" class="desk-icon" data-id="${s.id}" title="${s.title}">
      <span class="ico" aria-hidden="true">${s.icon}</span>
      <span class="lbl">${s.title}</span>
    </button>
  `
    )
    .join("");
  host.querySelectorAll(".desk-icon").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (id && typeof onOpen === "function") onOpen(id);
    };
  });
}
