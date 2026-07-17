# Kainnne 🌸

筆記彙整 + AI 提醒助理。

**線上：** [https://zx50416.github.io/WikiNB/](https://zx50416.github.io/WikiNB/)

## 怎麼用

1. 把筆記整理成 `.md`（建議含 frontmatter）
2. 登入 → Codex 頁**拖入 wiki**
3. 按**同步 Wiki** 上線
4. 用 Codex 回想、複習、延伸討論

姊妹站：[Me 履歷](https://zx50416.github.io/Me/)

## 本地

```bash
npm install
npm run dev          # http://localhost:4321/WikiNB/
npm run bridge       # 登入 / Codex / 同步 / 上傳
```

見 [bridge/README.md](./bridge/README.md)、[AGENTS.md](./AGENTS.md)。

## 資料夾

| 資料夾 | 用途 |
|--------|------|
| `wiki/` | 筆記（網站讀這裡） |
| `bridge/` | 本機 API |
| `AGENTS.md` | AI／專案規則 |

## 建置

推 `main` → GitHub Actions → Pages。
