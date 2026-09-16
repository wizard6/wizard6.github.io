import { esc } from "../utils.js";

async function loadDb() {
  const res = await fetch("./data/stats-db.json?v=" + Date.now());
  if (!res.ok) throw new Error("stats-db.json load failed");
  return res.json();
}

function paramsText(params) {
  if (!params || typeof params !== "object") return "—";
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

function tablePreview(table) {
  if (!Array.isArray(table) || !table.length) return "—";
  const head = table.slice(0, 3).map((row) => {
    const key = row.level ?? row.key ?? row.x ?? "?";
    const val = row.value ?? row.y ?? row.v ?? "?";
    return `${key}:${val}`;
  });
  const more = table.length > 3 ? ` …(+${table.length - 3})` : "";
  return head.join(" · ") + more;
}

/**
 * @param {HTMLElement} root
 */
export async function renderStatsDb(root) {
  root.innerHTML = `
    <div class="sdb">
      <div class="sdb-bar">
        <span class="sdb-name">stats-db.json</span>
        <span class="sdb-badge">数值库</span>
        <input class="sdb-search" data-q type="search" placeholder="搜索名称 / 公式 / 项目 / 标签" />
        <select class="sdb-filter" data-cat>
          <option value="">全部分类</option>
        </select>
      </div>
      <div class="sdb-stats" data-stats></div>
      <div class="sdb-head" role="row">
        <span>NAME</span><span>CAT</span><span>PROJECT</span><span>FORMULA</span><span>PARAMS</span><span>TABLE</span><span>TAGS</span>
      </div>
      <div class="sdb-list" data-list><p class="empty">Loading…</p></div>
      <div class="sdb-detail" data-detail hidden></div>
      <div class="sdb-foot">
        <span data-ml>—</span>
        <span>data/stats-db.json</span>
      </div>
    </div>
  `;

  const listEl = root.querySelector("[data-list]");
  const statsEl = root.querySelector("[data-stats]");
  const catEl = root.querySelector("[data-cat]");
  const qEl = root.querySelector("[data-q]");
  const detailEl = root.querySelector("[data-detail]");
  const ml = root.querySelector("[data-ml]");

  let data;
  try {
    data = await loadDb();
  } catch (e) {
    console.error(e);
    listEl.innerHTML = '<p class="empty">无法加载 data/stats-db.json</p>';
    return;
  }

  const entries = Array.isArray(data.entries) ? data.entries : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catEl.appendChild(opt);
  });

  const byCat = {};
  entries.forEach((e) => {
    const c = e.category || "其他";
    byCat[c] = (byCat[c] || 0) + 1;
  });

  statsEl.innerHTML = `
    <div class="sdb-stat"><strong>${entries.length}</strong><span>条目</span></div>
    <div class="sdb-stat"><strong>${categories.length}</strong><span>分类</span></div>
    <div class="sdb-stat"><strong>${Object.keys(byCat).length}</strong><span>已用分类</span></div>
    <div class="sdb-chips">${Object.entries(byCat).map(([k,v]) => `<span class="sdb-chip"><b>${esc(k)}</b>${v}</span>`).join("") || '<span class="muted">暂无数据</span>'}</div>
  `;

  function showDetail(e) {
    detailEl.hidden = false;
    const rows = Array.isArray(e.table)
      ? e.table
          .map((r) => {
            const key = r.level ?? r.key ?? r.x ?? "";
            const val = r.value ?? r.y ?? r.v ?? "";
            return `<tr><td>${esc(key)}</td><td>${esc(val)}</td></tr>`;
          })
          .join("")
      : "";
    detailEl.innerHTML = `
      <div class="sdb-detail-bar">
        <strong>${esc(e.name || e.id)}</strong>
        <button type="button" class="sdb-close" data-close>关闭</button>
      </div>
      <div class="sdb-detail-body">
        <div><span class="k">ID</span> ${esc(e.id || "—")}</div>
        <div><span class="k">分类</span> ${esc(e.category || "—")}</div>
        <div><span class="k">项目</span> ${esc(e.project || "—")}</div>
        <div><span class="k">单位</span> ${esc(e.unit || "—")}</div>
        <div><span class="k">公式</span> <code>${esc(e.formula || "—")}</code></div>
        <div><span class="k">参数</span> ${esc(paramsText(e.params))}</div>
        <div><span class="k">标签</span> ${esc((e.tags || []).join(", ") || "—")}</div>
        <div><span class="k">备注</span> ${esc(e.notes || "—")}</div>
        ${rows ? `<table class="sdb-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      </div>
    `;
    detailEl.querySelector("[data-close]")?.addEventListener("click", () => {
      detailEl.hidden = true;
    });
  }

  function paint() {
    const q = (qEl.value || "").trim().toLowerCase();
    const cat = catEl.value;
    const filtered = entries.filter((e) => {
      if (cat && e.category !== cat) return false;
      if (!q) return true;
      const blob = [e.id, e.name, e.category, e.project, e.formula, paramsText(e.params), (e.tags || []).join(" "), e.notes]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });

    if (!entries.length) {
      listEl.innerHTML = '<p class="empty">entries 为空。填写说明见 data/stats-db-guide.md</p>';
    } else if (!filtered.length) {
      listEl.innerHTML = '<p class="empty">没有匹配条目</p>';
    } else {
      listEl.innerHTML = filtered
        .map((e) => {
          const tags = (e.tags || []).join(",");
          return `
            <button type="button" class="sdb-row" data-id="${esc(e.id)}">
              <span class="c-name" title="${esc(e.name || "")}">${esc(e.name || e.id || "—")}</span>
              <span class="c-cat" title="${esc(e.category || "")}">${esc(e.category || "—")}</span>
              <span class="c-proj" title="${esc(e.project || "")}">${esc(e.project || "—")}</span>
              <span class="c-formula" title="${esc(e.formula || "")}">${esc(e.formula || "—")}</span>
              <span class="c-params" title="${esc(paramsText(e.params))}">${esc(paramsText(e.params))}</span>
              <span class="c-table" title="${esc(tablePreview(e.table))}">${esc(tablePreview(e.table))}</span>
              <span class="c-tags" title="${esc(tags)}">${esc(tags || "—")}</span>
            </button>`;
        })
        .join("");
      listEl.querySelectorAll(".sdb-row").forEach((btn) => {
        btn.addEventListener("click", () => {
          const e = entries.find((x) => x.id === btn.dataset.id);
          if (e) showDetail(e);
        });
      });
    }

    if (ml) ml.textContent = `${data.title || "数值设计库"} · 显示 ${filtered.length}/${entries.length}`;
  }

  qEl.addEventListener("input", paint);
  catEl.addEventListener("change", paint);
  paint();
}
