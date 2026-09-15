import { esc } from "../utils.js";

/**
 * @param {Array} list
 * @param {HTMLElement} [rootEl] optional root (defaults to #soft-list)
 */
export function renderSoftware(list, rootEl) {
  const root = rootEl || document.getElementById("soft-list");
  if (!root) return;
  if (!list?.length) { root.innerHTML = '<p class="empty">暂无软件/账号。</p>'; return; }
  root.innerHTML = list.map((s) => {
    const body = `
      <div class="left">
        <strong>${esc(s.name)}</strong>
        <div class="meta">${esc(s.account || "")} · ${esc(s.use || "")}</div>
      </div>
      <span class="kind">${esc(s.kind || "其他")}</span>`;
    return s.url
      ? `<a class="soft-item" href="${esc(s.url)}" target="_blank" rel="noreferrer">${body}</a>`
      : `<div class="soft-item">${body}</div>`;
  }).join("");
}
