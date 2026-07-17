# Kainnne 🌸

個人學習知識庫 — 把零散的筆記，沉澱成隨時能回來查閱的知識庫。

**線上網站：** [https://zx50416.github.io/WikiNB/](https://zx50416.github.io/WikiNB/)

## 這是什麼

你寫 **raw** 筆記 → AI 整理成 **wiki** → Codex 幫你回想、複習、延伸學習。  
姊妹站 [Me 履歷](https://zx50416.github.io/Me/) 負責對外展示；這裡負責對自己學習。

## 快速開始

```bash
npm install
npm run dev
```

打開 [http://localhost:4321/WikiNB/](http://localhost:4321/WikiNB/) 預覽。

## 怎麼新增筆記

1. 把原始筆記放到 `raw/inbox/`（或在 Codex 頁拖檔上傳，**只存檔**）
2. 在 Cursor 說：「請 ingest」→ AI 寫入 `wiki/`
3. 登入網站 → 按「同步 Wiki」（或本地 `npm run build`）

## 登入與 Codex

1. 網站 **登入**（帳密 + 雙信箱驗證碼）
2. 首頁 **Search** + **Codex**
3. Codex 連家中 Mac 的 CLI（ChatGPT Plus，**不走 API 計費**）
4. 可問 wiki、也可問 raw；自由延伸討論

瀏覽 wiki **不需要** Mac；Codex / 同步 / 上傳 raw 需要 `npm run bridge`。

## Bridge

```bash
npm run bridge:install
cp bridge/.env.example bridge/.env
npm run bridge
```

詳見 [bridge/README.md](./bridge/README.md)。遠端需 [Tailscale](https://tailscale.com)。

## 資料夾

| 資料夾 | 用途 |
|--------|------|
| `raw/inbox/` | 原始筆記 |
| `raw/archive/` | 已整理過的原始檔 |
| `wiki/` | 整理後的 Wiki |
| `bridge/` | 登入、Codex、同步、上傳 raw |
| `AGENTS.md` | AI 整理與角色說明 |

## 文件

| 文件 | 內容 |
|------|------|
| [AGENTS.md](./AGENTS.md) | 專案目的與 ingest 規則 |
| [bridge/README.md](./bridge/README.md) | Bridge 設定 |
| [docs/ecosystem.md](./docs/ecosystem.md) | 與 Me 的分工 |
| [docs/local-codex-bridge.md](./docs/local-codex-bridge.md) | Bridge／Codex 現況摘要 |

## 建置

```bash
npm run build
```

推 `main` 後 GitHub Actions 部署 Pages。

## 技術

Astro + Tailwind；本機 Bridge + [Codex CLI](https://github.com/openai/codex)。
