/**
 * Left vertical dock — renders from config.shortcuts
 */

/**
 * @param {Array<{id:string,icon:string,title:string}>} shortcuts
 * @param {(id: string) => void} onOpen
 */
export function initDock(shortcuts, onOpen) {
  const dock = document.getElementById("dock");
  if (!dock) return;

  const list = Array.isArray(shortcuts) && shortcuts.length
    ? shortcuts
    : [
        { id: "overview", icon: "☁", title: "概览" },
        { id: "todos", icon: "☑", title: "待办" },
        { id: "status", icon: "◉", title: "状态" },
        { id: "templates", icon: "▦", title: "模板" },
        { id: "nav", icon: "⧉", title: "导航" },
        { id: "stack", icon: "⊞", title: "软件账号" },
        { id: "stickers", icon: "🖼", title: "贴图" },
        { id: "run", icon: "▷", title: "运行" },
      ];

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

  dock.querySelectorAll(".dock-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      if (id && typeof onOpen === "function") onOpen(id);
    });
  });
}

export function setDockActive(id) {
  document.querySelectorAll(".dock-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.id === id);
  });
}
