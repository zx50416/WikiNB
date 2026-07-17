# Kainnne 生態系規劃

> 本文件描述 WikiNB（Kainnne）與 Me 履歷網站的分工、內容模型、AI 能力，以及兩站整合方式。

---

## 1. 兩個網站的分工

```
Projects/
├── resume-website/     →  GitHub: zx50416/Me
│   「我是誰、我能做什麼」
│
└── WikiNB/             →  Kainnne
    「我在學什麼、我記了什麼、我還缺什麼」
```

| | **Me（履歷網站）** | **Kainnne（WikiNB）** |
|---|---|---|
| **目的** | 對外證明能力 | 對自己學習與複習 |
| **受眾** | 雇主、合作者、訪客 | 主要是你自己 |
| **內容** | 經歷、技能、專案 | 筆記、學習目標、缺口 |
| **語氣** | 精煉、專業 | 詳細、探索中 |
| **資料** | `v1/data.js` | `wiki/` + `raw/` |
| **AI** | 無（或未來履歷摘要） | 回憶、方向、缺口 |
| **設定** | `config/sites.json` → me | `config/sites.json` → wikinb |

> **Me = 證明我已經會什麼**  
> **Kainnne = 追蹤我還在學什麼、記了什麼、缺什麼**

---

## 2. 品牌

| 項目 | 值 |
|------|-----|
| 網站名稱 | **Kainnne** |
| 標語 | 把零散的筆記，沉澱成隨時能回來查閱的知識庫。 |
| /repo 名稱 | WikiNB（技術名），對外品牌 Kainnne |

---

## 3. 內容模型：兩種性質

| type | 中文 | 說明 |
|------|------|------|
| `note` | 筆記 | 已學到、可複習的知識 |
| `learning` | 學習目標 | 想學的、進行中的路線 |

### Frontmatter 範本

```yaml
---
title: 頁面標題
description: 一句話摘要
type: note              # note | learning
status: active          # active | completed | paused | archived
tags:
  - 標籤
date: 2026-07-17

# learning 專用
priority: high
progress: 30
targetSkill: "前端框架"
relatedSkills:
  - AI programming
---
```

### 元資料頁

| 檔案 | 用途 |
|------|------|
| `wiki/meta-learning-map.md` | 學習路線總覽 |
| `wiki/meta-gap-analysis.md` | 能力缺口（對照 Me skills） |

---

## 4. AI 可以怎麼幫你（非強制模式）

Codex／Cursor 是**自由學習助理**，可讀 `wiki/` 與 `raw/`。常見用法包括：

| 用途 | 例子 |
|------|------|
| 回想彙整 | 「我之前關於 LLM 寫過什麼？」 |
| 複習 | 「幫我出幾題自測」 |
| 方向 | 「接下來該補什麼？」 |
| 缺口 | 對照 Me skills 與 wiki 進度 |
| 看 raw | 「inbox 這份 MFCC 筆記在講什麼？」 |

不需要把自己鎖成「只能念 wiki、沒寫就說不知道」。

Gap 若要做：讀 `../resume-website/v1/data.js` + `wiki/` + `config/skills-vocabulary.json`。

---

## 5. 網站頁面（現況）

| 頁面 | 路徑 | 狀態 |
|------|------|------|
| 首頁 | `/` | ✅ 搜尋、入口、登入後 Codex |
| Wiki 列表 | `/wiki` | ✅ |
| 單篇 | `/wiki/[slug]` | ✅ |
| 搜尋 | `/search` | ✅ |
| 登入 | `/login` | ✅ 帳密 + 驗證碼 |
| Codex | `/codex` | ✅ 問答、拖檔存 raw、計時 |

未實作且不再追蹤：`/ask`、`/studio`（功能已由 Codex + Cursor ingest 取代）。

---

## 6. 兩站整合

### 現在（低耦合）

- `config/sites.json` 記錄兩站 URL
- `config/skills-vocabulary.json` 共享技能詞彙
- Me 的 projects 可連結 WikiNB（手動更新 `data.js`）

### 可選：Bridge／AI 讀 Me

```
../resume-website/v1/data.js
```

用於缺口討論，不 merge 進 wiki。

### 原則

| 做 | 不做 |
|----|------|
| Me → Kainnne 連結 | 履歷全文複製進 wiki |
| 共享 skills 詞彙 | 兩站共用 build |
| AI 讀 Me 討論缺口 | Me 依賴 WikiNB 才能顯示 |

---

## 7. 本機 Bridge 與 Codex

詳見 [local-codex-bridge.md](./local-codex-bridge.md)。

- Tailscale（選用）連回家中 Mac
- Codex CLI（ChatGPT Plus）
- Mac 離線 → AI／同步不可用，靜態 wiki 仍可瀏覽

---

## 8. 現況摘要

| 項目 | 狀態 |
|------|------|
| 靜態 wiki + 搜尋 + Pages | ✅ |
| Bridge 登入／同步／Codex | ✅ |
| 拖檔存 `raw/inbox` | ✅（不自動 ingest） |
| Cursor ingest → wiki | ✅（依 `AGENTS.md`） |
| `/ask`、`/studio` | ❌ 已放棄 |

---

## 9. 文件索引

| 文件 | 內容 |
|------|------|
| `README.md` | 入門 |
| `AGENTS.md` | 專案目的與 ingest |
| `docs/ecosystem.md` | 本文件 |
| `docs/local-codex-bridge.md` | Bridge／Codex 現況 |
| `config/sites.json` | 兩站 URL |
| `config/skills-vocabulary.json` | 技能對照 |

---

*最後更新：2026-07-18*
