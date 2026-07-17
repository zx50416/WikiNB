---
title: LLM 基礎概念
description: 大型語言模型、token、prompt、幻覺、RAG 與 fine-tuning 的入門整理
type: note
status: active
tags:
  - LLM
  - AI
  - RAG
  - prompt
date: 2026-07-17
relatedSkills:
  - AI programming
  - Machine Learning & Data Analysis
---

# LLM 基礎概念

整理自 raw 筆記：什麼是 LLM、它怎麼運作，以及常見誤區。

## LLM 是什麼？

**LLM（Large Language Model，大型語言模型）** 如 ChatGPT、Claude、Gemini。

本質上是根據前文**預測下一個 token**，並不是真的「理解世界」；因為訓練資料量大，輸出常看起來很像人。

## Token 與 Context Window

- **Token**：模型讀寫文字的單位。英文一個字可能拆成多個 token；中文也常不是「一字一 token」。
- 對話越長，用掉的 token 越多。
- **Context window**：一次能看的上下文上限；超過後較早的內容可能被「忘記」。

## Prompt 為什麼重要

Prompt 就是你給 AI 的指示。只說「幫我寫一篇報告」通常很差；較好的做法是寫清楚：

- 主題
- 對象
- 字數
- 格式
- 語氣

例如：「寫給國中生看的 500 字環保報告，不要太難，要 3 個重點。」

即使 prompt 寫得好，也不保證答案一定對。

## 幻覺（Hallucination）

AI 可能**一本正經地亂掰**：編造論文、資料、網址。重要資訊要自己查證。

若模型沒有上網能力，也不一定知道最新事件（訓練資料有截止日期）。

## RAG vs Fine-tuning

| | RAG | Fine-tuning |
|---|---|---|
| 全名 | Retrieval Augmented Generation | 微調 / 再訓練 |
| 做法 | 先檢索相關文件，再依內容生成 | 用領域資料再訓練模型 |
| 比喻 | 考試可以翻參考書 | 把知識練進腦袋 |
| 成本 | 相對較低，適合內部文件 / PDF | 通常較貴，需要整理好的資料 |

RAG 比「直接問模型」更容易有來源依據；但若檢索錯、或原始資料錯，答案仍會錯。

## LLM 能做什麼、不能做什麼

**常見用途**：翻譯、摘要、寫信、寫程式、發想、解釋概念。

**不能完全取代人**：尤其醫療、法律、投資等高風險領域——模型不會為結果負責。

## LLM ≠ 搜尋引擎

- Google：找網頁
- LLM：直接生成答案

現在很多 LLM 也接了 search，兩者界線變模糊，但本質仍不同。

## Temperature

- **高**：較有創意，也較容易亂
- **低**：較穩定；寫程式、查事實時通常較適合偏低

## 相關筆記

- [[example-concept|範例概念：LLM Wiki]]
- [[how-to-add-notes|如何新增筆記]]
