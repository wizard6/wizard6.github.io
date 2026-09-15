import { esc } from "../utils.js";

const TODO_KEY = "wizard6_workbench_todos_v1";

export function mergeTodos(configTodos) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(TODO_KEY) || "null"); } catch (_) {}
  if (!saved || !Array.isArray(saved)) return configTodos.map((t) => ({ ...t }));
  const map = Object.fromEntries(saved.map((t) => [t.id, t.done]));
  return configTodos.map((t) => ({ ...t, done: map[t.id] ?? t.done }));
}

function saveTodos(todos) {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos.map(({ id, done }) => ({ id, done }))));
}

export function renderTodos(todos) {
  const root = document.getElementById("todo-list");
  if (!root) return;
  if (!todos.length) {
    root.innerHTML = '<p class="empty">暂无待办。可在 config/workbench.json 添加。</p>';
    return;
  }
  root.innerHTML = todos.map((t) => `
    <li class="todo-item ${t.done ? "done" : ""}" data-id="${esc(t.id)}">
      <input type="checkbox" ${t.done ? "checked" : ""} aria-label="完成" />
      <div class="todo-text">${esc(t.text)}</div>
      <span class="tag">${esc(t.tag || "一般")}</span>
    </li>
  `).join("");
  root.querySelectorAll(".todo-item input").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.closest(".todo-item").dataset.id;
      const item = todos.find((x) => x.id === id);
      if (!item) return;
      item.done = input.checked;
      saveTodos(todos);
      renderTodos(todos);
    });
  });
}
