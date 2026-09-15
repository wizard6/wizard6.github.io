import { parseOrg, renderOrg } from "../org/engine.js";

/**
 * Generic classic org-mode buffer window.
 * @param {HTMLElement} root
 * @param {{
 *   fileUrl: string,
 *   bufferName: string,
 *   modeLineRight?: string,
 *   buildStatsOrg?: (doc: any) => string,
 *   buildModeLine?: (doc: any, statsText: string) => string,
 * }} opts
 */
export async function renderOrgBuffer(root, opts) {
  const {
    fileUrl,
    bufferName,
    modeLineRight = fileUrl.replace(/^\.\//, ""),
    buildStatsOrg,
    buildModeLine,
  } = opts;

  root.innerHTML = `
    <div class="org-buffer">
      <div class="org-buffer-bar">
        <span class="org-buffer-name">${bufferName}</span>
        <span class="org-buffer-mode">Org</span>
        <span class="org-buffer-actions">
          <button type="button" class="org-buf-btn" data-act="showall">Show All</button>
          <button type="button" class="org-buf-btn" data-act="overview">Overview</button>
        </span>
      </div>
      <div class="org-buffer-body" data-org-root><p class="empty">Loading…</p></div>
      <div class="org-modeline">
        <span>Org</span>
        <span data-org-ml>—</span>
        <span>${modeLineRight}</span>
      </div>
    </div>
  `;

  const orgRoot = root.querySelector("[data-org-root]");
  const ml = root.querySelector("[data-org-ml]");

  try {
    const res = await fetch(fileUrl + "?v=" + Date.now());
    if (!res.ok) throw new Error("load failed: " + fileUrl);
    const text = await res.text();
    const baseDoc = parseOrg(text);
    const statsOrg = typeof buildStatsOrg === "function" ? buildStatsOrg(baseDoc) : "";
    const doc = parseOrg(statsOrg + text);
    renderOrg(doc, orgRoot, { classic: true });

    if (ml) {
      ml.textContent =
        typeof buildModeLine === "function" ? buildModeLine(baseDoc) : "L1";
    }

    const setOutline = (expand) => {
      const nodes = expand
        ? orgRoot.querySelectorAll(".org-h")
        : orgRoot.querySelectorAll('.org-h[data-level]:not([data-level="1"])');
      nodes.forEach((h) => {
        if (expand) h.classList.remove("is-collapsed");
        else h.classList.add("is-collapsed");
        const body = h.querySelector(":scope > .org-h-body");
        const fold = h.querySelector(":scope > .org-h-row .org-fold");
        if (body) body.hidden = !expand;
        if (fold && !fold.disabled) fold.classList.toggle("is-collapsed", !expand);
        const row = h.querySelector(":scope > .org-h-row");
        if (row) row.setAttribute("aria-expanded", expand ? "true" : "false");
      });
    };

    root.querySelector('[data-act="showall"]')?.addEventListener("click", () => setOutline(true));
    root.querySelector('[data-act="overview"]')?.addEventListener("click", () => setOutline(false));
  } catch (e) {
    console.error(e);
    orgRoot.innerHTML = `<p class="empty">无法加载 ${fileUrl}</p>`;
  }
}
