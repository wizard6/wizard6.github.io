/**
 * Floating window manager — centered open, min/max/close.
 * Windows live in #window-layer.
 */
let zCounter = 100;
let focusedId = null;

/** @type {Map<string, { el: HTMLElement, opts: object, state: 'normal'|'maximized'|'minimized', restore: {left:string,top:string,width:string,height:string}|null }>} */
const windows = new Map();

function layer() {
  return document.getElementById("window-layer");
}

function layerRect() {
  const host = layer();
  return host
    ? host.getBoundingClientRect()
    : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
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

function snapshotRect(el) {
  return {
    left: el.style.left,
    top: el.style.top,
    width: el.style.width,
    height: el.style.height,
  };
}

function applyRect(el, rect) {
  if (!rect) return;
  el.style.left = rect.left;
  el.style.top = rect.top;
  el.style.width = rect.width;
  el.style.height = rect.height;
}

function centerPosition(w, h) {
  const lr = layerRect();
  const left = Math.max(8, Math.round((lr.width - w) / 2));
  const top = Math.max(8, Math.round((lr.height - h) / 2));
  return { left, top };
}

function setMaxButton(el, maximized) {
  const btn = el.querySelector(".win-max");
  if (!btn) return;
  btn.textContent = maximized ? "❐" : "□";
  btn.title = maximized ? "还原" : "最大化";
  btn.setAttribute("aria-label", maximized ? "还原" : "最大化");
}

function minimizeWindow(id) {
  const win = windows.get(id);
  if (!win || win.state === "minimized") return;
  if (win.state === "normal") {
    win.restore = snapshotRect(win.el);
  }
  win.state = "minimized";
  win.el.classList.add("is-minimized");
  win.el.classList.remove("is-maximized");
  win.el.setAttribute("aria-hidden", "true");
  document.querySelector(`.dock-btn[data-id="${id}"]`)?.classList.add("is-minimized");
  if (focusedId === id) {
    focusedId = null;
    win.el.classList.remove("is-focused");
  }
}

function maximizeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  if (win.state === "minimized") {
    restoreWindow(id);
  }
  if (win.state === "maximized") {
    // toggle back to normal
    win.state = "normal";
    win.el.classList.remove("is-maximized");
    applyRect(win.el, win.restore);
    setMaxButton(win.el, false);
    bringToFront(id);
    return;
  }
  win.restore = snapshotRect(win.el);
  win.state = "maximized";
  win.el.classList.add("is-maximized");
  win.el.style.left = "0px";
  win.el.style.top = "0px";
  win.el.style.width = "100%";
  win.el.style.height = "100%";
  setMaxButton(win.el, true);
  bringToFront(id);
}

function restoreWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.classList.remove("is-minimized");
  win.el.setAttribute("aria-hidden", "false");
  document.querySelector(`.dock-btn[data-id="${id}"]`)?.classList.remove("is-minimized");
  if (win.state === "maximized") {
    win.el.classList.add("is-maximized");
    win.el.style.left = "0px";
    win.el.style.top = "0px";
    win.el.style.width = "100%";
    win.el.style.height = "100%";
    setMaxButton(win.el, true);
  } else {
    win.state = "normal";
    win.el.classList.remove("is-maximized");
    applyRect(win.el, win.restore);
    setMaxButton(win.el, false);
  }
  if (win.state === "minimized") win.state = "normal";
  // if was minimized from maximized, keep maximized; if from normal, normal
  // Fix: when minimizing we kept previous state in restore only for geometry.
  // Track maximized flag separately via class before minimize.
  bringToFront(id);
}

function closeWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  win.el.remove();
  windows.delete(id);
  document.querySelector(`.dock-btn[data-id="${id}"]`)?.classList.remove("is-minimized", "is-active");
  if (focusedId === id) {
    focusedId = null;
    let top = null;
    let topZ = -1;
    windows.forEach((w, wid) => {
      if (w.state === "minimized") return;
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
    if (e.target.closest(".win-controls")) return;
    const id = el.dataset.id;
    const win = windows.get(id);
    if (win?.state === "maximized") return;
    dragging = true;
    const rect = el.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    bar.setPointerCapture(e.pointerId);
    el.classList.add("is-dragging");
    bringToFront(id);
    e.preventDefault();
  });

  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const lr = layerRect();
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
    const id = el.dataset.id;
    const win = windows.get(id);
    if (win && win.state === "normal") {
      win.restore = snapshotRect(el);
    }
    try {
      bar.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }
  bar.addEventListener("pointerup", endDrag);
  bar.addEventListener("pointercancel", endDrag);

  bar.addEventListener("dblclick", (e) => {
    if (e.target.closest(".win-controls")) return;
    maximizeWindow(el.dataset.id);
  });
}

/**
 * @param {string} id
 * @param {{ title: string, icon?: string, width?: number, height?: number, mount: (body: HTMLElement) => void }} opts
 */
export function openWindow(id, opts) {
  if (windows.has(id)) {
    const win = windows.get(id);
    if (win.state === "minimized") {
      // restore previous geometry/max state
      const wasMax = win.el.dataset.wasMax === "1";
      win.el.classList.remove("is-minimized");
      win.el.setAttribute("aria-hidden", "false");
      document.querySelector(`.dock-btn[data-id="${id}"]`)?.classList.remove("is-minimized");
      if (wasMax) {
        win.state = "maximized";
        win.el.classList.add("is-maximized");
        win.el.style.left = "0px";
        win.el.style.top = "0px";
        win.el.style.width = "100%";
        win.el.style.height = "100%";
        setMaxButton(win.el, true);
      } else {
        win.state = "normal";
        win.el.classList.remove("is-maximized");
        applyRect(win.el, win.restore);
        setMaxButton(win.el, false);
      }
    }
    bringToFront(id);
    return win.el;
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
  const { left, top } = centerPosition(w, h);

  el.style.width = w + "px";
  el.style.height = h + "px";
  el.style.left = left + "px";
  el.style.top = top + "px";

  el.innerHTML = `
    <div class="win-titlebar">
      <span class="win-icon" aria-hidden="true">${opts.icon || "◇"}</span>
      <span class="win-title">${opts.title || id}</span>
      <div class="win-controls">
        <button type="button" class="win-min" aria-label="最小化" title="最小化">─</button>
        <button type="button" class="win-max" aria-label="最大化" title="最大化">□</button>
        <button type="button" class="win-close" aria-label="关闭" title="关闭">×</button>
      </div>
    </div>
    <div class="win-body"></div>
  `;

  const body = el.querySelector(".win-body");
  host.appendChild(el);
  windows.set(id, {
    el,
    opts,
    state: "normal",
    restore: snapshotRect(el),
  });

  el.querySelector(".win-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow(id);
  });
  el.querySelector(".win-min").addEventListener("click", (e) => {
    e.stopPropagation();
    const win = windows.get(id);
    if (!win) return;
    win.el.dataset.wasMax = win.state === "maximized" ? "1" : "0";
    if (win.state === "normal" || win.state === "maximized") {
      if (win.state === "normal") win.restore = snapshotRect(win.el);
      minimizeWindow(id);
    }
  });
  el.querySelector(".win-max").addEventListener("click", (e) => {
    e.stopPropagation();
    maximizeWindow(id);
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
  if (windows.has(id)) openWindow(id, windows.get(id).opts);
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
  window.addEventListener("resize", () => {
    windows.forEach((win, id) => {
      if (win.state === "maximized") {
        win.el.style.left = "0px";
        win.el.style.top = "0px";
        win.el.style.width = "100%";
        win.el.style.height = "100%";
      } else if (win.state === "normal") {
        // keep centered feel on first paint only; skip live recentering
      }
    });
  });
}

export { closeWindow, bringToFront, minimizeWindow, maximizeWindow };
