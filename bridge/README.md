# WikiNB Bridge

家中 Mac 上執行的本機 API，負責：

- Email 驗證碼登入（同一組 6 位數同時寄到兩個信箱）
- 一鍵同步 wiki → GitHub（觸發 Pages 重新部署）
- Codex CLI 問答（ChatGPT Plus 訂閱，非 API 計費）

## 快速設定

```bash
# 在專案根目錄
npm run bridge:install
cp bridge/.env.example bridge/.env
# 編輯 bridge/.env：兩個信箱、Gmail 應用程式密碼、Tailscale 等
npm run bridge
```

## bridge/.env 必填

| 變數 | 說明 |
|------|------|
| `WIKINB_AUTH_EMAILS` | 兩個信箱，逗號分隔（驗證碼同時寄出） |
| `SMTP_USER` / `SMTP_PASS` | Gmail + 應用程式密碼 |
| `CORS_ORIGINS` | 含 `https://zx50416.github.io` |

## 一鍵同步（網頁「同步 Wiki」）

在 `bridge/.env` 設定：

```env
GITHUB_TOKEN=ghp_你的PAT
AUTO_GIT_PUSH=true
```

按下網站導覽列的「同步 Wiki」會 `git add wiki/`、`commit`、`push`，GitHub Actions 自動 rebuild Pages。

## 遠端連線（Tailscale）

1. Mac 與外部裝置皆安裝 [Tailscale](https://tailscale.com)
2. 查 Mac 的 MagicDNS 名稱（例如 `kaine-mac.tail12345.ts.net`）
3. 更新 `config/sites.json` 的 `bridge.productionUrl`：

```json
"productionUrl": "http://kaine-mac.tail12345.ts.net:8787"
```

4. 可選：在 GitHub repo Variables 設定 `PUBLIC_BRIDGE_URL` 為同上 URL

## Codex CLI

```bash
npm install -g @openai/codex
codex /status   # 確認 Sign in with ChatGPT、Plan: Plus
```

**勿使用 API Key 登入**（會走按量計費）。

## 開機自啟（可選）

```bash
cp bridge/com.wikinb.bridge.plist.example ~/Library/LaunchAgents/com.wikinb.bridge.plist
# 編輯 plist 中的專案路徑
launchctl load ~/Library/LaunchAgents/com.wikinb.bridge.plist
```
