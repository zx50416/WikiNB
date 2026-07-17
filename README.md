# Kiannne 🌸

個人學習知識庫 — 把零散的筆記，沉澱成隨時能回來查閱的知識庫。

**線上網站：** [https://zx50416.github.io/WikiNB/](https://zx50416.github.io/WikiNB/)

## 快速開始

```bash
npm install
npm run dev
```

打開 [http://localhost:4321/WikiNB/](http://localhost:4321/WikiNB/) 預覽。

## 這是什麼

| 項目 | 說明 |
|------|------|
| **品牌** | Kiannne |
| **用途** | 個人筆記、學習目標、Codex 問答、Wiki 同步 |
| **姊妹站** | [Me 履歷網站](https://zx50416.github.io/Me/) — 對外展示能力 |

## 怎麼新增筆記

1. 把原始筆記放到 `raw/inbox/`
2. 告訴 Cursor：「我新增了筆記，請 ingest 到 wiki」
3. AI 在 `wiki/` 建立整理好的頁面
4. 登入網站 → 按「同步 Wiki」推送到 GitHub（或本地 `npm run build`）

## 登入與 Codex

只有你自己使用。登入流程：

1. 開啟網站 → **登入**
2. 按「寄送驗證碼」→ **同一組 6 位數**會同時寄到兩個信箱
3. 輸入驗證碼 → 跳回首頁
4. 首頁搜尋列變成 **Search** + **Codex** 雙按鈕
5. Codex 連家中 Mac 的 CLI（ChatGPT Plus 訂閱，**不走 API 計費**）

Mac 需開機且 Bridge 在跑（`npm run bridge`）。瀏覽 wiki 不需要 Mac。

## Bridge 本機服務

```bash
npm run bridge:install
cp bridge/.env.example bridge/.env   # 填入信箱、Gmail 應用程式密碼
npm run bridge
```

詳見 [bridge/README.md](./bridge/README.md)。

遠端使用需 [Tailscale](https://tailscale.com)（免費），並更新 `config/sites.json` 的 `bridge.productionUrl`。

## 資料夾

| 資料夾 | 用途 |
|--------|------|
| `raw/inbox/` | 原始筆記 |
| `wiki/` | AI 維護的 Wiki（網站讀這裡） |
| `bridge/` | 本機 API（登入、Codex、同步） |
| `config/` | 網站與 Me 整合設定 |
| `docs/` | 設計文件 |
| `src/` | 網站程式碼 |

## 內容類型

- `note` — 已學到的筆記
- `learning` — 想學的目標

## 文件

| 文件 | 內容 |
|------|------|
| [docs/ecosystem.md](./docs/ecosystem.md) | 兩站分工、內容模型、AI 模式 |
| [docs/local-codex-bridge.md](./docs/local-codex-bridge.md) | Bridge + Codex + Tailscale 設計 |
| [bridge/README.md](./bridge/README.md) | Bridge 設定步驟 |
| [AGENTS.md](./AGENTS.md) | AI 整理 wiki 的規則 |

## 建置與部署

```bash
npm run build
npm run preview
```

推送到 GitHub `main` 分支後，Actions 自動部署到 GitHub Pages。

## 技術

- [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com)
- LLM Wiki 模式（Karpathy）
- 本機 Bridge + [Codex CLI](https://github.com/openai/codex)（ChatGPT Plus）
