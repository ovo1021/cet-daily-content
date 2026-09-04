# CET 备考助手 · 每日内容源（Daily Content Feed）

给 [四六级备考工具网页版](../cet-prep-app/index.html) 提供**每日自动更新内容**的公开数据仓库。

## 它怎么工作

```
GitHub Actions 每天 00:10（北京时间）自动运行
        │   node scripts/generate-daily.js
        ▼
  daily/<日期>.json  +  daily/latest.json   （按日期种子确定性生成）
        │  自动 commit & push
        ▼
网页版启动时 fetch raw.githubusercontent.com/.../daily/latest.json
        ▼
  首页出现「今日推送」卡片，单词队列优先加载当天推送词包
  拉取失败 → 自动回落到内置词库（离线仍可学）
```

## 目录

| 路径 | 说明 |
|---|---|
| `content/words.json` | 词库（音标 / 词性 / 释义 / 例句） |
| `content/quiz4.json` · `content/quiz6.json` | CET-4 / CET-6 模拟题语料 |
| `content/listening.json` | 听力短对话语料 |
| `content/tips.json` | 每日知识点池（词根 / 语法 / 写作 / 技巧） |
| `scripts/generate-daily.js` | 每日生成器：按日期种子选词包 + 每日一题 + 知识点 + 听力 + 每日一句 |
| `daily/latest.json` | 网页拉取的"今日推送"（每天被 Actions 刷新） |
| `.github/workflows/daily-content.yml` | 定时任务：每天 00:10 北京时间 |

## 想加内容？

直接编辑 `content/*.json` 后 push 即可，生成器会自动随机轮换使用新语料。
想验证某天会生成什么：

```bash
node scripts/generate-daily.js 2026-09-05   # 指定日期试跑
```

## 手动触发一次

仓库 Actions 页 → **Daily Content 每日内容生成** → Run workflow（可选）。

## 数据说明

- 单词为通用四六级核心词整理；模拟题与听力语料为**原创练习**，非官方真题。
- 仅供个人学习使用。
