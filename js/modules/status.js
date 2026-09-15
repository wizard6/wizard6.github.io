import { esc } from "../utils.js";

/**
 * @param {object} status
 * @param {string} daypart
 * @param {HTMLElement} [rootEl] optional root (defaults to #status-grid)
 */
export function renderStatus(status, daypart, rootEl) {
  const root = rootEl || document.getElementById("status-grid");
  if (!root) return;
  const rows = [
    ["在线", status.online ? (status.label || "云端在线") : "离线"],
    ["焦点", status.focus || "—"],
    ["状态", status.mood || "—"],
    ["时段", daypart || "—"],
    ["备注", status.note || "—"],
  ];
  root.innerHTML = rows.map(([k, v]) => `
    <div class="status-row"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>
  `).join("");
}
