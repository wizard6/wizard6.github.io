# JSON 日志填写说明

## 文件
- 数据：`data/journal.json`
- 说明：本文件
- Org 版日志仍在：`data/journal.org`（两套并存）

## 结构

```json
{
  "title": "JSON 日志",
  "version": 1,
  "entries": [
    {
      "id": "2026-09-15-1",
      "date": "2026-09-15",
      "type": "NOTE",
      "title": "标题",
      "body": "正文",
      "tags": ["工作"],
      "mood": "平静",
      "duration": "25m",
      "project": "许德拉"
    }
  ]
}
```

## 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 建议 | 唯一 id，可用 `日期-序号` |
| date | 是 | `YYYY-MM-DD` |
| type | 是 | `NOTE` / `WORK` / `LIFE` / `EVENT` / `TODO` / `DONE` |
| title | 是 | 标题 |
| body | 否 | 正文 |
| tags | 否 | 字符串数组 |
| mood | 否 | 心情 |
| duration | 否 | 时长，如 `25m` / `1h30m` |
| project | 否 | 关联作品 |

## 注意
- 只往 `entries` 里追加，不要改 `version` 除非升级格式。
- 需要代填时：发日期、类型、标题、正文即可。
