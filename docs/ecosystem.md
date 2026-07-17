# Kiannne 生態系規劃

> 本文件描述 WikiNB（Kiannne）與 Me 履歷網站的分工、內容模型、AI 能力，以及兩站整合方式。

---

## 1. 兩個網站的分工

```
Projects/
├── resume-website/     →  GitHub: zx50416/Me
│   「我是誰、我能做什麼」
│
└── WikiNB/             →  Kiannne
    「我在學什麼、我記了什麼、我還缺什麼」
```

| | **Me（履歷網站）** | **Kiannne（WikiNB）** |
|---|---|---|
| **目的** | 對外證明能力 | 對自己學習與複習 |
| **受眾** | 雇主、合作者、訪客 | 主要是你自己 |
| **內容** | 經歷、技能、專案 | 筆記、學習目標、缺口 |
| **語氣** | 精煉、專業 | 詳細、探索中 |
| **資料** | `v1/data.js` | `wiki/` + `raw/` |
| **AI** | 無（或未來履歷摘要） | 回憶、方向、缺口 |
| **設定** | `config/sites.json` → me | `config/sites.json` → wikinb |

> **Me = 證明我已經會什麼**  
> **Kiannne = 追蹤我還在學什麼、記了什麼、缺什麼**

---

## 2. 品牌

| 項目 | 值 |
|------|-----|
| 網站名稱 | **Kiannne** |
| 標語 | 把零散的筆記，沉澱成隨時能回來查閱的知識庫。 |
| /repo 名稱 | WikiNB（技術名），對外品牌 Kiannne |

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

## 4. AI 的四種模式

| 模式 | 觸發 | 做什麼 |
|------|------|--------|
| **Recall** | 「我筆記裡 XXX 是什麼？」 | 搜 wiki，根據筆記回答 |
| **Review** | 「複習上週 ML 筆記」 | 摘要 + 自測 |
| **Direction** | 「我現在該學什麼？」 | 看 learning 頁 + priority |
| **Gap** | 「我還缺什麼能力？」 | Me skills vs wiki 進度 |

### Gap 分析流程

```
Me v1/data.js (skills, projects)
        ↓
WikiNB wiki/ (note, learning, progress)
        ↓
config/skills-vocabulary.json（對照標籤）
        ↓
更新 meta-gap-analysis.md 或 /ask 直接回答
```

---

## 5. 網站頁面

| 頁面 | 路徑 | 狀態 | 功能 |
|------|------|------|------|
| 首頁 | `/` | ✅ | Kiannne、搜尋、最近更新、Wiki 筆記入口 |
| Wiki 筆記 | `/wiki` | ✅ | 滾動式列表，點選展開 |
| 單篇 | `/wiki/[slug]` | ✅ | 獨立頁面 |
| 搜尋 | `/search` | ✅ | Fuse 模糊搜尋 |
| 登入 | `/login` | 🔲 占位 | 本機 Bridge 登入 |
| AI 問答 | `/ask` | 🔲 規劃 | Recall / Direction / Gap |
| 工作室 | `/studio` | 🔲 規劃 | 上傳 raw、ingest |

### 導覽

- 左上角：**Kiannne**
- 右上角：**首頁**、**登入**

---

## 6. 兩站整合

### 現在（低耦合）

- `config/sites.json` 記錄兩站 URL
- `config/skills-vocabulary.json` 共享技能詞彙
- Me 的 projects 可連結 WikiNB（手動更新 `data.js`）

### 中期（Bridge 讀 Me）

本機 Bridge 讀取：

```
../resume-website/v1/data.js
```

用於 Gap 分析，不 merge 進 wiki。

### 整合原則

| 做 | 不做 |
|----|------|
| Me → Kiannne 連結 | 履歷全文複製進 wiki |
| 共享 skills 詞彙 | 兩站共用 build |
| AI 讀 Me 做 gap | Me 依賴 WikiNB 才能顯示 |
| 學完後手動更新 Me | 自動改履歷（需確認） |

---

## 7. 本機 Bridge 與 Codex

詳見 [local-codex-bridge.md](./local-codex-bridge.md)。

摘要：

- **Tailscale**（免費）連回家中 Mac
- **Codex CLI**（ChatGPT Plus 登入，非 API 計費）
- Mac 離線 → AI 功能不可用，靜態 wiki 仍可瀏覽

---

## 8. 實作階段

| 階段 | 內容 | 狀態 |
|------|------|------|
| Phase 1 | 靜態 wiki + 搜尋 | ✅ |
| Phase 1.5 | Kiannne 品牌、note/learning、Wiki accordion、文件 | ✅ |
| Phase 2 | Bridge + `/ask` | ⏳ |
| Phase 3 | `/studio` ingest + Tailscale | ⏳ |
| Phase 4 | 登入、離線提示 | ⏳ |
| Phase 5 | Gap 分析、launchd 自啟 | ⏳ |
| Phase 6 | GitHub Pages 部署 | ⏳ 下次對話 |

---

## 9. 文件索引

| 文件 | 內容 |
|------|------|
| `README.md` | 專案入門 |
| `AGENTS.md` | AI 整理 wiki 規則 |
| `docs/ecosystem.md` | 本文件 |
| `docs/local-codex-bridge.md` | Bridge + Codex + Tailscale |
| `config/sites.json` | 兩站 URL 與角色 |
| `config/skills-vocabulary.json` | 技能對照表 |

---

*最後更新：2026-07-17*
