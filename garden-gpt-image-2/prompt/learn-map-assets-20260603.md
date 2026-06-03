# 學習地圖美術 prompt（Mode C 產出 — 待用自己的圖像工具生成）

> 生成後存成 PNG，放到 `public/learn/`，檔名須為 `coach.png` / `trophy.png` / `bg.png`。
> learn-path.vue 已內建 drop-in：放進去就自動顯示（coach/trophy 有 fallback，缺檔不報錯）。
> 配色錨點：棕 `#8b6f5c`、奶油 `#faf6f0`、金 `#d6a23a`、深字 `#3d2210`。

---

## 1. coach.png（教練立繪，半身，透明背景）— **建議優先生成**

```
A warm, friendly female chess coach, stylized flat vector illustration, half-body
portrait facing slightly to the right. Calm confident expression, short tidy hair,
simple elegant sweater. Cohesive warm palette: umber browns (#8b6f5c), cream
(#faf6f0), soft gold accents (#d6a23a), dark warm ink outline (#3d2210). Clean flat
shading with subtle soft gradient, gentle rim light. NOT photorealistic, NOT a
specific real person or actor — an original generic mascot character. Centered
subject, fully transparent background (PNG alpha), no scene, no text, no frame.
Square composition, crisp edges suitable for a 92px UI standee.
```
- size 1024x1024、quality high、**transparent background**

## 2. trophy.png（金色獎杯，透明背景）— capstone 里程碑節點

```
A golden chess trophy: a queen chess piece silhouette rising from a small pedestal,
flanked by a laurel wreath. Polished warm gold (#d6a23a) with soft highlights and
gentle ambient occlusion, slightly stylized flat-3D game-reward look. Cohesive with
a warm brown/cream chess app. No text, no background — fully transparent PNG alpha.
Centered, square composition, crisp edges suitable for a 60px node icon.
```
- size 1024x1024、quality high、**transparent background**
- 備註：未生成時節點 fallback 用 lucide `Crown`（金色），可接受。

## 3. bg.png（可選 — 目前已用純 CSS 暖色漸層取代）

```
A seamless tileable subtle parchment texture in warm cream (#faf6f0 → #f4ecdd),
extremely low contrast, faint embossed chessboard motif barely visible, soft paper
grain. Must tile seamlessly. No focal point, no text — a quiet background that never
competes with foreground UI. Square, ~512x512, tileable.
```
- size 1024x1024、可平鋪
- 備註：**非必要**。learn-path.vue 已改用 CSS 漸層做底，不依賴此圖。若想要更有紙質感再生成、改回 CSS `url('/learn/bg.png')` 疊在漸層上即可。

---

## 如何使用

無 `OPENAI_API_KEY` / Garden 未啟用，本機無法直接出圖。可任選：
1. 設 `ENABLE_GARDEN_IMAGEGEN=1` + `OPENAI_API_KEY` 後，用本 skill 的 `scripts/generate.js` 跑。
2. 丟進 ChatGPT / DALL·E / Midjourney / Nano Banana 等任一圖像工具。
3. 提供 API key 給我，我用 Mode A 直接生成落盤。
