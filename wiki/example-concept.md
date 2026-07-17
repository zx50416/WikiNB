---
title: 範例概念：LLM Wiki
description: 了解 LLM Wiki 模式 — 編譯一次、持續更新的知識庫
tags:
  - 概念
  - AI
  - 範例
date: 2026-07-17
---

# LLM Wiki 是什麼？

**LLM Wiki** 是 Andrej Karpathy 提出的一種個人知識庫模式。核心想法很簡單：

> 與其每次問問題都重新搜尋原始文件（RAG），不如讓 AI **一次性編譯**成結構化 Wiki，之後持續更新。

## 三層架構

| 層級 | 資料夾 | 說明 |
|------|--------|------|
| 原始來源 | `raw/` | 你上傳的 PDF、文章、會議記錄 |
| Wiki 頁面 | `wiki/` | AI 維護的摘要、概念頁、交叉連結 |
| 規則文件 | `AGENTS.md` | 告訴 AI 怎麼整理、命名、連結 |

## 為什麼比 RAG 適合個人使用？

- **知識會累積** — 不是每次從零拼湊答案
- **可讀可改** — 全是 Markdown，用 Obsidian 或任何編輯器都能看
- **零基礎設施** — 不需要向量資料庫或 Embedding API
- **這個網站** — 把 `wiki/` 的內容變成漂亮的網頁

## 延伸閱讀

- [[welcome]] — 回到首頁
- [[how-to-add-notes]] — 如何新增筆記
