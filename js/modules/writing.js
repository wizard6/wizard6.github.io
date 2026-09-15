import {
  orgReadingStats,
  formatWords,
  formatDuration,
} from "../org/engine.js";
import { renderOrgBuffer } from "./org-buffer.js";

function statsAsOrg(doc) {
  const stats = orgReadingStats(doc);
  const todoLines = Object.entries(stats.byTodo)
    .map(([k, v]) => `- ${k} :: ${v}`)
    .join("\n");
  const active = stats.books.filter((b) =>
    ["IDEA", "OUTLINE", "DRAFTING", "REVISING", "NEXT"].includes(b.todo)
  );
  const byBook = stats.books
    .filter((b) => b.words || b.durationMin)
    .sort((a, b) => (b.words || 0) - (a.words || 0))
    .map((b) => `- ${b.todo} ${b.title} :: 字数 ${formatWords(b.words)} · 时长 ${formatDuration(b.durationMin)}`)
    .join("\n");

  return `* 统计 :stats:
:PROPERTIES:
:TOTAL: ${stats.totalTracked}
:ACTIVE: ${active.length}
:WORDS_TOTAL: ${stats.totalWords}
:DURATION_TOTAL: ${formatDuration(stats.totalDurationMin)}
:DRAFTING: ${stats.byTodo.DRAFTING || 0}
:REVISING: ${stats.byTodo.REVISING || 0}
:PUBLISHED: ${stats.byTodo.PUBLISHED || 0}
:END:

** 创作概览
- 作品数 :: ${stats.totalTracked}
- 进行中 :: ${active.length}
- 总字数 :: ${formatWords(stats.totalWords)}（${stats.totalWords}）
- 总投入时长 :: ${formatDuration(stats.totalDurationMin)}
- DRAFTING :: ${stats.byTodo.DRAFTING || 0}
- REVISING :: ${stats.byTodo.REVISING || 0}
- PUBLISHED :: ${stats.byTodo.PUBLISHED || 0}

** 字数与时长（按条目）
${byBook || "- （尚未填写 :WORDS: / :DURATION:）"}

** 状态计数
${todoLines || "- （无）"}

`;
}

export function renderWriting(root) {
  return renderOrgBuffer(root, {
    fileUrl: "./data/writing.org",
    bufferName: "writing.org",
    modeLineRight: "data/writing.org",
    buildStatsOrg: statsAsOrg,
    buildModeLine: (doc) => {
      const s = orgReadingStats(doc);
      return `创作 ${s.totalTracked} · 字数 ${formatWords(s.totalWords)} · DRAFTING:${s.byTodo.DRAFTING || 0}`;
    },
  });
}
