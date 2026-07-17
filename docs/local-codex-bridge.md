# Kainnne 本機 Bridge 與 Codex（現況）

## 兩層

| 層 | 內容 | 需 Mac |
|----|------|--------|
| Pages | wiki 瀏覽、搜尋 | 否 |
| Bridge | 登入、Codex、同步、上傳 wiki | 是 |

## API

| 路徑 | 說明 |
|------|------|
| `/api/health` | 在線 |
| `/api/auth/*` | 登入 |
| `/api/sync` | push `wiki/` |
| `/api/wiki/upload` | 存到 `wiki/`（舊路徑 `/api/ingest` 相容） |
| `/api/codex/chat` | Codex 問答 |
| `/api/codex/models` / `/api/codex/stop` | 模型／停止 |

## 流程

1. `npm run bridge`
2. 拖整理好的 `.md` → `wiki/`
3. 「同步 Wiki」
4. Codex 問答／複習／提醒

見 [bridge/README.md](../bridge/README.md)、[AGENTS.md](../AGENTS.md)。
