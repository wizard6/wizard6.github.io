/**
 * Simple floating window manager for the desktop shell.
 * Windows live in #window-layer (absolute, under topbar, right of dock).
 */
let zCounter = 100;
let cascade = 0;
let focusedId = null;

const windows = new Map(); // id -> { el, opts }

function layer() {
  return document.getElementById("window-layer");
}

function layerRect() {
  const host = layer();
  return host ? host.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
}

function bringToFront(id) {
  const win = windows.get(id);
  if (!win) return;
  zCounter += 1;
  win.el.style.zIndex = String(zCounter);
  focusedId = id;
  document.querySelectorAll(".win").forEach((w) => w.classList.remove("is-focused"));
  win.el.classList.add("is-focused");
}

function closeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.remove();
  windows.delete(id);
  if (focusedId === id) {
    focusedId = null;
    let top = null;
    let topZ = -1;
    windows.forEach((w, wid) => {
      const z = parseInt(w.el.style.zIndex || "0", 10);
      if (z > topZ) {
        topZ = z;
        top = wid;
      }
    });
    if (top) bringToFront(top);
  }
}

function enableDrag(el) {
  const bar = el.querySelector(".win-titlebar");
  if (!bar) return;
  let dragging = false;
  let ox = 0;
  let oy = 0;

  bar.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".win-close")) return;
    dragging = true;
    const rect = el.getBoundingClientRect();
    // offsets within the window; positions stored relative to layer
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    bar.setPointerCapture(e.pointerId);
    el.classList.add("is-dragging");
    bringToFront(el.dataset.id);
    e.preventDefault();
  });

  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const lr = layerRect();
    // convert viewport pointer → layer-local left/top
    let x = e.clientX - ox - lr.left;
    let y = e.clientY - oy - lr.top;
    const maxX = Math.max(40, lr.width - 80);
    const maxY = Math.max(20, lr.height - 40);
    x = Math.max(-20, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    el.style.left = x + "px";
    el.style.top = y + "px";
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("is-dragging");
    try {
      bar.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);
}

/**
 * @param {string} id
 * @param {{ title: string, icon?: string, width?: number, height?: number, mount: (body: HTMLElement) => void }} opts
 */
export function openWindow(id, opts) {
  if (windows.has(id)) {
    bringToFront(id);
    return windows.get(id).el;
  }

  const host = layer();
  if (!host) return null;

  const el = document.createElement("div");
  el.className = "win";
  el.dataset.id = id;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", opts.title || id);

  const w = opts.width || 440;
  const h = opts.height || 360;
  const offset = (cascade % 8) * 28;
  cascade += 1;

  // Positions are relative to #window-layer (already right of dock / under topbar)
  const left = 36 + offset;
  const top = 20 + offset;

  el.style.width = w + "px";
  el.style.height = h + "px";
  el.style.left = left + "px";
  el.style.top = top + "px";

  el.innerHTML = `
    <div class="win-titlebar">
      <span class="win-icon" aria-hidden="true">${opts.icon || "◇"}</span>
      <span class="win-title">${opts.title || id}</span>
      <button type="button" class="win-close" aria-label="关闭" title="关闭">×</button>
    </div>
    <div class="win-body"></div>
  `;

  const body = el.querySelector(".win-body");
  host.appendChild(el);
  windows.set(id, { el, opts });

  el.querySelector(".win-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow(id);
  });

  el.addEventListener("pointerdown", () => bringToFront(id));
  enableDrag(el);
  bringToFront(id);

  if (typeof opts.mount === "function") {
    opts.mount(body);
  }

  return el;
}

export function focusWindow(id) {
  if (windows.has(id)) bringToFront(id);
}

export function closeFocused() {
  if (focusedId) closeWindow(focusedId);
}

export function getFocusedId() {
  return focusedId;
}

export function initWm() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFocused();
    }
  });
}

export { closeWindow, bringToFront };
