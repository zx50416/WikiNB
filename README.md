# WikiNB 🌸

個人 AI 知識庫 — 夢幻粉紅 Wiki 網站。

## 快速開始

```bash
npm install
npm run dev
```

打開 [http://localhost:4321](http://localhost:4321) 預覽網站。

## 怎麼新增筆記

1. 把原始筆記放到 `raw/inbox/`
2. 告訴 Cursor：「我新增了筆記，請 ingest 到 wiki」
3. AI 會在 `wiki/` 建立整理好的頁面
4. 重新整理瀏覽器或 `npm run dev` 即可看到

## 資料夾說明

| 資料夾 | 用途 |
|--------|------|
| `raw/inbox/` | 你丟原始筆記的地方 |
| `wiki/` | AI 維護的 Wiki（網站讀這裡） |
| `src/` | 網站程式碼 |

## 建置

```bash
npm run build    # 產生 dist/ 靜態網站
npm run preview  # 預覽建置結果
```

## 技術

- [Astro](https://astro.build) — 靜態網站
- [Tailwind CSS](https://tailwindcss.com) — 夢幻粉紅主題
- [Fuse.js](https://fusejs.io) — 模糊搜尋
