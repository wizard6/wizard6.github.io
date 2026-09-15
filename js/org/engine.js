/**
 * Lightweight org-mode display engine (parse + foldable render + stats).
 * Not a full Emacs org implementation — enough for reading logs / outlines.
 */

import { esc } from "../utils.js";

const TODO_WORDS = new Set([
  "TODO", "NEXT", "READING", "WAIT", "DONE", "CANCELLED", "CANCELED", "KILL",
  "BOUGHT", "IDEA", "OUTLINE", "DRAFTING", "REVISING", "PUBLISHED", "SHELVED",
  "CAPTURE", "DEVELOP", "USED", "DROPPED",
  "NOTE", "EVENT", "WORK", "LIFE",
]);

const DONE_WORDS = new Set(["DONE", "CANCELLED", "CANCELED", "KILL", "PUBLISHED", "USED", "DROPPED"]);

/**
 * @typedef {{ type:'doc', title?:string, author?:string, children: Node[] }} Doc
 * @typedef {{ type:'headline', level:number, todo?:string, title:string, tags:string[], children: Node[], collapsed?:boolean, raw:string }} Headline
 * @typedef {{ type:'paragraph', text:string }} Paragraph
 * @typedef {{ type:'list', ordered:boolean, items:string[] }} List
 * @typedef {{ type:'props', entries: Record<string,string> }} Props
 * @typedef {{ type:'hr' }} Hr
 * @typedef {Headline|Paragraph|List|Props|Hr} Node
 */

export function parseOrg(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  /** @type {Doc} */
  const doc = { type: "doc", children: [] };
  const stack = [{ level: 0, children: doc.children }];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // keywords
    const kw = line.match(/^#\+(\w+):\s*(.*)$/i);
    if (kw) {
      const key = kw[1].toUpperCase();
      const val = kw[2].trim();
      if (key === "TITLE") doc.title = val;
      else if (key === "AUTHOR") doc.author = val;
      i += 1;
      continue;
    }

    // skip comment / empty at top handled as blank paragraph skip
    if (/^#/.test(line) && !/^#\+/.test(line)) {
      i += 1;
      continue;
    }

    // headline
    const hl = line.match(/^(\*+)\s+(?:(TODO|NEXT|READING|WAIT|DONE|CANCELLED|CANCELED|KILL|BOUGHT|IDEA|OUTLINE|DRAFTING|REVISING|PUBLISHED|SHELVED|CAPTURE|DEVELOP|USED|DROPPED|NOTE|EVENT|WORK|LIFE)\s+)?(.+?)(?:\s+:([\w@#%：\u4e00-\u9fff/-]+):)?\s*$/);
    if (hl) {
      const level = hl[1].length;
      let title = hl[3].trim();
      let tags = [];
      // tags may be in group 4, or still attached to title
      if (hl[4]) tags = hl[4].split(":").filter(Boolean);
      else {
        const tagMatch = title.match(/\s+:([\w@#%：\u4e00-\u9fff/-:]+):\s*$/);
        if (tagMatch) {
          tags = tagMatch[1].split(":").filter(Boolean);
          title = title.slice(0, tagMatch.index).trim();
        }
      }
      const node = {
        type: "headline",
        level,
        todo: hl[2] || undefined,
        title,
        tags,
        children: [],
        collapsed: level > 1,
        raw: line,
      };
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack[stack.length - 1].children.push(node);
      stack.push({ level, children: node.children });
      i += 1;
      continue;
    }

    // properties drawer
    if (/^:PROPERTIES:\s*$/i.test(line)) {
      const entries = {};
      i += 1;
      while (i < lines.length && !/^:END:\s*$/i.test(lines[i])) {
        const m = lines[i].match(/^:([^:]+):\s*(.*)$/);
        if (m) entries[m[1].trim()] = m[2].trim();
        i += 1;
      }
      if (i < lines.length) i += 1; // skip :END:
      stack[stack.length - 1].children.push({ type: "props", entries });
      continue;
    }

    if (/^-{5,}\s*$/.test(line)) {
      stack[stack.length - 1].children.push({ type: "hr" });
      i += 1;
      continue;
    }

    // list block
    if (/^\s*[-+*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-+*]\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*(?:[-+*]|\d+[.)])\s+/, ""));
        i += 1;
      }
      stack[stack.length - 1].children.push({ type: "list", ordered, items });
      continue;
    }

    // blank
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // paragraph (merge consecutive non-special lines)
    const parts = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\*/.test(lines[i]) &&
      !/^#/.test(lines[i]) &&
      !/^:PROPERTIES:/i.test(lines[i]) &&
      !/^-{5,}\s*$/.test(lines[i]) &&
      !/^\s*[-+*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      parts.push(lines[i]);
      i += 1;
    }
    stack[stack.length - 1].children.push({ type: "paragraph", text: parts.join("\n") });
  }

  return doc;
}

function inlineFormat(text) {
  let s = esc(text);
  // timestamps
  s = s.replace(/&lt;(\d{4}-\d{2}-\d{2}(?:\s+[A-Za-z]{2,3})?(?:\s+\d{1,2}:\d{2})?(?:-\d{1,2}:\d{2})?)&gt;/g,
    '<time class="org-ts">&lt;$1&gt;</time>');
  s = s.replace(/\[(\d{4}-\d{2}-\d{2}(?:\s+[A-Za-z]{2,3})?(?:\s+\d{1,2}:\d{2})?)\]/g,
    '<time class="org-ts org-ts-inactive">[$1]</time>');
  // =code= and ~code~
  s = s.replace(/=([^=]+)=/g, '<code class="org-code">$1</code>');
  s = s.replace(/~([^~]+)~/g, '<code class="org-code">$1</code>');
  // *bold* (avoid **)
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<strong>$2</strong>');
  // /italic/
  s = s.replace(/(^|[\s(])\/([^/\n]+)\/(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  return s;
}

function todoClass(todo) {
  if (!todo) return "";
  return DONE_WORDS.has(todo) ? "is-done" : "is-todo";
}

function renderNodes(nodes, into, opts = {}) {
  for (const n of nodes) {
    if (n.type === "headline") {
      const wrap = document.createElement("div");
      wrap.className = "org-h";
      wrap.dataset.level = String(n.level);
      if (n.collapsed) wrap.classList.add("is-collapsed");

      const head = document.createElement("div");
      head.className = "org-h-row";
      head.tabIndex = 0;
      head.setAttribute("role", "treeitem");
      head.setAttribute("aria-expanded", n.collapsed ? "false" : "true");

      const fold = document.createElement("button");
      fold.type = "button";
      fold.className = "org-fold";
      fold.setAttribute("aria-label", "折叠");
      const caret = document.createElement("span");
      caret.className = "org-caret";
      caret.setAttribute("aria-hidden", "true");
      fold.appendChild(caret);
      if (!n.children.length) {
        fold.disabled = true;
        fold.classList.add("is-leaf");
      } else if (n.collapsed) {
        fold.classList.add("is-collapsed");
      }

      const stars = document.createElement("span");
      stars.className = "org-stars";
      stars.textContent = "*".repeat(n.level);

      head.appendChild(fold);
      head.appendChild(stars);

      if (n.todo) {
        const todo = document.createElement("span");
        todo.className = `org-todo ${todoClass(n.todo)}`;
        todo.dataset.todo = n.todo;
        if (["READING", "NEXT", "WAIT", "DRAFTING", "REVISING", "OUTLINE", "IDEA", "BOUGHT", "CAPTURE", "DEVELOP", "NOTE", "EVENT", "WORK", "LIFE"].includes(n.todo)) {
          todo.classList.add("is-special");
        }
        todo.textContent = n.todo;
        head.appendChild(todo);
      }

      const title = document.createElement("span");
      title.className = "org-h-title";
      title.innerHTML = inlineFormat(n.title);
      head.appendChild(title);

      if (n.tags?.length) {
        const tags = document.createElement("span");
        tags.className = "org-tags";
        if (opts.classic) {
          tags.textContent = ":" + n.tags.join(":") + ":";
        } else {
          n.tags.forEach((t) => {
            const tag = document.createElement("span");
            tag.className = "org-tag";
            tag.textContent = t;
            tags.appendChild(tag);
          });
        }
        head.appendChild(tags);
      }

      // classic org: indent by level
      if (opts.classic) {
        wrap.style.setProperty("--org-indent", Math.max(0, n.level - 1) * 0.85 + "rem");
        head.classList.add("org-level-" + Math.min(n.level, 8));
      }

      const body = document.createElement("div");
      body.className = "org-h-body";
      if (n.collapsed) body.hidden = true;
      renderNodes(n.children, body, opts);

      const toggle = () => {
        if (!n.children.length) return;
        wrap.classList.toggle("is-collapsed");
        const collapsed = wrap.classList.contains("is-collapsed");
        body.hidden = collapsed;
        fold.classList.toggle("is-collapsed", collapsed);
        head.setAttribute("aria-expanded", collapsed ? "false" : "true");
      };
      fold.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle();
      });
      head.addEventListener("click", (e) => {
        if (e.target.closest(".org-fold")) return;
        toggle();
      });
      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });

      wrap.appendChild(head);
      wrap.appendChild(body);
      into.appendChild(wrap);
      continue;
    }

    if (n.type === "paragraph") {
      const p = document.createElement("p");
      p.className = "org-p";
      p.innerHTML = inlineFormat(n.text).replace(/\n/g, "<br>");
      into.appendChild(p);
      continue;
    }

    if (n.type === "list") {
      if (opts.classic && !n.ordered) {
        const box = document.createElement("div");
        box.className = "org-list org-list-plain";
        n.items.forEach((it) => {
          const row = document.createElement("div");
          row.className = "org-list-item";
          row.innerHTML = '<span class="org-bullet">-</span> ' + inlineFormat(it);
          box.appendChild(row);
        });
        into.appendChild(box);
      } else {
        const list = document.createElement(n.ordered ? "ol" : "ul");
        list.className = "org-list";
        n.items.forEach((it) => {
          const li = document.createElement("li");
          li.innerHTML = inlineFormat(it);
          list.appendChild(li);
        });
        into.appendChild(list);
      }
      continue;
    }

    if (n.type === "props") {
      if (opts.classic) {
        const pre = document.createElement("pre");
        pre.className = "org-drawer";
        const lines = [":PROPERTIES:"];
        Object.entries(n.entries).forEach(([k, v]) => {
          lines.push(":" + k + ": " + v);
        });
        lines.push(":END:");
        pre.textContent = lines.join("\n");
        into.appendChild(pre);
      } else {
        const box = document.createElement("details");
        box.className = "org-props";
        const sum = document.createElement("summary");
        sum.textContent = "PROPERTIES";
        box.appendChild(sum);
        const dl = document.createElement("dl");
        Object.entries(n.entries).forEach(([k, v]) => {
          const dt = document.createElement("dt");
          dt.textContent = k;
          const dd = document.createElement("dd");
          dd.innerHTML = inlineFormat(v);
          dl.appendChild(dt);
          dl.appendChild(dd);
        });
        box.appendChild(dl);
        into.appendChild(box);
      }
      continue;
    }

    if (n.type === "hr") {
      into.appendChild(document.createElement("hr")).className = "org-hr";
    }
  }
}

/**
 * Render org AST into a container element.
 * @param {Doc} doc
 * @param {HTMLElement} root
 */
export function renderOrg(doc, root, opts = {}) {
  root.innerHTML = "";
  root.classList.add("org-view");
  if (opts.classic) root.classList.add("org-classic");

  if (doc.title) {
    if (opts.classic) {
      const line = document.createElement("div");
      line.className = "org-keyword";
      line.innerHTML = '<span class="org-kw">#+TITLE:</span> ' + esc(doc.title);
      root.appendChild(line);
    } else {
      const h = document.createElement("h1");
      h.className = "org-doc-title";
      h.textContent = doc.title;
      root.appendChild(h);
    }
  }
  if (doc.author) {
    if (opts.classic) {
      const line = document.createElement("div");
      line.className = "org-keyword";
      line.innerHTML = '<span class="org-kw">#+AUTHOR:</span> ' + esc(doc.author);
      root.appendChild(line);
    } else {
      const a = document.createElement("p");
      a.className = "org-doc-author";
      a.textContent = doc.author;
      root.appendChild(a);
    }
  }

  const tree = document.createElement("div");
  tree.className = "org-tree";
  tree.setAttribute("role", "tree");
  renderNodes(doc.children, tree, opts);
  root.appendChild(tree);
}

function walkHeadlines(nodes, out = []) {
  for (const n of nodes) {
    if (n.type === "headline") {
      out.push(n);
      walkHeadlines(n.children, out);
    }
  }
  return out;
}

function extractTimestamp(text) {
  const m = String(text || "").match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function propsOf(headline) {
  const out = {};
  for (const c of headline.children || []) {
    if (c.type === "props") Object.assign(out, c.entries || {});
  }
  return out;
}

/** Parse :WORDS: / :字数: — supports 12000 or 1.2万 */
export function parseWords(raw) {
  if (raw == null || raw === "") return 0;
  const s = String(raw).trim().replace(/,/g, "");
  if (!s || s === "0") return 0;
  const wan = s.match(/^(\d+(?:\.\d+)?)\s*万$/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000);
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Parse :DURATION: / :时长: — minutes; supports 90, 90m, 1h30m, 1:30 */
export function parseDurationMinutes(raw) {
  if (raw == null || raw === "") return 0;
  const s = String(raw).trim().toLowerCase();
  if (!s || s === "0" || s === "0m") return 0;
  const hm = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);
  if (hm && (hm[1] || hm[2]) && !s.includes(":")) {
    return (parseInt(hm[1] || "0", 10) * 60) + parseInt(hm[2] || "0", 10);
  }
  const colon = s.match(/^(\d+):(\d{1,2})$/);
  if (colon) return parseInt(colon[1], 10) * 60 + parseInt(colon[2], 10);
  const onlyMin = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?$/);
  if (onlyMin) return Math.round(parseFloat(onlyMin[1]));
  const onlyH = s.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (onlyH) return Math.round(parseFloat(onlyH[1]) * 60);
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function formatDuration(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return r + "m";
  if (r === 0) return h + "h";
  return h + "h" + r + "m";
}

export function formatWords(n) {
  const v = Math.max(0, Math.round(n || 0));
  if (v >= 10000) {
    const wan = v / 10000;
    return (Number.isInteger(wan) ? String(wan) : wan.toFixed(1).replace(/\.0$/, "")) + "万";
  }
  return String(v);
}

/**
 * Reading-oriented stats from org doc.
 * @param {Doc} doc
 */
export function orgReadingStats(doc) {
  const headlines = walkHeadlines(doc.children || []);
  const byTodo = {};
  const books = [];

  for (const h of headlines) {
    if (h.todo) {
      byTodo[h.todo] = (byTodo[h.todo] || 0) + 1;
    }
    const tags = h.tags || [];
    if (h.todo || tags.some((t) => /书|读书|reading|book/i.test(t))) {
      const props = propsOf(h);
      const date =
        extractTimestamp(h.title) ||
        extractTimestamp(h.children?.map((c) => (c.type === "paragraph" ? c.text : "")).join("\n")) ||
        extractTimestamp(props.LAST || props.CLOSED || props.DATE) ||
        null;
      const words = parseWords(props.WORDS ?? props["字数"] ?? props.WORD_COUNT);
      const durationMin = parseDurationMinutes(props.DURATION ?? props["时长"] ?? props.TIME);
      books.push({
        title: h.title,
        todo: h.todo || "NOTE",
        tags,
        date,
        level: h.level,
        done: h.todo ? DONE_WORDS.has(h.todo) : false,
        words,
        durationMin,
        props,
      });
    }
  }

  books.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const recentDays = 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = books.filter((b) => b.date && b.date >= cutoffStr);

  const totalWords = books.reduce((s, b) => s + (b.words || 0), 0);
  const totalDurationMin = books.reduce((s, b) => s + (b.durationMin || 0), 0);
  const recentWords = recent.reduce((s, b) => s + (b.words || 0), 0);
  const recentDurationMin = recent.reduce((s, b) => s + (b.durationMin || 0), 0);
  const doneWords = books.filter((b) => b.done).reduce((s, b) => s + (b.words || 0), 0);
  const doneDurationMin = books.filter((b) => b.done).reduce((s, b) => s + (b.durationMin || 0), 0);
  const readingBooks = books.filter((b) => b.todo === "READING" || b.todo === "NEXT");
  const readingWords = readingBooks.reduce((s, b) => s + (b.words || 0), 0);
  const readingDurationMin = readingBooks.reduce((s, b) => s + (b.durationMin || 0), 0);

  return {
    totalTracked: books.length,
    byTodo,
    reading: readingBooks.length,
    done: books.filter((b) => b.done).length,
    recent,
    books,
    recentDays,
    totalWords,
    totalDurationMin,
    recentWords,
    recentDurationMin,
    doneWords,
    doneDurationMin,
    readingWords,
    readingDurationMin,
  };
}

export { TODO_WORDS, DONE_WORDS };
