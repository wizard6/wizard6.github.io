export function initScrollbar(boardId = "board", railId = "sb-rail", thumbId = "sb-thumb") {
  const root = document.getElementById(boardId);
  const rail = document.getElementById(railId);
  const thumb = document.getElementById(thumbId);
  if (!root || !rail || !thumb) return;

  let hideTimer = 0;
  let dragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  function metrics() {
    const view = root.clientHeight;
    const doc = root.scrollHeight;
    const track = rail.clientHeight;
    const ratio = doc === 0 ? 1 : view / doc;
    const thumbH = Math.max(40, Math.round(track * Math.min(1, ratio)));
    const maxScroll = Math.max(0, doc - view);
    const maxTop = Math.max(0, track - thumbH);
    const top = maxScroll === 0 ? 0 : (root.scrollTop / maxScroll) * maxTop;
    return { view, doc, track, thumbH, maxScroll, maxTop, top };
  }

  function render() {
    const m = metrics();
    const needed = m.doc > m.view + 2;
    rail.classList.toggle("is-visible", needed || dragging);
    rail.setAttribute("aria-hidden", needed ? "false" : "true");
    if (!needed) return;
    thumb.style.height = m.thumbH + "px";
    thumb.style.transform = "translateY(" + m.top + "px)";
  }

  function flash() {
    const m = metrics();
    if (m.doc <= m.view + 2 && !dragging) {
      rail.classList.remove("is-visible");
      return;
    }
    rail.classList.add("is-visible");
    clearTimeout(hideTimer);
    if (!dragging) {
      hideTimer = setTimeout(function () {
        if (!dragging) rail.classList.remove("is-visible");
      }, 1000);
    }
  }

  function onScroll() {
    render();
    flash();
  }

  thumb.addEventListener("pointerdown", function (e) {
    dragging = true;
    thumb.classList.add("is-dragging");
    dragStartY = e.clientY;
    dragStartScroll = root.scrollTop;
    thumb.setPointerCapture(e.pointerId);
    flash();
    e.preventDefault();
  });

  thumb.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const m = metrics();
    const dy = e.clientY - dragStartY;
    const scrollDelta = m.maxTop === 0 ? 0 : (dy / m.maxTop) * m.maxScroll;
    root.scrollTop = dragStartScroll + scrollDelta;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    thumb.classList.remove("is-dragging");
    try { thumb.releasePointerCapture(e.pointerId); } catch (_) {}
    flash();
  }
  thumb.addEventListener("pointerup", endDrag);
  thumb.addEventListener("pointercancel", endDrag);

  rail.addEventListener("pointerdown", function (e) {
    if (e.target === thumb) return;
    const m = metrics();
    const rect = rail.getBoundingClientRect();
    const y = e.clientY - rect.top - m.thumbH / 2;
    const top = Math.min(m.maxTop, Math.max(0, y));
    root.scrollTop = m.maxTop === 0 ? 0 : (top / m.maxTop) * m.maxScroll;
    flash();
  });

  root.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { render(); flash(); });
  render();
  flash();
}
