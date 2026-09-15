import { initWm, openWindow, minimizeWindow, maximizeWindow, closeWindow } from "./wm.js";
import { initDock, setDockActive, renderDesktopIcons } from "./dock.js";
import { renderTodos, mergeTodos } from "./modules/todos.js";
import { renderStatus } from "./modules/status.js";
import { renderTemplates } from "./modules/templates.js";
import { renderNav } from "./modules/nav.js";
import { renderSoftware } from "./modules/stack.js";
import { renderOverview } from "./modules/overview.js";
import { renderPlaceholder } from "./modules/placeholder.js";
import { initContextMenu } from "./context-menu.js";
import { renderReading } from "./modules/reading.js";
import { renderBooklist } from "./modules/booklist.js";
import { renderWriting } from "./modules/writing.js";
import { renderIdeas } from "./modules/ideas.js";

let cfg = null;
let todosCache = [];

function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = hh + ":" + mm;
  const h = now.getHours();
  const daypart = h < 6 ? "深夜" : h < 12 ? "上午" : h < 18 ? "下午" : "夜晚";
  document.querySelectorAll("#daypart").forEach((el) => {
    el.textContent = daypart;
  });
}

function daypartNow() {
  const h = new Date().getHours();
  return h < 6 ? "深夜" : h < 12 ? "上午" : h < 18 ? "下午" : "夜晚";
}

async function loadConfig() {
  const res = await fetch("./config/workbench.json?v=" + Date.now());
  if (!res.ok) throw new Error("config load failed");
  return res.json();
}

function shortcutMeta(id) {
  const list = cfg?.shortcuts || [];
  return list.find((s) => s.id === id) || { id, icon: "◇", title: id };
}

function openShortcut(id) {
  const meta = shortcutMeta(id);
  setDockActive(id);

  switch (id) {
    case "overview":
      openWindow("overview", {
        title: meta.title || "概览",
        icon: meta.icon || "⌂",
        width: 560,
        height: 520,
        mount(body) {
          renderOverview(body, cfg || {});
        },
      });
      break;

    case "todos":
      openWindow("todos", {
        title: meta.title || "待办",
        icon: meta.icon || "☐",
        width: 420,
        height: 400,
        mount(body) {
          body.innerHTML = '<ul class="todo-list" id="todo-list"></ul>';
          const list = body.querySelector("#todo-list");
          renderTodos(todosCache.length ? todosCache : mergeTodos(cfg?.todos || []), list);
        },
      });
      break;

    case "status":
      openWindow("status", {
        title: meta.title || "状态",
        icon: meta.icon || "●",
        width: 400,
        height: 360,
        mount(body) {
          body.innerHTML = '<div class="status-grid" id="status-grid"></div>';
          renderStatus(cfg?.status || {}, daypartNow(), body.querySelector("#status-grid"));
        },
      });
      break;

    case "templates":
      openWindow("templates", {
        title: meta.title || "模板",
        icon: meta.icon || "▦",
        width: 420,
        height: 400,
        mount(body) {
          body.innerHTML = '<div class="tpl-list" id="tpl-list"></div>';
          renderTemplates(cfg?.templates || [], body.querySelector("#tpl-list"));
        },
      });
      break;

    case "nav":
      openWindow("nav", {
        title: meta.title || "导航",
        icon: meta.icon || "⧉",
        width: 400,
        height: 420,
        mount(body) {
          body.innerHTML = '<div class="nav-groups" id="nav-groups"></div>';
          renderNav(cfg?.nav || [], body.querySelector("#nav-groups"));
        },
      });
      break;

    case "stack":
      openWindow("stack", {
        title: meta.title || "软件账号",
        icon: meta.icon || "⊞",
        width: 480,
        height: 420,
        mount(body) {
          body.innerHTML = '<div class="soft-list" id="soft-list"></div>';
          renderSoftware(cfg?.software || [], body.querySelector("#soft-list"));
        },
      });
      break;



    case "booklist":
      openWindow("booklist", {
        title: meta.title || "书单",
        icon: meta.icon || "☰",
        width: 640,
        height: 560,
        mount(body) {
          renderBooklist(body);
        },
      });
      break;


    case "ideas":
      openWindow("ideas", {
        title: meta.title || "灵感",
        icon: meta.icon || "✶",
        width: 640,
        height: 560,
        mount(body) {
          renderIdeas(body);
        },
      });
      break;

    case "writing":
      openWindow("writing", {
        title: meta.title || "创作",
        icon: meta.icon || "✎",
        width: 640,
        height: 560,
        mount(body) {
          renderWriting(body);
        },
      });
      break;

    case "reading":
      openWindow("reading", {
        title: meta.title || "读书",
        icon: meta.icon || "≡",
        width: 640,
        height: 560,
        mount(body) {
          renderReading(body);
        },
      });
      break;

    case "stickers":
      openWindow("stickers", {
        title: meta.title || "贴图",
        icon: meta.icon || "▤",
        width: 360,
        height: 280,
        mount(body) {
          renderPlaceholder(body, {
            icon: "🖼",
            title: "贴图",
            hint: "桌面贴图层即将接入。可在 #sticker-layer 放置装饰与便签。",
          });
        },
      });
      break;

    case "run":
      openRunPlaceholder();
      break;

    default:
      openWindow(id, {
        title: meta.title || id,
        icon: meta.icon || "◇",
        width: 360,
        height: 260,
        mount(body) {
          renderPlaceholder(body, { icon: meta.icon, title: meta.title, hint: "未知模块。" });
        },
      });
  }
}

function openRunPlaceholder() {
  const meta = shortcutMeta("run");
  openWindow("run", {
    title: meta.title || "运行",
    icon: meta.icon || "▷",
    width: 400,
    height: 280,
    mount(body) {
      renderPlaceholder(body, {
        icon: "▷",
        title: "快速运行",
        // Win+R will map later; for now Alt+R / dock only (Ctrl+R left to browser)
        hint: "即将接入 Win+R 风格快速运行。当前可用 Alt+R 或左侧「运行」打开此占位。",
      });
    },
  });
  setDockActive("run");
}

function wireHotkeys() {
  // Prefer Alt+R for run stub — do NOT hijack Ctrl+R (browser refresh).
  // Meta+R / Win+R can be mapped later when stickers/run land.
  document.addEventListener("keydown", (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "r" || e.key === "R")) {
      e.preventDefault();
      openRunPlaceholder();
    }
  });
}

async function boot() {
  tick();
  setInterval(tick, 15000);
  initWm();
  wireHotkeys();
  initContextMenu((action) => {
    if (action === "reload") {
      location.reload();
      return;
    }
    if (action.startsWith("open:")) {
      openShortcut(action.slice(5));
      return;
    }
    if (action.startsWith("win:min:")) {
      minimizeWindow(action.slice(8));
      return;
    }
    if (action.startsWith("win:max:")) {
      maximizeWindow(action.slice(8));
      return;
    }
    if (action.startsWith("win:close:")) {
      closeWindow(action.slice(10));
    }
  });

  // Show dock immediately (defaults), don't wait on network
  initDock(null, openShortcut);
  renderDesktopIcons(null, openShortcut);

  try {
    cfg = await loadConfig();
  } catch (e) {
    console.error(e);
    cfg = { shortcuts: [], todos: [], status: {}, templates: [], nav: [], software: [] };
  }

  todosCache = mergeTodos(cfg.todos || []);

  const pillLabel = document.querySelector(".pill-label");
  if (pillLabel && cfg.status?.label) pillLabel.textContent = cfg.status.label;

  // Refresh from config
  initDock(cfg.shortcuts, openShortcut);
  renderDesktopIcons(cfg.shortcuts, openShortcut);

  // First visit: open overview so the desktop is not empty
  try {
    if (!sessionStorage.getItem("wb_opened")) {
      sessionStorage.setItem("wb_opened", "1");
      openShortcut("overview");
    }
  } catch (_) {
    openShortcut("overview");
  }
}

boot();
