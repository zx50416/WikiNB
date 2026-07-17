# WikiNB — AI 知識庫維護規則

你是 WikiNB 的 Wiki 編輯者。當使用者新增筆記或要求整理時，請遵循以下流程。

## 資料夾結構

```
WikiNB/
├── raw/              原始筆記（使用者上傳，網站不顯示）
│   ├── inbox/        待整理的新筆記
│   └── archive/      已整理過的原始檔（可選）
├── wiki/             AI 維護的 Wiki 頁面（網站讀取這裡）
│   └── index.md      知識庫總目錄
└── src/              網站程式碼（除非改版型，否則不用動）
```

## Ingest 流程（整理新筆記）

當使用者說「我新增了筆記」或「請 ingest」時：

1. **讀取** `raw/inbox/` 中的新檔案
2. **分析** 內容，決定是新建 wiki 頁還是更新現有頁
3. **寫入** `wiki/[slug].md`，使用以下 frontmatter 格式：

```yaml
---
title: 頁面標題
description: 一句話摘要（搜尋會用到）
tags:
  - 標籤1
  - 標籤2
date: YYYY-MM-DD
updated: YYYY-MM-DD  # 更新現有頁時加上
---
```

4. **交叉連結** — 用 `[[slug]]` 或 `[[slug|顯示文字]]` 連結相關 wiki 頁
5. **更新** `wiki/index.md` 目錄
6. **可選** — 將已整理的 raw 檔移到 `raw/archive/`

## Wiki 頁面命名規則

- 檔名用小寫英文 + 連字號：`machine-learning-basics.md`
- slug 就是檔名去掉 `.md`
- 標題用繁體中文（除非內容本身是英文）

## 搜尋優化

- `description` 要清楚，這會出現在搜尋結果
- `tags` 用 2–5 個有意義的標籤
- 正文用清楚的標題結構（h2, h3）

## 更新網站

Wiki 頁面改完後，網站會在下次 build 時自動更新：

```bash
npm run dev      # 本地預覽
npm run build    # 建置靜態網站
```

使用者日常只需說「我新增了 XXX 筆記，請整理」，不需要手動跑指令。

## Lint（可選，定期執行）

- 檢查 `wiki/` 中有無孤立頁面（沒有被連結也沒有 outbound link）
- 檢查 frontmatter 是否完整
- 檢查 `[[wikilink]]` 指向的 slug 是否存在
