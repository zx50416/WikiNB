# WikiNB Bridge

本機 API：

- 登入（帳密 + 雙信箱驗證碼）
- 同步 `wiki/` → GitHub
- Codex 問答（讀 wiki，學習／提醒助理）
- 拖檔上傳到 `wiki/`
- 網頁重新命名 `wiki/*.md`（Rename）

## 快速設定

```bash
npm run bridge:install
cp bridge/.env.example bridge/.env
npm run bridge
```

## 拖放 wiki 筆記

拖入整理好的 `.md` → 存到本機 `wiki/`，並更新 `index.md`。  
再按網站「同步 Wiki」上線。

## 一鍵同步

```env
AUTO_GIT_PUSH=true
# 可選：GITHUB_TOKEN=ghp_…
```

## bridge/.env 必填

| 變數 | 說明 |
|------|------|
| `WIKINB_AUTH_USER` / `WIKINB_AUTH_PASS` | 登入帳密 |
| `WIKINB_AUTH_EMAILS` | 驗證碼信箱 |
| `SMTP_USER` / `SMTP_PASS` | Gmail 應用程式密碼 |
| `CORS_ORIGINS` | 含 `https://zx50416.github.io` |

## Codex

```bash
codex /status   # ChatGPT Plus，勿用 API Key
```

## Tailscale（選用）

更新 `config/sites.json` 的 `bridge.productionUrl`。
