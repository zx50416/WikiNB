---
title: 範例概念：LLM Wiki
description: 了解 LLM Wiki 模式 — 編譯一次、持續更新的知識庫
type: note
status: active
tags:
  - 概念
  - AI
  - 範例
date: 2026-07-17
relatedSkills:
  - AI programming
---

# LLM Wiki 是什麼？

**LLM Wiki** 是 Andrej Karpathy 提出的一種個人知識庫模式：讓 AI **一次性編譯**成結構化 Wiki，之後持續更新，而不是每次問問題都重新搜尋原始文件。

## 三層架構

| 層級 | 資料夾 | 說明 |
|------|--------|------|
| 原始來源 | `raw/` | 上傳的原始筆記 |
| Wiki 頁面 | `wiki/` | AI 維護的摘要與交叉連結 |
| 規則文件 | `AGENTS.md` | AI 整理規則 |

## 延伸閱讀

- [[welcome]]
- [[how-to-add-notes]]
