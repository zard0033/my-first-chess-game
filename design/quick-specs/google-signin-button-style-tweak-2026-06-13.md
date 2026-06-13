# Quick Design Spec: Google 登入按鈕對齊 Gambit 視覺語言

**Type**: Tweak
**System**: SignInView — Auth UI
**GDD Reference**: `design/gambit-design-system/README.md` — Glass / Hover / Motion 章節
**Date**: 2026-06-13

## Change Summary

將 SignInView 的 Google 登入按鈕從白底實色風格，改為符合 Gambit 深色沉浸背景（deep-jade `#103029`）的玻璃質感樣式。Google 品牌限制：四色 G logo 不動、文字保留「以 Google 帳號登入」。

## Motivation

目前白底按鈕（`bg-white text-gray-800`）在深色沉浸背景上形成強烈的明亮色塊，打破「精緻木質殿堂 × 微擬物深度」的沉浸感。設計系統在深色區域明確規範使用玻璃語言（`rgba(255,255,255,.07)` + `backdrop-blur` + hairline border），訪客按鈕已採用此語言；Google 按鈕應與整體風格一致，同時保有比訪客按鈕更高的視覺層級（主 CTA）。

## Design Delta

Current 實作（`SignInView.vue`）：

```html
class="... bg-white text-[#1F1F1F] hover:opacity-90 transition-opacity ..."
```

白底、深色字，明亮色塊脫離深色沉浸。

改為：

```html
class="... bg-white/[0.10] border border-white/[0.20] backdrop-blur-sm
       shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]
       text-ink-on-deep hover:bg-white/[0.16]
       motion-safe:active:scale-[0.98]
       transition-[background-color,transform,opacity] duration-150 ..."
```

## New Rules

| 屬性 | 舊值 | 新值 | 理由 |
|------|------|------|------|
| 背景 | `bg-white` | `bg-white/[0.10]` + `backdrop-blur-sm` | 玻璃語言，融入深色背景 |
| 邊框 | 無 | `border border-white/[0.20]` | 設計系統 Glass 規範 hairline |
| 頂光 | 無 | `shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]` | Glass 頂部單線光澤 |
| 字色 | `text-[#1F1F1F]` | `text-ink-on-deep` (`#e7f1ec`) | 深色區域文字 token |
| Hover | `hover:opacity-90` | `hover:bg-white/[0.16]` | 語意更明確，只動背景 |
| Press | 無 | `motion-safe:active:scale-[0.98]` | 微縮回饋，尊重 prefers-reduced-motion |
| Transition | `transition-opacity` | `transition-[background-color,transform,opacity] duration-150` | 150ms，僅動 transform/opacity/bg |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-gold` | 維持不動 | 符合設計系統金色 focus 規範 |
| 尺寸 | `min-h-[48px]` | 維持不動 | ≥ 44px 觸控目標 OK |
| G logo | 四色 SVG | 維持不動 | Google 品牌規範 |

## Affected Systems

| System | Impact | Action Required |
|--------|--------|-----------------|
| `src/views/SignInView.vue` | button class 字串 | 改 class |
| 訪客按鈕 | 不動（視覺層級差異刻意保留） | 無 |

## Acceptance Criteria

- [ ] 按鈕在 deep-jade 背景上呈現玻璃質感，不是白色色塊
- [ ] Google G logo 四色 SVG 不變
- [ ] Hover 時背景變淺（`white/0.16`），無跳變
- [ ] Press 時有 `scale(0.98)` 微縮，150ms，`prefers-reduced-motion: reduce` 下不觸發
- [ ] Focus-visible 維持 2px 品牌金 ring
- [ ] 觸控目標 ≥ 44×44px
- [ ] 訪客按鈕外觀不受影響

## GDD Update Required?

不需要。本次實作在 `design/gambit-design-system/README.md` 的 Glass 規範範圍內，無需更新 GDD。
