# Kiannne 本機連線與 Codex 整合設計

> **已實作（2026-07）**：Email OTP 登入、`/codex` 終端介面、導覽列「同步 Wiki」、Bridge 在 `bridge/server.js`。
> 下方部分章節仍為早期設計草案（帳密登入、`/ask`、`/studio`），以實際程式碼為準。

> 本文件描述：登入後如何從 **Kiannne**（WikiNB）網站連到家中 Mac、使用 Codex CLI（ChatGPT Plus 訂閱額度）完成 raw 整理、wiki 生成，以及基於個人資料的問答（Recall / Direction / Gap）。
>
> 範圍：本機 Bridge + Codex + 遠端連線。兩站分工與內容模型見 [ecosystem.md](./ecosystem.md)；筆記整理規則見 `AGENTS.md`。

---

## 0. 目前已實作的 API

| 方法 | 路徑 | 需登入 | 說明 |
|------|------|--------|------|
| GET | `/api/health` | 否 | Bridge 是否在線 |
| POST | `/api/auth/send-code` | 否 | 需 body `{ username, password }`；帳密正確後才寄 6 位數到 `WIKINB_AUTH_EMAILS` |
| POST | `/api/auth/verify` | 否 | 驗證碼正確 → session token（24h） |
| POST | `/api/auth/logout` | 是 | 登出 |
| GET | `/api/auth/me` | 是 | 確認已登入 |
| POST | `/api/sync` | 是 | push `wiki/` 到 GitHub（或本機 build） |
| POST | `/api/codex/chat` | 是 | Codex CLI 問答（read-only sandbox） |

**登入流程（實作版）：**

1. 使用者開 `/login`，輸入帳號密碼 → POST `/api/auth/send-code`
2. 帳密正確後，同一組驗證碼寄到 `.env` 中所有信箱（主 + 備援）
3. POST `/api/auth/verify` { code } → token 存 sessionStorage
4. 跳回首頁；導覽列顯示登出 + 同步 Wiki；首頁 Search 旁出現 Codex

設定步驟見 [bridge/README.md](../bridge/README.md)。

---

## 1. 設計目標

| 目標 | 說明 |
|------|------|
| **零 API 計費** | 使用 Codex CLI + ChatGPT Plus 登入，不走 OpenAI API Key 按量計費 |
| **遠端可用** | 圖書館等外部電腦登入網站後，可連回家中 Mac 使用 AI 功能 |
| **懶人流程** | 登入後可在網站端：上傳 raw、觸發 ingest、問答，不必開 Cursor |
| **離線優雅降級** | Mac 未開機或 Bridge 未連線時，公開 wiki 仍可瀏覽，AI 功能顯示不可用 |
| **零額外費用** | Tailscale 個人版、GitHub Pages 皆免費 |

---

## 2. 整體架構（兩層分離）

```
┌──────────────────────────────────────────────────────────────┐
│  第一層：公開靜態層（永遠在線）                                  │
│                                                              │
│  GitHub Pages / Vercel                                       │
│  · 夢幻粉紅 wiki 瀏覽                                         │
│  · Fuse.js 關鍵字搜尋                                         │
│  · 登入頁、AI 問答頁 UI（前端）                                │
│  · 內容來源：wiki/ 的 build 快照                               │
│                                                              │
│  Mac 關機也能用 ✅                                            │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │  HTTPS（僅 AI 功能需要）
                           │  透過 Tailscale 私有網路
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  第二層：私人 Bridge 層（Mac 在線時）                           │
│                                                              │
│  家中 Mac — Wiki Bridge（本機 HTTP 服務，port 8787）            │
│  · 登入驗證                                                   │
│  · 讀寫 raw/、wiki/                                           │
│  · 呼叫 codex exec                                            │
│  · 觸發網站 rebuild（可選）                                    │
│                                                              │
│  Codex CLI（ChatGPT Plus 登入）                               │
│  · ingest：raw → wiki                                         │
│  · chat：基於 wiki 的問答                                     │
│                                                              │
│  Mac 必須開機且 Bridge 在跑 ⚠️                                │
└──────────────────────────────────────────────────────────────┘
```

### 為什麼要分兩層？

| 問題 | 解法 |
|------|------|
| 靜態站無法跑 Codex | Bridge 在本機執行 |
| API Key 不能放前端 | Bridge 在伺服器端呼叫 Codex |
| 瀏覽器碰不到 localhost | Tailscale 建立私人通道 |
| Mac 關機時不想整站掛掉 | 靜態層與 AI 層分離 |

---

## 3. 核心元件

### 3.1 Wiki Bridge（本機 HTTP 服務）

跑在家中 Mac 上的小程式，是網站與 Codex 之間的橋樑。

| 項目 | 說明 |
|------|------|
| 執行位置 | 家中 Mac |
| 預設 port | `8787` |
| 語言 | Node.js（與現有 Astro 專案一致） |
| 資料根目錄 | WikiNB 專案根目錄（含 `raw/`、`wiki/`） |
| 開機自啟 | macOS `launchd`（Phase 5 實作） |

**Bridge 負責：**

- 驗證登入 session
- 健康檢查（`/api/health`）
- 接收網站上傳的 raw 筆記
- 觸發 Codex ingest（raw → wiki）
- 觸發 Codex 問答（wiki → 回答）
- 可選：ingest 完成後執行 `npm run build` 更新靜態站

**Bridge 不負責：**

- 對外提供公開 wiki 瀏覽（那是靜態站的事）
- 任意 shell 指令（僅限預定義的 Codex 工作流）

### 3.2 Tailscale（私人網路）

| 項目 | 說明 |
|------|------|
| 費用 | 個人版免費（最多 100 台裝置） |
| 用途 | 讓圖書館 PC 等外部裝置安全連到家中 Mac |
| 安裝 | Mac、圖書館 PC（Windows/Mac 皆可）各裝一次 |
| 連線方式 | MagicDNS，例如 `http://你的-mac名:8787` |

**為什麼用 Tailscale 而不是直接公開 port？**

- 不暴露本機服務到公網
- 攻擊面小
- 免費
- 圖書館 Windows PC 也能用

### 3.3 Codex CLI（AI 執行引擎）

| 項目 | 說明 |
|------|------|
| 安裝 | `npm install -g @openai/codex` 或官方安裝方式 |
| 登入方式 | **Sign in with ChatGPT**（Plus 訂閱） |
| 禁止 | 使用 API Key 登入（會走按量計費） |
| 非互動模式 | `codex exec` |
| 預設 sandbox | `read-only`（問答）；ingest 時用 `workspace-write` |

**確認訂閱登入：**

```bash
codex /status
# 應顯示：Signed in with ChatGPT、Plan: Plus
```

**程式化呼叫範例：**

```bash
# 問答（只讀）
codex exec --sandbox read-only --ephemeral "根據以下筆記回答：..."

# Ingest（可寫入 wiki/）
codex exec --sandbox workspace-write --ephemeral "請依照 AGENTS.md 整理 raw/inbox/xxx.md 到 wiki/"
```

---

## 4. 登入與安全

### 4.1 兩層防護

```
第一層：Tailscale
  → 只有你的裝置能連到 Mac 的 8787 port

第二層：Bridge 登入
  → 帳密驗證 → 發放 session token（24 小時有效）
```

### 4.2 登入流程

```
1. 使用者開啟網站 /ask 或 /studio（AI 功能頁）
2. 前端 GET {BRIDGE_URL}/api/health
   → 失敗：顯示「家中 Mac 未連線，AI 功能不可用」
   → 成功：顯示登入表單
3. POST {BRIDGE_URL}/api/login { username, password }
   → 成功：回傳 session token，存於 sessionStorage（不勾記住我）
4. 後續請求帶 Authorization: Bearer <token>
```

### 4.3 帳密設定

- 僅一組帳密（個人使用）
- 密碼存在 Mac 環境變數，不進 git：

```bash
# ~/.zshrc 或 Bridge 的 .env（已加入 .gitignore）
WIKINB_AUTH_USER=kaine
WIKINB_AUTH_PASS=你的強密碼至少20字
```

### 4.4 安全邊界

| 允許 | 禁止 |
|------|------|
| 讀寫 `raw/`、`wiki/` | 讀寫專案外任意路徑 |
| `codex exec` 預定義工作流 | 任意 shell 指令 |
| ingest 時 `workspace-write` 限專案目錄 | `dangerously-bypass-approvals` |
| 問答時 `read-only` | Codex 修改系統檔案 |

### 4.5 公用電腦注意事項

- 不勾「記住我」
- session 存 `sessionStorage`（關分頁即失效）
- 使用完畢按登出

---

## 5. API 設計（Bridge）

### 5.1 端點總覽

| 方法 | 路徑 | 需登入 | 說明 |
|------|------|--------|------|
| GET | `/api/health` | 否 | Mac / Bridge 是否在線 |
| POST | `/api/login` | 否 | 登入，回傳 session token |
| POST | `/api/logout` | 是 | 登出，作廢 token |
| POST | `/api/chat` | 是 | 基於 wiki 的問答 |
| POST | `/api/ingest` | 是 | 觸發 raw → wiki 整理 |
| POST | `/api/raw/upload` | 是 | 上傳原始筆記到 raw/inbox/ |
| GET | `/api/raw/inbox` | 是 | 列出待整理筆記 |
| GET | `/api/wiki/pages` | 是 | 列出 wiki 頁面（即時，非 build 快照） |
| POST | `/api/rebuild` | 是 | 執行 npm run build（可選） |

### 5.2 GET `/api/health`

**回應：**

```json
{
  "online": true,
  "codex": "ready",
  "wikiPages": 3,
  "inboxCount": 1
}
```

**前端行為：**

- `online: false` 或請求失敗 → 顯示離線提示，隱藏 AI 功能
- `online: true` → 顯示登入或功能介面

### 5.3 POST `/api/chat`（RAG 式問答）

**請求：**

```json
{
  "question": "我筆記裡 Git branch 是什麼？"
}
```

**Bridge 內部流程：**

```
1. Fuse.js 搜尋 wiki/，取 top 3–5 相關頁面
2. 組 prompt：
   「你是 WikiNB 助手。根據以下筆記回答問題。
    若筆記中沒有答案，請明確說不知道。
    回答請附來源 slug。

    --- 筆記 ---
    [相關頁面內容]
    ---

    問題：{question}」
3. 執行：
   codex exec --sandbox read-only --ephemeral "<prompt>"
4. 回傳回答與來源
```

**回應：**

```json
{
  "answer": "根據你的筆記，branch 是...",
  "sources": [
    { "slug": "git-basics", "title": "Git 基礎" }
  ]
}
```

### 5.4 POST `/api/ingest`（raw → wiki）

**請求：**

```json
{
  "filename": "example-raw-note.md"
}
```

或省略 filename 表示整理 inbox 全部新檔。

**Bridge 內部流程：**

```
1. 確認 raw/inbox/{filename} 存在
2. 讀取 AGENTS.md 作為規則
3. 執行：
   codex exec --sandbox workspace-write --ephemeral \
     "請依照 AGENTS.md，將 raw/inbox/{filename} ingest 到 wiki/。
      更新 wiki/index.md，完成後將 raw 檔移到 raw/archive/。"
4. 回傳新建的 wiki 頁面列表
5. 可選：觸發 npm run build
```

**回應：**

```json
{
  "status": "ok",
  "created": ["git-basics"],
  "updated": ["index"],
  "archived": ["example-raw-note.md"]
}
```

### 5.5 POST `/api/raw/upload`（網站端上傳筆記）

**請求：** `multipart/form-data`，欄位 `file` 或 `content` + `filename`

**Bridge 內部：**

```
寫入 raw/inbox/{filename}
回傳 { "filename": "...", "path": "raw/inbox/..." }
```

使用者可在網站 UI 貼上文字或上傳檔案，不必手動放資料夾。

---

## 6. 網站端功能頁（規劃）

登入後可用的頁面（前端，連 Bridge API）：

| 頁面 | 路徑 | 功能 |
|------|------|------|
| AI 問答 | `/ask` | 輸入問題，基於 wiki 回答 |
| 筆記工作室 | `/studio` | 上傳 raw、觸發 ingest、看 inbox 狀態 |
| 登入 | `/login` | 帳密登入（或嵌入上述頁面） |

**離線時：**

- `/`、`/wiki`、`/search` 正常（靜態層）
- `/ask`、`/studio` 顯示「需要家中 Mac 連線」

---

## 7. 遠端使用情境

### 情境 A：圖書館查筆記（Mac 可關）

```
1. 開 https://你的帳號.github.io/wikinb
2. 搜尋關鍵字
3. 閱讀 wiki 頁面
→ 不需要 Mac 開機
```

### 情境 B：圖書館上傳筆記並整理（Mac 要開）

```
1. 圖書館 PC 開啟 Tailscale，確認連上 tailnet
2. 開網站 /studio
3. 健康檢查通過 → 登入
4. 貼上或上傳筆記 → POST /api/raw/upload
5. 點「整理」→ POST /api/ingest
6. Bridge 呼叫 Codex，生成 wiki 頁
7. 可選：觸發 rebuild，雲端靜態站更新
```

### 情境 C：圖書館問 AI（Mac 要開）

```
1. Tailscale 連線
2. 開網站 /ask → 登入
3. 輸入問題 → POST /api/chat
4. Bridge 搜尋 wiki + Codex 回答
5. 顯示回答與來源連結
```

### Mac 離線時

```
/ask、/studio → 「AI 功能需要家中 Mac 連線，目前不可用。
                 您仍可使用搜尋與瀏覽功能。」
```

---

## 8. Codex 與計費

### 8.1 使用 ChatGPT Plus 訂閱（非 API）

| 登入方式 | 計費 | 本專案 |
|----------|------|--------|
| Sign in with ChatGPT | Plus 訂閱內含額度 | ✅ 使用這個 |
| API Key | 按 token 計費 | ❌ 不使用 |

### 8.2 額度限制

- Plus 有 5 小時滾動視窗限制
- ingest 比單次問答更耗額度（Codex 會讀寫多個檔案）
- 建議：ingest 批次處理，不要頻繁小改

### 8.3 Sandbox 選擇

| 操作 | Sandbox | 原因 |
|------|---------|------|
| 問答 `/api/chat` | `read-only` | 只讀 wiki，不修改檔案 |
| 整理 `/api/ingest` | `workspace-write` | 需要寫入 wiki/、移動 raw/ |
| 上傳 `/api/raw/upload` | 不經 Codex | Bridge 直接寫檔 |

---

## 9. 資料流總覽

```
                    ┌─────────────┐
  你上傳筆記 ──────►│ raw/inbox/  │
  （網站或手動）      └──────┬──────┘
                             │
                    POST /api/ingest
                             │
                             ▼
                    ┌─────────────┐
                    │ Codex CLI   │  ← ChatGPT Plus 額度
                    │ + AGENTS.md │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   wiki/     │──────► 靜態站 build ──► 雲端瀏覽
                    └──────┬──────┘
                           │
                    POST /api/chat
                           │
                           ▼
                    ┌─────────────┐
                    │ Fuse 搜尋   │
                    │ + Codex 回答│
                    └─────────────┘
```

---

## 10. 環境與設定清單

### 10.1 家中 Mac

- [ ] WikiNB 專案（含 raw/、wiki/、AGENTS.md）
- [ ] Codex CLI 已安裝
- [ ] `codex /status` 顯示 ChatGPT Plus 登入
- [ ] Tailscale 已安裝並登入
- [ ] Wiki Bridge 服務（Phase 2 實作）
- [ ] 環境變數：`WIKINB_AUTH_USER`、`WIKINB_AUTH_PASS`
- [ ] 可選：launchd 開機自啟 Bridge

### 10.2 圖書館 / 外部 PC

- [ ] Tailscale 已安裝並登入同一 tailnet
- [ ] 瀏覽器可開 WikiNB 雲端網站

### 10.3 網站前端

- [ ] 設定 Bridge URL（Tailscale 主機名，例如 `http://macbook-pro:8787`）
- [ ] `/ask`、`/studio` 頁面（Phase 2–4 實作）
- [ ] 健康檢查與離線 UI

### 10.4 Bridge URL 設定方式

前端需知道 Bridge 位址。建議：

```javascript
// src/config/bridge.ts（build 時或執行時設定）
export const BRIDGE_URL =
  import.meta.env.PUBLIC_BRIDGE_URL || 'http://macbook-pro:8787';
```

部署時在環境變數設定 `PUBLIC_BRIDGE_URL`。  
僅在 Tailscale 連線後該 URL 才可達。

---

## 11. 實作階段

| 階段 | 內容 | 依賴 |
|------|------|------|
| **Phase 1** | 靜態 wiki 網站 + 搜尋 | — |
| **Phase 2** | Bridge 骨架 + `/api/health`、`/api/login`、`/api/chat` | Codex、本機測試 |
| **Phase 3** | `/api/ingest`、`/api/raw/upload` + `/studio` 頁 | Phase 2 |
| **Phase 4** | Tailscale 設定 + 遠端連線測試 | Phase 2 |
| **Phase 5** | 登入 session、限流、launchd 自啟 | Phase 2 |
| **Phase 6** | GitHub Pages 部署 + 可選 rebuild webhook | Phase 1 |

**本文件** 對應 Phase 2–5 的設計依據。

---

## 12. 風險與緩解

| 風險 | 緩解 |
|------|------|
| Bridge 被暴力破解 | Tailscale 第一層 + 強密碼 + 登入限流 |
| Codex 權限過大 | 嚴格 sandbox，ingest 與 chat 分開 |
| Plus 額度耗盡 | 監控 `/status`，避免短時間大量 ingest |
| Mac 關機無法用 AI | 靜態層獨立，離線提示明確 |
| 公用電腦 session 殘留 | sessionStorage、不記住我、登出按鈕 |
| iCloud 與 Bridge 路徑不一致 | wiki/ 固定單一路徑，iCloud 僅作同步備份 |

---

## 13. 與其他文件的關係

| 文件 | 內容 |
|------|------|
| `README.md` | 專案入門、本地預覽 |
| `AGENTS.md` | Cursor / Codex ingest 時的 wiki 整理規則 |
| `docs/ecosystem.md` | Kiannne 與 Me 分工、note/learning 模型、AI 四模式 |
| **本文件** | 本機 Bridge、Codex、Tailscale、登入、API 設計 |
| `config/sites.json` | 兩站 URL；Me 本機路徑 `../resume-website` |
| `src/` | 靜態網站；`/login` 占位；未來 `/ask`、`/studio` |

---

## 14. 待決事項

實作前需確認：

1. **wiki/ 路徑**：維持 `Desktop/Projects/WikiNB/wiki/`，或移至 iCloud 同步資料夾？
2. **Bridge URL 主機名**：Tailscale MagicDNS 名稱（例如 `macbook-pro`）
3. **ingest 後是否自動 rebuild 並部署**：手動 vs 自動 push GitHub

---

*最後更新：2026-07-17*
