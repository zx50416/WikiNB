---
title: 影像標注基礎
description: 分類、物件偵測與 bounding box 的影像標注意見整理
type: note
status: active
tags:
  - 影像標注
  - 電腦視覺
  - AI
date: 2026-07-18
relatedSkills:
  - Machine Learning & Data Analysis
---

# 影像標注基礎

影像標注是幫圖片裡的內容貼標籤，讓模型知道圖片在學什麼。

## 常見任務

| 類型 | 說明 | 例子 |
|------|------|------|
| 分類（classification） | 整張圖一個標籤 | 「有貓」 |
| 物件偵測（detection） | 框出物件位置與類別 | 框出寶特瓶並標 `plastic bottle` |

## Bounding box

偵測用的框通常是：**左上角 x,y + 寬高**。

## 標注意見

- **一致性很重要**：同一類物件不要有時叫「寶特瓶」、有時叫「瓶子」，否則模型容易學亂。
- **難例規則要先訂**：很小、被遮住、看不清楚的東西要不要標，應全資料集統一規則。

## 相關筆記

- [[llm-basics|LLM 基礎概念]]
- [[example-concept|範例概念：LLM Wiki]]
