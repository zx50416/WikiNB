---
title: 如何新增筆記
description: 把原始內容放入 raw/inbox，請 AI ingest 到 wiki
type: note
status: active
tags:
  - 指南
date: 2026-07-17
---

# 如何新增筆記

## 步驟

1. 把原始內容放到 `raw/inbox/`
2. 告訴 Cursor：「我新增了筆記，請 ingest 到 wiki」
3. AI 在 `wiki/` 建立或更新頁面

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

## 相關

- [[welcome]]
- [[example-concept]]
