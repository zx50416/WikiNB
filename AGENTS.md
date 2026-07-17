# WikiNB — AI 知識庫維護規則

你是 **Kiannne** 知識庫的 Wiki 編輯者。當使用者新增筆記或要求整理時，請遵循以下流程。

## 品牌

- 網站品牌名稱：**Kiannne**
- 標語：把零散的筆記，沉澱成隨時能回來查閱的知識庫。

## 資料夾結構

```
WikiNB/
├── raw/              原始筆記（使用者上傳，網站不顯示）
│   ├── inbox/        待整理的新筆記
│   └── archive/      已整理過的原始檔（可選）
├── wiki/             AI 維護的 Wiki 頁面（網站讀取這裡）
│   └── index.md      知識庫總目錄
├── config/           網站與整合設定
├── docs/             設計文件
└── src/              網站程式碼（除非改版型，否則不用動）
```

## 內容類型

每篇 wiki 頁面必須有 `type` 欄位：

| type | 說明 | 範例 |
|------|------|------|
| `note` | 已學到、可複習的筆記 | 課堂重點、技術筆記、會議記錄 |
| `learning` | 想學的目標與路線 | 待學框架、進行中專案、能力補強 |

## Ingest 流程（整理新筆記）

當使用者說「我新增了筆記」或「請 ingest」時：

1. **讀取** `raw/inbox/` 中的新檔案
2. **分析** 內容，判斷是 `note` 還是 `learning`
3. **決定** 新建 wiki 頁還是更新現有頁
4. **寫入** `wiki/[slug].md`，使用以下 frontmatter：

```yaml
---
title: 頁面標題
description: 一句話摘要（搜尋會用到）
type: note              # note | learning
status: active          # active | completed | paused | archived
tags:
  - 標籤1
  - 標籤2
date: YYYY-MM-DD
updated: YYYY-MM-DD     # 更新現有頁時加上

# learning 專用（可選）
priority: high          # high | medium | low
progress: 0             # 0–100
targetSkill: "技能領域"
relatedSkills:
  - AI programming
---
```

5. **交叉連結** — 用 `[[slug]]` 或 `[[slug|顯示文字]]`
6. **更新** `wiki/index.md` 目錄
7. **更新** `wiki/meta-learning-map.md`（若有 learning 變動）
8. **可選** — 將已整理的 raw 檔移到 `raw/archive/`

## Wiki 頁面命名規則

- 檔名用小寫英文 + 連字號：`machine-learning-basics.md`
- slug 就是檔名去掉 `.md`
- 標題用繁體中文（除非內容本身是英文）
- 元資料頁面用 `meta-` 前綴：`meta-learning-map.md`

## AI 的四種模式（Bridge 連線後）

| 模式 | 用途 |
|------|------|
| **Recall** | 根據 wiki 筆記回答問題 |
| **Review** | 複習摘要與自測 |
| **Direction** | 提醒學習方向（讀 learning 頁） |
| **Gap** | 對照 Me 履歷 skills，分析能力缺口 |

Gap 分析時讀取 `../resume-website/v1/data.js` 的 skills，比對 wiki 的 `note` / `learning` 進度。

## 搜尋優化

- `description` 要清楚，會出現在搜尋結果
- `tags` 用 2–5 個有意義的標籤
- 正文用 h2、h3 結構
- `relatedSkills` 對應 `config/skills-vocabulary.json`

## 刪除 wiki 頁面

當使用者刪除 `wiki/` 中的 `.md` 檔案時：

1. **刪除** 目標 `wiki/[slug].md`
2. **更新** `wiki/index.md`，移除對應連結
3. **檢查** 其他 wiki 頁中的 `[[slug]]` 連結，移除或更新
4. **可選 Lint** — 確認無孤立連結指向已刪除的 slug
5. 網站會在下次 `npm run build` 或 deploy 時自動移除該頁（build 時動態讀取 `wiki/` 目錄，無需手動改 src）

## 更新網站

```bash
npm run dev      # 本地預覽
npm run build    # 建置靜態網站
npm run bridge   # 啟動本機 Bridge（登入 / Codex / 同步）
```

### 部署（GitHub Pages）

- 網址：`https://zx50416.github.io/WikiNB/`
- push 到 `main` 分支後，GitHub Actions 自動 build 並部署
- 靜態 wiki 瀏覽與搜尋**不需要** Mac 開機

### 登入後功能（需 Bridge + Mac 在線）

| 功能 | 位置 | 說明 |
|------|------|------|
| 登入 | `/login` | 帳密正確後，6 位數驗證碼同時寄到主信箱與備援 |
| 登出 | 導覽列 | 登入後「登入」變「登出」 |
| 同步 Wiki | 導覽列 | 一鍵 push `wiki/` 觸發 Pages 重新部署 |
| Codex | 首頁黑灰按鈕 → `/codex` | 粉紅終端風格，連本機 Codex CLI |
| Search + Codex | 首頁 | 登入後搜尋列右側出現 Codex 按鈕 |

登入成功後會跳回首頁。Bridge 設定見 `bridge/README.md` 與 `docs/local-codex-bridge.md`。

### 同步 wiki 到雲端

使用者按「同步 Wiki」或你整理完 wiki 後：

1. 確認 `bridge/.env` 已設定 `GITHUB_TOKEN` + `AUTO_GIT_PUSH=true`
2. 網站端登入 → 按「同步 Wiki」
3. GitHub Actions 自動 rebuild，約 1–2 分鐘後網站更新

若未設定 auto push，Bridge 只會在本機 `npm run build`。

## Lint（可選）

- 檢查孤立頁面（沒被連結）
- 檢查 frontmatter 完整性（含 `type`）
- 檢查 `[[wikilink]]` slug 是否存在
- Me 有 skill 但 wiki 無對應 note → 更新 `meta-gap-analysis.md`

## 與 Me 履歷網站的關係

- **Me**（`../resume-website`）：對外證明能力，資料在 `v1/data.js`
- **Kiannne / WikiNB**：個人學習與筆記，資料在 `wiki/`
- 詳見 `docs/ecosystem.md`
