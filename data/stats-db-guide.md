# 数值设计库填写说明

## 文件
- 数据：`data/stats-db.json`
- 说明：本文件

## 结构

```json
{
  "title": "数值设计库",
  "version": 1,
  "categories": ["战斗", "成长", "经济", "掉落", "关卡", "其他"],
  "entries": [
    {
      "id": "hyd-atk-curve",
      "name": "攻击力成长",
      "category": "成长",
      "project": "许德拉",
      "unit": "点",
      "formula": "base + level * k",
      "params": { "base": 10, "k": 2.5 },
      "table": [
        { "level": 1, "value": 12.5 },
        { "level": 2, "value": 15 }
      ],
      "tags": ["战斗", "主线"],
      "notes": "前期偏平，后期再拉高"
    }
  ]
}
```

## 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| id | 是 | 唯一 id |
| name | 是 | 名称 |
| category | 建议 | 分类（与 categories 对应） |
| project | 否 | 关联作品，如 许德拉 |
| unit | 否 | 单位 |
| formula | 否 | 公式（字符串） |
| params | 否 | 公式参数对象 |
| table | 否 | 离散表 `[{level/key, value}]` |
| tags | 否 | 标签数组 |
| notes | 否 | 备注 |

需要代填时：发名称、分类、公式/表、关联项目即可。
