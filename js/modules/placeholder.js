import { esc } from "../utils.js";

/**
 * Simple "即将接入" placeholder for stickers / run stubs.
 * @param {HTMLElement} root
 * @param {{ title?: string, icon?: string, hint?: string }} opts
 */
export function renderPlaceholder(root, opts = {}) {
  if (!root) return;
  const title = opts.title || "即将接入";
  const icon = opts.icon || "◇";
  const hint = opts.hint || "此功能尚未接入，敬请期待。";
  root.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-ico" aria-hidden="true">${esc(icon)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(hint)}</p>
      <span class="chip" style="cursor:default;">即将接入</span>
    </div>
  `;
}
