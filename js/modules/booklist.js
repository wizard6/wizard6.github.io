import { orgReadingStats, formatWords } from "../org/engine.js";
import { renderOrgBuffer } from "./org-buffer.js";

function statsAsOrg(doc) {
  const stats = orgReadingStats(doc);
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");
  const list = stats.books
    .map((b) => {
      const meta = [];
      if (b.words) meta.push(`字数 ${formatWords(b.words)}`);
      const tags = b.tags?.length ? ` :${b.tags.join(":")}:` : "";
      return `- ${b.todo} ${b.title}${tags}${meta.length ? " · " + meta.join(" · ") : ""}`;
    })
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:TODO: ${stats.byTodo.TODO || 0}
:NEXT: ${stats.byTodo.NEXT || 0}
:BOUGHT: ${stats.byTodo.BOUGHT || 0}
:DONE: ${stats.done}
:END:

** 书单概览
- 条目 :: ${stats.totalTracked}
- 想读 TODO :: ${stats.byTodo.TODO || 0}
- 下一本 NEXT :: ${stats.byTodo.NEXT || 0}
- 已购 BOUGHT :: ${stats.byTodo.BOUGHT || 0}
- 已读完/归档 DONE :: ${stats.done}

** TODO 计数
${todoLines || "- （无）"}

** 条目
${list || "- （书单为空，按填写说明添加）"}

`;
}

export function renderBooklist(root) {
  return renderOrgBuffer(root, {
    fileUrl: "./data/booklist.org",
    bufferName: "booklist.org",
    modeLineRight: "data/booklist.org",
    buildStatsOrg: statsAsOrg,
    buildModeLine: (doc) => {
      const s = orgReadingStats(doc);
      return `书单 ${s.totalTracked} · TODO:${s.byTodo.TODO || 0} NEXT:${s.byTodo.NEXT || 0} BOUGHT:${s.byTodo.BOUGHT || 0}`;
    },
  });
}
