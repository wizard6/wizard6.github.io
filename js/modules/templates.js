import { esc } from "../utils.js";

/**
 * @param {Array} list
 * @param {HTMLElement} [rootEl] optional root (defaults to #tpl-list)
 */
export function renderTemplates(list, rootEl) {
  const root = rootEl || document.getElementById("tpl-list");
  if (!root) return;
  if (!list?.length) { root.innerHTML = '<p class="empty">暂无模板。</p>'; return; }
  root.innerHTML = list.map((t) => {
    const inner = `<strong>${esc(t.name)}</strong><div class="meta">${esc(t.desc || "")} · ${esc(t.tag || "")}</div>`;
    return t.url
      ? `<a class="tpl-item" href="${esc(t.url)}" target="_blank" rel="noreferrer">${inner}</a>`
      : `<div class="tpl-item">${inner}</div>`;
  }).join("");
}
