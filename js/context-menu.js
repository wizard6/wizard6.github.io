/**
 * Desktop right-click context menu.
 */

let menuEl = null;
let onAction = null;

function ensureMenu() {
  if (menuEl) return menuEl;
  menuEl = document.createElement("div");
  menuEl.id = "ctx-menu";
  menuEl.className = "ctx-menu";
  menuEl.hidden = true;
  menuEl.setAttribute("role", "menu");
  document.body.appendChild(menuEl);
  return menuEl;
}

function hideMenu() {
  const el = ensureMenu();
  el.hidden = true;
  el.innerHTML = "";
}

function placeMenu(x, y) {
  const el = ensureMenu();
  el.hidden = false;
  // measure after paint
  const pad = 8;
  const rect = el.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - pad;
  const maxY = window.innerHeight - rect.height - pad;
  el.style.left = Math.max(pad, Math.min(x, maxX)) + "px";
  el.style.top = Math.max(pad, Math.min(y, maxY)) + "px";
}

function item(label, action, { disabled = false, danger = false, kbd = "" } = {}) {
  return {
    type: "item",
    label,
    action,
    disabled,
    danger,
    kbd,
  };
}

function sep() {
  return { type: "sep" };
}

function defaultItems() {
  return [
    item("打开概览", "open:overview"),
    item("打开待办", "open:todos"),
    item("打开状态", "open:status"),
    sep(),
    item("模板", "open:templates"),
    item("导航", "open:nav"),
    item("软件与账号", "open:stack"),
    item("最近读书", "open:reading"),
    item("书单", "open:booklist"),
    item("正在创作", "open:writing"),
    item("灵感管理", "open:ideas"),
    sep(),
    item("贴图", "open:stickers"),
    item("运行…", "open:run", { kbd: "Alt+R" }),
    sep(),
    item("刷新页面", "reload"),
  ];
}

function renderItems(items) {
  const el = ensureMenu();
  el.innerHTML = items
    .map((it) => {
      if (it.type === "sep") return '<div class="ctx-sep" role="separator"></div>';
      const cls = [
        "ctx-item",
        it.disabled ? "is-disabled" : "",
        it.danger ? "is-danger" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const kbd = it.kbd ? `<span class="ctx-kbd">${it.kbd}</span>` : "";
      return `<button type="button" class="${cls}" role="menuitem" data-action="${it.action}" ${
        it.disabled ? "disabled" : ""
      }><span class="ctx-label">${it.label}</span>${kbd}</button>`;
    })
    .join("");

  el.querySelectorAll(".ctx-item:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      hideMenu();
      if (typeof onAction === "function") onAction(action);
    });
  });
}

/**
 * @param {(action: string) => void} handler
 */
export function initContextMenu(handler) {
  onAction = handler;
  ensureMenu();

  // Desktop / empty chrome — not on dock buttons / windows / interactive controls by default,
  // but allow desktop surface and nebula area.
  document.addEventListener("contextmenu", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    // Allow native menu inside form fields
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;

    // Custom menu on desktop shell
    const onDesktop =
      t.closest(".desktop") ||
      t.closest(".nebula") ||
      t.id === "sticker-layer" ||
      t.closest(".dock") ||
      t === document.body ||
      t === document.documentElement;

    if (!onDesktop) return;

    // On a window: show window-oriented menu
    const win = t.closest(".win");
    e.preventDefault();

    let items;
    if (win) {
      const id = win.dataset.id || "";
      items = [
        item("最小化", `win:min:${id}`),
        item("最大化 / 还原", `win:max:${id}`),
        item("关闭", `win:close:${id}`, { danger: true }),
        sep(),
        item("打开概览", "open:overview"),
        item("运行…", "open:run", { kbd: "Alt+R" }),
        sep(),
        item("刷新页面", "reload"),
      ];
    } else if (t.closest(".dock-btn")) {
      const id = t.closest(".dock-btn").dataset.id || "";
      items = [
        item("打开", `open:${id}`),
        item("在新窗聚焦", `open:${id}`),
        sep(),
        item("运行…", "open:run", { kbd: "Alt+R" }),
        item("刷新页面", "reload"),
      ];
    } else {
      items = defaultItems();
    }

    renderItems(items);
    placeMenu(e.clientX, e.clientY);
  });

  document.addEventListener("pointerdown", (e) => {
    const el = ensureMenu();
    if (el.hidden) return;
    if (e.target instanceof Element && e.target.closest("#ctx-menu")) return;
    hideMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideMenu();
  });

  window.addEventListener("blur", hideMenu);
  window.addEventListener("resize", hideMenu);
  document.addEventListener("scroll", hideMenu, true);
}
