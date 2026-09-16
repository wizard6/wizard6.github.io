import { esc } from "../utils.js";

async function loadDb() {
  const res = await fetch("./data/stats-db.json?v=" + Date.now());
  if (!res.ok) throw new Error("stats-db.json load failed");
  return res.json();
}

/** Very small safe expression eval for design formulas. */
function evalFormula(formula, params, x) {
  if (!formula || typeof formula !== "string") return null;
  const env = { ...(params || {}), level: x, x, Level: x };
  const FN = {
    min: "Math.min",
    max: "Math.max",
    round: "Math.round",
    floor: "Math.floor",
    ceil: "Math.ceil",
    abs: "Math.abs",
    pow: "Math.pow",
  };
  let expr = formula.trim().replace(/\^/g, "**");
  expr = expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (id, offset, str) => {
    if (id === "Math") return id;
    const after = str.slice(offset + id.length);
    if (after.startsWith("(") && Object.prototype.hasOwnProperty.call(FN, id)) return FN[id];
    if (Object.prototype.hasOwnProperty.call(env, id)) {
      const v = env[id];
      return typeof v === "number" && Number.isFinite(v) ? String(v) : "NaN";
    }
    return "NaN";
  });
  const stripped = expr.replace(/Math\.(min|max|round|floor|ceil|abs|pow)/g, "").replace(/\*\*/g, "");
  if (!/^[\d\s+\-*/%().,]+$/.test(stripped)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const v = new Function(`"use strict"; return (${expr});`)();
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch (_) {
    return null;
  }
}

function pointsFromEntry(entry, xMax = 20) {
  const pts = [];
  if (Array.isArray(entry.table) && entry.table.length) {
    for (const row of entry.table) {
      const x = Number(row.level ?? row.key ?? row.x);
      const y = Number(row.value ?? row.y ?? row.v);
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y, src: "table" });
    }
  }
  if (entry.formula) {
    const xs = new Set(pts.map((p) => p.x));
    for (let level = 1; level <= xMax; level++) {
      if (xs.has(level) && pts.length) continue;
      const y = evalFormula(entry.formula, entry.params, level);
      if (y != null) pts.push({ x: level, y, src: "formula" });
    }
  }
  pts.sort((a, b) => a.x - b.x);
  // dedupe x preferring table
  const map = new Map();
  for (const p of pts) {
    const prev = map.get(p.x);
    if (!prev || (prev.src === "formula" && p.src === "table")) map.set(p.x, p);
  }
  return [...map.values()].sort((a, b) => a.x - b.x);
}

const COLORS = ["#6d8bff", "#34d399", "#fbbf24", "#c4b5fd", "#f87171", "#38bdf8"];

function niceDomain(vals) {
  if (!vals.length) return { min: 0, max: 1 };
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) {
    min = min - 1;
    max = max + 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function renderChart(svg, series) {
  const W = 640;
  const H = 320;
  const pad = { l: 44, r: 16, t: 16, b: 32 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const all = series.flatMap((s) => s.points);
  const xd = niceDomain(all.map((p) => p.x));
  const yd = niceDomain(all.map((p) => p.y));
  const sx = (x) => pad.l + ((x - xd.min) / (xd.max - xd.min)) * iw;
  const sy = (y) => pad.t + ih - ((y - yd.min) / (yd.max - yd.min)) * ih;

  const axis = `
    <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + ih}" stroke="#334155" />
    <line x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}" stroke="#334155" />
    <text x="${pad.l - 8}" y="${pad.t + 4}" fill="#64748b" font-size="10" text-anchor="end">${yd.max.toFixed(1)}</text>
    <text x="${pad.l - 8}" y="${pad.t + ih}" fill="#64748b" font-size="10" text-anchor="end">${yd.min.toFixed(1)}</text>
    <text x="${pad.l}" y="${H - 8}" fill="#64748b" font-size="10">${xd.min.toFixed(0)}</text>
    <text x="${pad.l + iw}" y="${H - 8}" fill="#64748b" font-size="10" text-anchor="end">${xd.max.toFixed(0)}</text>
  `;

  const paths = series
    .map((s, i) => {
      if (!s.points.length) return "";
      const color = COLORS[i % COLORS.length];
      const d = s.points.map((p, idx) => `${idx ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
      const dots = s.points
        .map((p) => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3" fill="${color}" />`)
        .join("");
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" /><g>${dots}</g>`;
    })
    .join("");

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = `<rect width="${W}" height="${H}" fill="#0b0e14" rx="8" />${axis}${paths}`;
}

/**
 * @param {HTMLElement} root
 */
export async function renderCurves(root) {
  root.innerHTML = `
    <div class="curves">
      <div class="curves-bar">
        <span class="curves-name">曲线面板</span>
        <span class="curves-badge">CURVE</span>
        <label class="curves-xmax">X上限 <input data-xmax type="number" min="5" max="100" value="20" /></label>
      </div>
      <div class="curves-body">
        <aside class="curves-list" data-list></aside>
        <section class="curves-main">
          <svg class="curves-svg" data-svg role="img" aria-label="曲线图"></svg>
          <div class="curves-legend" data-legend></div>
          <div class="curves-meta" data-meta>从左侧勾选数值库条目</div>
        </section>
      </div>
      <div class="curves-foot">
        <span data-ml>—</span>
        <span>数据源 stats-db.json</span>
      </div>
    </div>
  `;

  const listEl = root.querySelector("[data-list]");
  const svg = root.querySelector("[data-svg]");
  const legend = root.querySelector("[data-legend]");
  const meta = root.querySelector("[data-meta]");
  const xmaxInput = root.querySelector("[data-xmax]");
  const ml = root.querySelector("[data-ml]");

  let data;
  try {
    data = await loadDb();
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p class="empty">无法加载 stats-db.json</p>';
    return;
  }

  const entries = (data.entries || []).filter((e) => e.formula || (Array.isArray(e.table) && e.table.length));
  const selected = new Set(entries.slice(0, Math.min(2, entries.length)).map((e) => e.id));

  function paint() {
    const xMax = Math.max(5, Math.min(100, Number(xmaxInput.value) || 20));
    const series = entries
      .filter((e) => selected.has(e.id))
      .map((e, i) => ({
        id: e.id,
        name: e.name || e.id,
        color: COLORS[i % COLORS.length],
        points: pointsFromEntry(e, xMax),
        entry: e,
      }));

    // recolor by selection order
    const ordered = entries.filter((e) => selected.has(e.id));
    const series2 = ordered.map((e, i) => ({
      id: e.id,
      name: e.name || e.id,
      color: COLORS[i % COLORS.length],
      points: pointsFromEntry(e, xMax),
      entry: e,
    }));

    renderChart(svg, series2);
    legend.innerHTML = series2
      .map(
        (s) =>
          `<span class="curves-leg-item"><i style="background:${s.color}"></i>${esc(s.name)} <em>${s.points.length}点</em></span>`
      )
      .join("") || "<span class=\"muted\">未选择曲线</span>";

    if (series2.length === 1) {
      const e = series2[0].entry;
      meta.innerHTML = `
        <div><b>${esc(e.name)}</b> · ${esc(e.category || "—")} · ${esc(e.project || "—")}</div>
        <div>公式：<code>${esc(e.formula || "—")}</code></div>
        <div>参数：${esc(e.params ? JSON.stringify(e.params) : "—")}</div>
      `;
    } else if (series2.length > 1) {
      meta.textContent = `对比 ${series2.length} 条曲线（X=1..${xMax}，表数据优先于公式采样）`;
    } else {
      meta.textContent = "从左侧勾选数值库条目";
    }

    if (ml) ml.textContent = `可选 ${entries.length} · 已选 ${series2.length}`;
  }

  if (!entries.length) {
    listEl.innerHTML = '<p class="empty">没有可绘制条目（需要 formula 或 table）</p>';
  } else {
    listEl.innerHTML = entries
      .map((e) => {
        const checked = selected.has(e.id) ? "checked" : "";
        return `
          <label class="curves-item">
            <input type="checkbox" data-id="${esc(e.id)}" ${checked} />
            <span>
              <strong>${esc(e.name || e.id)}</strong>
              <small>${esc(e.category || "")} · ${esc(e.project || "")}</small>
            </span>
          </label>`;
      })
      .join("");
    listEl.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) selected.add(input.dataset.id);
        else selected.delete(input.dataset.id);
        paint();
      });
    });
  }

  xmaxInput.addEventListener("change", paint);
  paint();
}
