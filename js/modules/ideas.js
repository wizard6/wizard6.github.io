import { orgReadingStats } from "../org/engine.js";
import { renderOrgBuffer } from "./org-buffer.js";

function statsAsOrg(doc) {
  const stats = orgReadingStats(doc);
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");
  const active = stats.books.filter((b) =>
    ["CAPTURE", "IDEA", "DEVELOP", "TODO", "NEXT"].includes(b.todo)
  );
  const list = stats.books
    .map((b) => {
      const tags = b.tags?.length ? ` :${b.tags.join(":")}:` : "";
      const d = b.date ? ` <${b.date}>` : "";
      return `- ${b.todo} ${b.title}${d}${tags}`;
    })
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:ACTIVE: ${active.length}
:CAPTURE: ${stats.byTodo.CAPTURE || 0}
:IDEA: ${stats.byTodo.IDEA || 0}
:DEVELOP: ${stats.byTodo.DEVELOP || 0}
:USED: ${stats.byTodo.USED || 0}
:DROPPED: ${stats.byTodo.DROPPED || 0}
:END:

** 灵感概览
- 条目 :: ${stats.totalTracked}
- 活跃（捕捉/点子/孵化） :: ${active.length}
- CAPTURE :: ${stats.byTodo.CAPTURE || 0}
- IDEA :: ${stats.byTodo.IDEA || 0}
- DEVELOP :: ${stats.byTodo.DEVELOP || 0}
- USED :: ${stats.byTodo.USED || 0}
- DROPPED :: ${stats.byTodo.DROPPED || 0}

** 状态计数
${todoLines || "- （无）"}

** 条目
${list || "- （灵感库为空，按填写说明添加）"}

`;
}

export function renderIdeas(root) {
  return renderOrgBuffer(root, {
    fileUrl: "./data/ideas.org",
    bufferName: "ideas.org",
    modeLineRight: "data/ideas.org",
    buildStatsOrg: statsAsOrg,
    buildModeLine: (doc) => {
      const s = orgReadingStats(doc);
      return `灵感 ${s.totalTracked} · CAPTURE:${s.byTodo.CAPTURE || 0} IDEA:${s.byTodo.IDEA || 0} DEVELOP:${s.byTodo.DEVELOP || 0}`;
    },
  });
}
