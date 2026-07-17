---
title: 本機 Bridge 與 Codex 整合
description: 登入後連本機 Mac：Codex 問答、拖檔存 raw、同步 wiki
type: learning
status: active
priority: medium
progress: 80
targetSkill: AI programming
relatedSkills:
  - AI programming
  - Web Development
tags:
  - Bridge
  - Codex
  - Tailscale
date: 2026-07-17
updated: 2026-07-18
---

# 本機 Bridge 與 Codex 整合

讓網站登入後能連到本機 Mac，用 Codex CLI（ChatGPT Plus）協助學習：回想筆記、看 raw、延伸討論；並可同步 `wiki/`、拖檔存 `raw/inbox/`。

## 已完成

- [x] Wiki Bridge 本機服務（`npm run bridge`）
- [x] `/login` 帳密 + 雙信箱驗證碼
- [x] `/codex` 終端問答（自由學習助理，可讀 wiki／raw）
- [x] 導覽列「同步 Wiki」
- [x] 拖檔上傳 → 只存 `raw/inbox/`
- [x] GitHub Pages 部署

## 選用／進行中

- [ ] Tailscale 遠端連線（外出要用時再設）
- [ ] 依需要做 Gap 分析（對照 Me skills）

## 刻意不做

- `/ask`、`/studio`（已由 Codex + Cursor ingest 取代）
- 網站拖檔自動 ingest（改由 Cursor 整理，較可控）

詳見 `docs/local-codex-bridge.md`、`AGENTS.md`。
