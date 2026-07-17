# WikiNB — AI 知識庫維護規則

## 這個專案是做什麼的

**Kainnne / WikiNB** 是個人學習助手，不是對外履歷站。

流程很單純：

1. 你寫／上傳 **raw** 原始筆記（可零散、可隨手）
2. 需要時請 AI（Cursor）**ingest** 成結構化 `wiki/` 頁面
3. **Codex**（網站 `/codex` 或本機 CLI）讀 `wiki/` + `raw/`，幫你彙整、回想、複習、延伸思考

AI **不要過度限制自己**：可以討論 raw 原文、延伸學習、舉例、推測（推測請標明）。  
「wiki 沒寫」不是拒絕回答的理由；需要時請直接讀工作區檔案。

## 品牌

- 名稱：**Kainnne**
- 標語：把零散的筆記，沉澱成隨時能回來查閱的知識庫。

## 資料夾

```
WikiNB/
├── raw/
│   ├── inbox/     待整理的原始筆記（網站拖檔只會存到這裡）
│   └── archive/   已整理過的原始檔（可選）
├── wiki/          整理後的 Wiki（網站顯示與搜尋）
│   └── index.md
├── config/
├── docs/          簡短說明（以現況為準）
├── bridge/        本機登入 / Codex / 同步 / 上傳 raw
└── src/           網站程式（除非改版型，否則少動）
```

## 內容類型

| type | 說明 |
|------|------|
| `note` | 已學到、可複習的筆記 |
| `learning` | 想學的目標與路線 |

## Ingest（整理 raw → wiki）

**網站拖檔不會自動 ingest**，只存 `raw/inbox/`。  
當使用者在 Cursor 說「請 ingest」或「我新增了筆記」時：

1. 讀取 `raw/inbox/`（或指定檔案）
2. 判斷 `note` / `learning`
3. 建立或更新 `wiki/[slug].md`（含 frontmatter）
4. 交叉連結 `[[slug]]`
5. 更新 `wiki/index.md`
6. 若有 learning 變動，更新 `wiki/meta-learning-map.md`
7. 可將 raw 移到 `raw/archive/`

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

### 命名

- 檔名：小寫英文 + 連字號，如 `machine-learning-basics.md`
- 標題：繁體中文（內容本身是英文除外）
- 元資料：`meta-` 前綴

### 搜尋友善

- `description` 清楚；`tags` 2–5 個；正文用 h2 / h3
- `relatedSkills` 對應 `config/skills-vocabulary.json`

## Codex 可以幫什麼（自由發揮）

使用者可能會請你：

- 回想／彙整「我之前寫過什麼」
- 解釋或延伸 wiki / raw 內容
- 看 raw 原文怎麼寫、怎麼改更好
- 複習、出題、規劃下一步
- 對照 Me 履歷 skills 做缺口討論（可讀 `../resume-website/v1/data.js`）

不需要把自己鎖成「只能念 wiki 摘要」的機器人。

## 刪除 wiki 頁

1. 刪 `wiki/[slug].md`
2. 更新 `wiki/index.md`
3. 清理其他頁的 `[[slug]]`
4. 下次 build / deploy 後網站自動少該頁

## 網站與 Bridge

```bash
npm run dev      # 本地預覽
npm run build    # 建置
npm run bridge   # 登入 / Codex / 同步 / 上傳 raw
```

| 項目 | 說明 |
|------|------|
| 公開站 | https://zx50416.github.io/WikiNB/（push `main` 後 Actions 部署） |
| 瀏覽 wiki | 不需 Mac |
| 登入 / Codex / 同步 / 拖檔存 raw | 需 Bridge + Mac 在線 |

登入後：

- **同步 Wiki**：push `wiki/`（需 `AUTO_GIT_PUSH=true`）
- **Codex**：自由問答；可讀 wiki 與 raw
- **拖檔**：只存到 `raw/inbox/`，不自動整理

設定見 `bridge/README.md`。

## 與 Me 的關係

- **Me**：對外能力證明（`../resume-website`）
- **Kainnne**：對內學習與筆記（本 repo）
