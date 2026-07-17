---
title: 如何新增筆記
description: 上傳或放入 raw/inbox，再請 AI ingest 到 wiki
type: note
status: active
tags:
  - 指南
date: 2026-07-17
updated: 2026-07-18
---

# 如何新增筆記

## 步驟

1. 把原始內容放到 `raw/inbox/`  
   （也可在網站 Codex 頁拖入 `.md`／`.txt`，**只會存檔，不會自動整理**）
2. 在 Cursor 說：「請 ingest」或「我新增了筆記」
3. AI 在 `wiki/` 建立或更新頁面，並更新 `index.md`
4. 若要上線：登入網站 →「同步 Wiki」

## Wiki 頁面 frontmatter

```yaml
---
title: 頁面標題
description: 一句話摘要
type: note          # note | learning
status: active
tags:
  - 標籤1
date: 2026-07-17
---
```

## Codex 能做什麼

整理完之後（或甚至只看 raw），可在 Codex 問：這份筆記在講什麼、怎麼複習、原文怎麼改更好——不必限制只能念 wiki。

## 相關

- [[welcome]]
- [[example-concept]]
- [[learning-bridge-codex]]
