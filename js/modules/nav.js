import { esc } from "../utils.js";

/**
 * @param {Array} list
 * @param {HTMLElement} [rootEl] optional root (defaults to #nav-groups)
 */
export function renderNav(list, rootEl) {
  const root = rootEl || document.getElementById("nav-groups");
  if (!root) return;
  if (!list?.length) { root.innerHTML = '<p class="empty">暂无导航。</p>'; return; }
  const groups = {};
  list.forEach((n) => { const g = n.group || "其他"; (groups[g] ||= []).push(n); });
  root.innerHTML = Object.entries(groups).map(([g, items]) => `
    <div>
      <p class="nav-group-title">${esc(g)}</p>
      <div class="nav-list">
        ${items.map((n) => `
          <a class="nav-item" href="${esc(n.url)}" target="_blank" rel="noreferrer">
            <strong>${esc(n.name)}</strong>
          </a>
        `).join("")}
      </div>
    </div>
  `).join("");
}
