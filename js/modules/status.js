import { esc } from "../utils.js";

export function renderStatus(status, daypart) {
  const root = document.getElementById("status-grid");
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
