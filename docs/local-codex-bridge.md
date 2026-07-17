# Kainnne 本機 Bridge 與 Codex（現況）

> 以實際程式為準。早期草案中的 `/ask`、`/studio`、網站自動 ingest 等**未採用**，已不再規劃為必做項。

## 兩層架構

| 層 | 內容 | Mac 是否要開 |
|----|------|----------------|
| 公開靜態 | GitHub Pages：wiki 瀏覽、搜尋 | 否 |
| Bridge | 登入、Codex、同步 wiki、上傳 raw | 是 |

## Bridge API（現況）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/health` | 是否在線 |
| POST | `/api/auth/send-code` | 帳密正確後寄驗證碼 |
| POST | `/api/auth/verify` | 換 session |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 登入狀態 |
| POST | `/api/sync` | push `wiki/`（或本機 build） |
| POST | `/api/ingest` / `/api/raw/upload` | **只存**到 `raw/inbox/`（不整理 wiki） |
| POST | `/api/codex/chat` | Codex 問答（可讀專案檔；自由學習助理） |
| GET | `/api/codex/models` | 模型列表 |
| POST | `/api/codex/stop` | 停止進行中的 Codex |

## 使用方式

1. Mac：`npm run bridge`
2. 網站登入 → Codex：自由問答（wiki + raw + 延伸）
3. 拖檔：存入 `raw/inbox/`
4. 整理成 wiki：回 Cursor 說「請 ingest」
5. 「同步 Wiki」：把 `wiki/` 推上 GitHub

設定步驟見 [bridge/README.md](../bridge/README.md)。  
筆記規則與專案目的見 [AGENTS.md](../AGENTS.md)。

## 費用與安全

- Codex：ChatGPT Plus 訂閱（勿用 API Key 登入）
- Tailscale 個人版、GitHub Pages：免費
- 驗證碼／帳密只在 Bridge，不進靜態站前端秘密
