import { orgReadingStats } from "../org/engine.js";
import { renderOrgBuffer } from "./org-buffer.js";

function statsAsOrg(doc) {
  const stats = orgReadingStats(doc);
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");
  const recent = (stats.recent.length ? stats.recent : stats.books.slice(0, 12))
    .slice(0, 12)
    .map((b) => {
      const ts = b.date ? ` <${b.date}>` : "";
      const tags = b.tags?.length ? ` :${b.tags.join(":")}:` : "";
      return `- ${b.todo} ${b.title}${ts}${tags}`;
    })
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:RECENT_DAYS: ${stats.recentDays}
:RECENT_COUNT: ${stats.recent.length}
:NOTE: ${stats.byTodo.NOTE || 0}
:WORK: ${stats.byTodo.WORK || 0}
:LIFE: ${stats.byTodo.LIFE || 0}
:EVENT: ${stats.byTodo.EVENT || 0}
:END:

** 日志概览
- 条目 :: ${stats.totalTracked}
- 近 ${stats.recentDays} 天 :: ${stats.recent.length}
- NOTE :: ${stats.byTodo.NOTE || 0}
- WORK :: ${stats.byTodo.WORK || 0}
- LIFE :: ${stats.byTodo.LIFE || 0}
- EVENT :: ${stats.byTodo.EVENT || 0}

** 状态计数
${todoLines || "- （无）"}

** 近期条目
${recent || "- （日志为空，按填写说明添加）"}

`;
}

export function renderJournal(root) {
  return renderOrgBuffer(root, {
    fileUrl: "./data/journal.org",
    bufferName: "journal.org",
    modeLineRight: "data/journal.org",
    buildStatsOrg: statsAsOrg,
    buildModeLine: (doc) => {
      const s = orgReadingStats(doc);
      return `日志 ${s.totalTracked} · 近${s.recentDays}天 ${s.recent.length} · NOTE:${s.byTodo.NOTE || 0}`;
    },
  });
}
