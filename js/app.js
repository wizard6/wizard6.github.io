import { initScrollbar } from "./scrollbar.js";
import { renderTodos, mergeTodos } from "./modules/todos.js";
import { renderStatus } from "./modules/status.js";
import { renderTemplates } from "./modules/templates.js";
import { renderNav } from "./modules/nav.js";
import { renderSoftware } from "./modules/stack.js";

function tick() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = hh + ":" + mm;
  const h = now.getHours();
  const daypart = document.getElementById("daypart");
  if (daypart) {
    daypart.textContent =
      h < 6 ? "深夜" : h < 12 ? "上午" : h < 18 ? "下午" : "夜晚";
  }
}

function setModCount() {
  const count = document.getElementById("mod-count");
  if (count) count.textContent = document.querySelectorAll("#modules > .card").length;
}

async function loadConfig() {
  const res = await fetch("./config/workbench.json?v=" + Date.now());
  if (!res.ok) throw new Error("config load failed");
  return res.json();
}

async function hydrateWorkbench() {
  try {
    const cfg = await loadConfig();
    if (cfg.title) {
      const h1 = document.querySelector(".hero h1");
      if (h1) h1.textContent = cfg.title;
    }
    if (cfg.subtitle) {
      const d = document.querySelector(".hero-desc");
      if (d) d.textContent = cfg.subtitle;
    }
    const dayEl = document.getElementById("daypart");
    const daypart = dayEl ? dayEl.textContent : "";
    renderTodos(mergeTodos(cfg.todos || []));
    renderStatus(cfg.status || {}, daypart);
    renderTemplates(cfg.templates || []);
    renderNav(cfg.nav || []);
    renderSoftware(cfg.software || []);
    setModCount();
  } catch (e) {
    const todo = document.getElementById("todo-list");
    if (todo) todo.innerHTML = '<p class="empty">配置加载失败，请检查 config/workbench.json</p>';
    console.error(e);
  }
}

tick();
setInterval(tick, 15000);
setModCount();
initScrollbar("board", "sb-rail", "sb-thumb");
hydrateWorkbench();
