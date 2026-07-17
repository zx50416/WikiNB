---
title: 如何新增筆記
description: 一步步教你把新筆記加入 WikiNB 知識庫
tags:
  - 指南
  - 教學
date: 2026-07-17
---

# 如何新增筆記

整個流程設計成「你只管丟，AI 負責整理」。

## 步驟 1：放入原始筆記

把任何格式的筆記放到 `raw/inbox/`：

- `.md`、`.txt` 純文字
- 從網頁複製的內容
- 會議記錄、讀書摘要

## 步驟 2：告訴 AI

在 Cursor 裡說：

> 「我在 raw/inbox 新增了 [主題] 的筆記，請幫我 ingest 到 wiki，並更新網站。」

AI 會：
1. 讀取原始筆記
2. 在 `wiki/` 建立或更新對應頁面
3. 加上標籤、摘要、交叉連結
4. 更新 `wiki/index.md` 目錄

## 步驟 3：預覽網站

```bash
npm run dev
```

打開瀏覽器就能看到新頁面。用搜尋框輸入關鍵字也能找到。

## Wiki 頁面格式

每篇 wiki 頁面開頭需要 frontmatter：

```yaml
---
title: 頁面標題
description: 一句話摘要
tags:
  - 標籤1
  - 標籤2
date: 2026-07-17
---
```

## 相關

- [[welcome]]
- [[example-concept]]
