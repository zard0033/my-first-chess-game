# UI 一致性稽核 — Gambit SoT Drift 報告

> 日期：2026-06-07 · 方法：Playwright 巡屏（390×844 mobile-first）+ 對著 `design/gambit-design-system/`
> SoT 的程式碼掃描。**這是 drift 報告，不是修改**——由 Eason 決定修哪些（勿動沒壞的）。
> 巡到的屏：Home / Learn / ConceptMap / DungeonMap / DungeonPuzzle（+ 程式碼掃全屏）。
> History / Profile / Review 需登入或完賽資料，改以程式碼層判讀（已標註）。

---

## TL;DR

**整體相當一致**，不是「各屏亂飛」。內容屏（Home / Learn / ConceptMap / Lesson / Puzzle 面板）共用同一套
語言：deep-jade 錨、金色國王字標、金只當 reward/CTA、warm cream 卡、底部 4-tab、tabular 數字、棋子用詞
全對（城堡/騎士/主教，**零象棋用語**、**零 emoji**）。

真正的 drift 集中在兩件事：
1. **試煉道場是刻意的「近黑世界」**（`#070909`），與其餘屏的 warm cream + deep-jade 分屬兩個色系——
   全站唯一的跨屏風格分歧。**需要一個有意識的決定**（見 H-1）。
2. **多處 on-dark 顏色用 raw hex 而非 token**（History 勝負、試煉金色）——是「token 缺口」不是亂塗，
   視覺傷害低，但維護/一致性上是 drift。

沒有發現「醜」到需要重設計的屏。建議**只修 H-1 決策 + 幾個 a11y/token 缺口**，其餘不動。

---

## 高優先（需 Eason 拍板）

### H-1 · 試煉道場近黑世界 vs SoT deep-jade 錨
- **現象**：`DungeonMapView.vue:47` / `DungeonPuzzleView.vue:159` 皆 `bg-[#070909]`（近黑），header
  `#0A0C0A`。SoT 規定沉浸區用 **deep-jade `#103029`**（暖、與全站錨一致），且「純黑在暖色調上看起來髒」。
- **判讀**：這是**內部自洽的子系統**（兩屏一致、配套自己的亮金 `#F5D070`/`#c8a050`），明顯是刻意的「地城」
  氛圍，不是失手。但它是全站唯一跳出 cream+jade 家族的色系。
- **決策（二選一，不是 bug）**：
  - (A) **暖化**：把 `#070909` 換成 deep-jade `#103029`（或 `surface-deep`），與全站錨統一——更一致、更暖。
  - (B) **保留地城暗調**：當作 design intent，但把 `#070909` 收進一個具名 token（如 `surface-dungeon`），
    並確認與 a11y（H-2）相容。
- 建議：傾向 (A) 或 (B) 都可，重點是**從 raw `#070909` 升級成具名決定**，別讓它是匿名魔術數字。

### H-2 · 試煉地圖鎖定節點標籤對比過低（a11y）
- **現象**：DungeonMap 鎖定節點 `Level 3` 等灰字（`text-white/25`，DungeonMapView:131）落在近黑上，
  估 <3:1，低於 WCAG AA 4.5:1。SoT 權威序：**accessibility-requirements > 視覺**。
- 建議：鎖定標籤提到至少 `text-white/45`～`/55`，或加非顏色線索（已有 lock icon，可只調對比）。

---

## 中優先

### M-1 · History 勝/負用 off-palette raw hex（token 缺口）
- **現象**：`HistoryView.vue:32,34` 勝＝`text-[#7FD4A8]`（薄荷）、負＝`text-[#E08E79]`（鮭），和＝`ink-on-deep-dim`。
- **判讀**：這是 deep-jade 統計列上的**亮色變體**——SoT 的 success `#4A7C59` / danger `#B8533A` 在深底上太暗，
  所以開發者自己調亮了。屬合理需求，但**繞過 token**，且和語意色不同步。
- 建議：在 tailwind config 增 `success`/`danger` 的 **on-deep 變體**（如 `success.on-deep`），用 token 取代 raw hex。

### M-2 · viewport 單位內部不一致（iOS Safari）
- **現象**：試煉屏正確用 `min-h-dvh`，但 `App.vue:39` 與 `ReviewView.vue:288` 用 `min-h-screen`、
  `NotFoundView.vue:8` 用 `min-h-[calc(100vh-49px)]`。SoT 明令用 `dvh` 不用 `100vh`/`h-screen`（iOS 網址列縮放）。
- 建議：App/Review/NotFound 一律改 `min-h-dvh`（小改、消除內部矛盾）。

---

## 低優先（可不動）

- **L-1 · 試煉金色用 raw hex**：`#F5D070`（提示字）、`#c8a050`（done 標籤）、`#a06400`（漸層）等是近黑底上的
  亮金適配。同 M-1，建議收進 token（如 `gold.on-dark`），但視覺無傷。
- **L-2 · arbitrary spacing 偏離 4/8 grid**：`[18px]`×14、`[14px]`×4、`[15px]`、`[22px]` 等 padding/margin。
  輕微節奏 drift；除非重排版否則不值得動。
- **L-3 · `transition-all`**：`dialog-content.vue:45` 一處（SoT 只允許 transform/opacity）。此處 hover 只改
  bg/opacity，實際無 box-shadow 動畫風險，極低。
- **L-4 · 英文大寫標籤**：Home「NEW GAME」、各處 eyebrow。繁中語氣下略突兀，但 Latin inline SoT 允許；純美感。
  （註：這些金色 eyebrow 都落在 **jade 卡**上＝gold-on-jade，對比 OK，非 H-2 那類問題。）

---

## 通過項（無需動）

- ✅ **零 emoji**、**零象棋用語**（車/馬/象）——AC-10/11a 全站通過。
- ✅ 棋子用詞：城堡 / 騎士 / 主教 / 后 / 國王 / 兵，課程・概念地圖・試煉一致。
- ✅ 底部 4-tab 主導覽（首頁/學習/對局/我的）、頂部只放品牌+登入。
- ✅ 金色僅用於 reward/CTA/indicator（hero CTA、繼續 badge、當前節點、提示鈕、進度條），未當內文。
- ✅ ConceptMap（Phase B）平靜、無 streak/timer/leaderboard/XP，dormant 概念用「之後會帶你認識」收。
- ✅ 棋盤=暖木質（upstream-owned，未被重新上色）。
- ✅ 新 Bridge-3 賽後標記（Phase C）：中立 cream/jade、無金、觸控 ≥44px（component test 已驗 gating）。

---

## 建議的最小修法（若 Eason 同意）

1. **H-1**：決定 (A) 暖化成 deep-jade 或 (B) 把 `#070909` 收成具名 `surface-dungeon` token。
2. **H-2**：鎖定節點標籤對比提到 AA。
3. **M-2**：App/Review/NotFound 改 `min-h-dvh`（一行屏，無風險）。
4. （選配）**M-1 / L-1**：補 on-deep / on-dark 的 success/danger/gold token，把 raw hex 收編。

其餘（L-2/L-3/L-4）建議**不動**——沒壞、改動成本 > 收益。
