import { esc } from "../utils.js";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

async function loadJournalEntries() {
  try {
    const res = await fetch("./data/journal.json?v=" + Date.now());
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (_) {
    return [];
  }
}

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(y, m0) {
  return `${y} 年 ${m0 + 1} 月`;
}

function buildIndex(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!e?.date) continue;
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date).push(e);
  }
  return map;
}

/**
 * @param {HTMLElement} root
 */
export async function renderCalendar(root) {
  const today = new Date();
  let viewY = today.getFullYear();
  let viewM = today.getMonth(); // 0-based
  let selected = ymd(today);

  root.innerHTML = `
    <div class="cal">
      <div class="cal-bar">
        <button type="button" class="cal-nav" data-act="prev" aria-label="上一月">‹</button>
        <h2 class="cal-title" data-title></h2>
        <button type="button" class="cal-nav" data-act="next" aria-label="下一月">›</button>
        <button type="button" class="cal-today-btn" data-act="today">今天</button>
      </div>
      <div class="cal-weekdays">${WEEKDAYS.map((w) => `<span>${w}</span>`).join("")}</div>
      <div class="cal-grid" data-grid></div>
      <div class="cal-side">
        <div class="cal-side-head" data-side-head>选择日期</div>
        <div class="cal-side-list" data-side-list><p class="empty">加载中…</p></div>
      </div>
      <div class="cal-foot">
        <span data-ml>—</span>
        <span>标记来自 journal.json</span>
      </div>
    </div>
  `;

  const titleEl = root.querySelector("[data-title]");
  const gridEl = root.querySelector("[data-grid]");
  const sideHead = root.querySelector("[data-side-head]");
  const sideList = root.querySelector("[data-side-list]");
  const ml = root.querySelector("[data-ml]");

  const entries = await loadJournalEntries();
  const byDate = buildIndex(entries);

  function renderSide(dateStr) {
    sideHead.textContent = dateStr;
    const list = byDate.get(dateStr) || [];
    if (!list.length) {
      sideList.innerHTML = '<p class="empty">这一天没有 JSON 日志</p>';
      return;
    }
    sideList.innerHTML = list
      .map((e) => {
        const tags = (e.tags || []).map((t) => `<span class="cal-tag">${esc(t)}</span>`).join("");
        return `
          <article class="cal-entry">
            <div class="cal-entry-top">
              <span class="cal-entry-type">${esc(e.type || "NOTE")}</span>
              <strong>${esc(e.title || "(无标题)")}</strong>
            </div>
            ${e.body ? `<p>${esc(e.body)}</p>` : ""}
            ${tags ? `<div class="cal-tags">${tags}</div>` : ""}
          </article>`;
      })
      .join("");
  }

  function paint() {
    titleEl.textContent = monthLabel(viewY, viewM);
    const first = new Date(viewY, viewM, 1);
    // Monday-first: getDay Sun=0 -> 6, Mon=1 -> 0
    let startPad = first.getDay() - 1;
    if (startPad < 0) startPad = 6;
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(`<button type="button" class="cal-day is-out" disabled></button>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewY}-${String(viewM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const count = (byDate.get(dateStr) || []).length;
      const isToday = dateStr === ymd(today);
      const isSel = dateStr === selected;
      const cls = [
        "cal-day",
        isToday ? "is-today" : "",
        isSel ? "is-selected" : "",
        count ? "has-log" : "",
      ]
        .filter(Boolean)
        .join(" ");
      cells.push(
        `<button type="button" class="${cls}" data-date="${dateStr}">
          <span class="cal-num">${d}</span>
          ${count ? `<span class="cal-dot" title="${count} 条">${count}</span>` : ""}
        </button>`
      );
    }
    while (cells.length % 7 !== 0) cells.push(`<button type="button" class="cal-day is-out" disabled></button>`);
    gridEl.innerHTML = cells.join("");

    gridEl.querySelectorAll(".cal-day[data-date]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selected = btn.dataset.date;
        paint();
        renderSide(selected);
      });
    });

    const marked = [...byDate.keys()].filter((k) => k.startsWith(`${viewY}-${String(viewM + 1).padStart(2, "0")}`)).length;
    if (ml) ml.textContent = `${monthLabel(viewY, viewM)} · 有日志 ${marked} 天 · 全库 ${byDate.size} 天`;
    renderSide(selected);
  }

  root.querySelector('[data-act="prev"]').addEventListener("click", () => {
    viewM -= 1;
    if (viewM < 0) {
      viewM = 11;
      viewY -= 1;
    }
    paint();
  });
  root.querySelector('[data-act="next"]').addEventListener("click", () => {
    viewM += 1;
    if (viewM > 11) {
      viewM = 0;
      viewY += 1;
    }
    paint();
  });
  root.querySelector('[data-act="today"]').addEventListener("click", () => {
    viewY = today.getFullYear();
    viewM = today.getMonth();
    selected = ymd(today);
    paint();
  });

  paint();
}
