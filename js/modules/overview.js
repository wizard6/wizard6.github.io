import { esc } from "../utils.js";

function daypartLabel() {
  const h = new Date().getHours();
  return h < 6 ? "深夜" : h < 12 ? "上午" : h < 18 ? "下午" : "夜晚";
}

/**
 * Render overview (hero stats + work-area cards) into a container.
 * @param {HTMLElement} root
 * @param {object} cfg
 */
export function renderOverview(root, cfg = {}) {
  if (!root) return;
  const overview = cfg.overview || {};
  const stats = overview.stats || {};
  const cards = overview.cards || [];
  const title = cfg.title || "云端工作台";
  const subtitle = cfg.subtitle || "";
  const day = daypartLabel();

  const cardHtml = cards
    .map((c) => {
      const badgeClass = c.badgeClass ? ` badge ${c.badgeClass}` : " badge";
      const inner = `
        <div class="ov-kicker">
          <div class="card-icon">${esc(c.icon || "◇")}</div>
          <span class="${badgeClass.trim()}">${esc(c.badge || "")}</span>
        </div>
        <h3>${esc(c.title || "")}</h3>
        <p>${esc(c.desc || "")}</p>
        <div class="ov-foot"><b>进入</b><span>${esc(c.foot || "")}</span></div>
      `;
      return c.url
        ? `<a class="ov-card" href="${esc(c.url)}" target="_blank" rel="noreferrer">${inner}</a>`
        : `<div class="ov-card ov-card--static">${inner}</div>`;
    })
    .join("");

  root.innerHTML = `
    <div class="overview">
      <div class="ov-hero">
        <div class="hero-eyebrow">Cloud Workbench</div>
        <h2 class="ov-title">${esc(title)}</h2>
        <p class="ov-desc">${esc(subtitle)}</p>
        <div class="ov-stats">
          <div class="stat"><strong>${esc(String(stats.modules ?? (cards.length || 7)))}</strong><span>工作区模块</span></div>
          <div class="stat"><strong>${esc(stats.github || "GitHub")}</strong><span>已连接账号</span></div>
          <div class="stat"><strong id="daypart">${esc(day)}</strong><span>当前时段</span></div>
        </div>
        <div class="quick ov-quick">
          <a class="chip" href="https://github.com/wizard6" target="_blank" rel="noreferrer">打开 GitHub</a>
          <a class="chip" href="https://github.com/wizard6?tab=repositories" target="_blank" rel="noreferrer">仓库列表</a>
          <a class="chip" href="https://github.com/wizard6/wizard6.github.io" target="_blank" rel="noreferrer">本站源码</a>
        </div>
      </div>
      <div class="ov-grid">${cardHtml}</div>
    </div>
  `;
}
