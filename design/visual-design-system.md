# Visual Design System — Chess Training Companion

> 統一視覺設計系統。本檔規範**顏色 / 字型 / 元件視覺方向**，是前端視覺實作的單一事實來源（Source of Truth）。
> 與 `design/CLAUDE.md`（GDD/UX 文件標準）互補：那份管「文件怎麼寫」，這份管「畫面長怎樣」。
>
> **適用平台**：PC Chrome/Edge + iPhone Safari（PWA）。
> **技術**：Vue 3 + Tailwind v3（`tailwind.config.ts`）+ shadcn-vue HSL 變數（`src/assets/main.css`）。
> **配色方向**：深青瓷 Jade + 金，accent 採既有品牌金 山吹色 `#F8B500`。

---

## 範圍與權威（先讀）

**本 doc 管轄**：app chrome — 導覽列、卡片/面板、按鈕、學習地圖、字型、整體色階與 elevation。

**本 doc 不管轄（服從上游）**：
- **棋盤 / 棋子 / 標註 / 評估條** 的視覺：由 `design/gdd/game-concept.md`（日本傳統色語言）+ ADR-0006 + `docs/architecture/control-manifest.md` 鎖定。本 doc 只**對齊** accent 金到既有 keySquare 金（§3.3）。
- **無障礙與動效規則**：`design/ux/accessibility-requirements.md` **takes precedence**（對比門檻、reduced-motion「全停」、`transform`/`opacity` only、box-shadow 動畫禁止、forced-colors fallback）。本 doc 任何視覺手法若與其衝突，以該文件為準。
- **互動行為**：`design/ux/interaction-patterns.md`（觸控/焦點/aria/鍵盤）。

衝突時優先序：**accessibility-requirements > game-concept GDD / ADR / control-manifest > 本 doc**。

---

## 0. 為什麼要這份文件（問題診斷）

現況 UI「割裂、扁平、不精緻」的根因**不是缺少 token 系統**——專案已有完整的 surface / ink / line / primary / 語意色 token。真正問題是：

1. **明度落差不足**：背景 `#faf6f0`、卡片 `#fcf9f3`、磚塊 `#cda173`、primary `#8b6f5c` 全擠在「亮暖棕」一段，沒有深色錨點 → 整體灰撲撲、沒層次。
2. **沒有飽和強調色**：最接近 accent 的 `hint` 土黃 `#c9872e` 飽和度仍低，沒有任何顏色「跳出來」。
3. **學習地圖磚塊**與背景同色系同明度 → 糊在一起；又用 `rotate(45deg)` 假菱形造成斜邊 anti-alias 糊邊。
4. **導覽列**用 `wood12_bg.jpg` 木紋照片當底，active 只疊 `bg-white/10` → 被忙碌木紋吃掉，幾乎看不見。

**本設計系統的兩個核心動作**：① 引入**深色錨點**（氈綠 nav/地圖世界底）+ **飽和金 accent**；② 讓互動與獎勵元素靠**色相＋明度雙重對比**從奶油底 POP 出來。棋盤與棋子**維持現有配置不動**（見 §6）。

---

## 1. 設計原則（Design Principles）

1. **明度錨點優先**：每個畫面都要有一個深色錨（nav / 地圖世界底 / 棋盤），讓亮色內容有依靠、產生層次。不要整頁都是中明度暖棕。
2. **飽和色只給互動與獎勵**：primary 綠、accent 金只用在可點擊、進度、達成、當前焦點。大面積底維持低飽和奶油，避免廉價感。
3. **殿堂感而非童趣**：襯線標題（Noto Serif TC）+ 克制金色點綴 + 真實木質棋盤，營造「棋藝殿堂」。禁用 emoji 當 icon、禁用高飽和糖果色、禁用彈跳卡通動效。
4. **克制動效**：微互動 150–300ms、轉場 ≤400ms，transform/opacity 為主，尊重 `prefers-reduced-motion`。動效表達因果，不裝飾。
5. **沿用既有結構**：盡量改 token「值」而非「命名」，沿用現有 `surface.* / ink.* / primary.* / nav.*` 命名與 shadow/radius，降低落地成本。

---

## 2. UI Style 定位

**精緻木質殿堂 × 微擬物深度（Refined Wood Hall × Subtle Skeuomorphic Depth）**。

| 採用 | 避免 |
| --- | --- |
| 深色錨點分層（nav/地圖世界用深氈綠） | 大面積照片材質當底（wood photo 噪點高、吃對比） |
| 磚塊三層明度（top→face→socket）做立體 | `rotate(45deg)` 假菱形（斜邊糊）→ 改 `clip-path` / SVG |
| 金色 accent 點綴焦點與獎勵 | 金色當大面積底或內文字（對比不足，見 §3） |
| 暖棕柔陰影（既有 `shadow.card`） | 純黑 drop-shadow（與暖色調衝突、顯髒） |
| 襯線標題建立莊嚴層級 | emoji 當功能 icon；卡通彈跳動效 |

---

## 3. Color Palette（核心）

### 3.1 完整 Token 表（A 翡翠氈綠 + 金）

狀態欄：**KEEP**＝沿用現值；**CHANGE**＝改值；**NEW**＝新增 token。Hex 對應 `tailwind.config.ts` 的 `theme.extend.colors`。

#### 背景與表面 Surface

| Token | Hex | 狀態 | 用途 |
| --- | --- | --- | --- |
| `surface.base` | `#FAF6F0` | KEEP | 頁面背景（奶油） |
| `surface.card` | `#FCF9F3` | KEEP | 卡片/面板 |
| `surface.raised` | `#F4EAD8` | KEEP | 抬升表面（白子色） |
| `surface.hover` | `#EFE4D2` | KEEP | hover 態 |
| `surface.deep` | `#103029` | **NEW** | 深色錨：nav 底、地圖世界沉浸區底 |
| `surface.deep-2` | `#18443A` | **NEW** | 深色區內的抬升層（深區卡片） |

#### 文字 Ink（暖棕，與綠調和；維持高對比）

| Token | Hex | 狀態 | 對比（on `surface.base`） |
| --- | --- | --- | --- |
| `ink.DEFAULT` | `#3D2210` | KEEP | ≈ 10:1 ✓ AAA |
| `ink.muted` | `#7A5C44` | KEEP | ≈ 5.6:1 ✓ AA |
| `ink.faint` | `#A88C76` | KEEP | 裝飾/placeholder（不作正文） |
| `ink.on-deep` | `#E7F1EC` | **NEW** | 深色錨上的文字（on `surface.deep` ≈ 12:1 ✓ AAA） |
| `ink.on-deep-dim` | `#9BBDB1` | **NEW** | 深色錨上的次級文字 |

#### Primary（深青瓷 Jade — 取代原暖棕 `#8b6f5c`）

| Token | Hex | 狀態 | 備註 |
| --- | --- | --- | --- |
| `primary.DEFAULT` | `#1C7059` | **CHANGE** | 主按鈕/連結/焦點。白字對比 ≈ 4.5:1 ✓ AA |
| `primary.dark` | `#155747` | **CHANGE** | hover/pressed；小字白底用此（白字 ≈ 5.2:1） |
| `primary.soft` | `#CFE9E0` | **NEW** | primary 的柔光環/低強度底（focus ring halo、selected 底） |
| `primary.fg` | `#FFFFFF` | **CHANGE** | primary 上的前景（原 `#fcf9f3`，改純白拉高對比） |

> shadcn HSL 同步（`src/assets/main.css`）：`--primary: 164 60% 28%;`（#1C7059）、`--primary-foreground: 0 0% 100%;`、`--ring: 164 60% 28%;`。

#### Accent（山吹金 — 對齊既有品牌色，非新造）

> **採用上游品牌金**：accent **= 山吹色 yamabuki-iro `#f8b500`**，即 repo 既有的 keySquare highlight / eval peak marker 金（定義於 `design/gdd/game-concept.md` §視覺色彩、`docs/architecture/control-manifest.md`、ADR-0006）。全站只有**一個金**，app chrome 的 accent 與棋盤的「關鍵時刻」訊號同色，一致。
>
> **實作命名**：Tailwind 既有 `accent` 已被 shadcn 佔用（= `--accent` surface.raised），故本金色在 `tailwind.config.ts` 以 **`gold.*`** 命名（`gold.DEFAULT/light/dark/ink`），下表 `accent.*` 為概念名。

| Token | Hex | 狀態 | 備註 |
| --- | --- | --- | --- |
| `accent.DEFAULT` | `#F8B500` | **ALIGN（既有品牌金）** | 焦點環、進度、CTA 漸層、地圖 trail、nav 指示條。**填色/指示用，非內文** |
| `accent.light` | `#FFC94D` | **NEW** | CTA 漸層上緣 |
| `accent.dark` | `#8F6200` | **NEW** | 金色「文字」唯一允許值（on cream ≈ 4.95:1 ✓ AA，可作 label/小字） |
| `accent.ink` | `#3A2408` | **NEW** | 金底上的深色文字（on `accent.DEFAULT` ≈ 8.1:1 ✓ AAA） |

> ⚠️ **金色鐵則**：`accent.DEFAULT #F8B500` 在奶油底上對比僅 ≈ 1.6:1，**禁止**用作內文或小字。需要金色文字時用 `accent.dark #8F6200`；金底上的文字用 `accent.ink`。

#### 語意色 Semantic（沿用，與綠/金共存）

| Token | Hex | 狀態 | 用途 |
| --- | --- | --- | --- |
| `success.*` | `#4A7C59` / `.dark #3A6447` / `.light #EEF4EE` | KEEP | 驗證成功訊息（柔沙綠，與 vivid primary 區隔，避免「成功 vs 主色」混淆） |
| `danger.*` | `#B8533A` / `.dark #9A4330` / `.light #F9EFE9` | KEEP | 錯誤、破壞性操作、棋盤將軍高亮 |
| `hint.*` | `#C9872E` / `.light #FAF2E2` / `.ring #E3C186` | KEEP | 「提示」語意（金家族，與 accent 同調但語意獨立） |

#### 線條 Line（KEEP）

| Token | Hex | 狀態 |
| --- | --- | --- |
| `line.DEFAULT` | `#E0D3BD` | KEEP |
| `line.subtle` | `#ECE1CD` | KEEP |
| `line.strong` | `#CDB999` | KEEP |

### 3.2 學習地圖磚塊色階（NEW — POP 的關鍵）

新增 `map.*` token。三層明度差是立體感來源；face 對奶油底色相＋明度雙重對比是 POP 來源。

| Token | Hex | 用途 |
| --- | --- | --- |
| `map.tile.top` | `#46C7A3` | 磚塊頂面高光（漸層上緣） |
| `map.tile.face` | `#1F9E7A` | 磚塊主面（對 `surface.base` 對比 ≈ 3.2:1，明顯跳出） |
| `map.tile.socket` | `#0F6E54` | 磚塊底座/陰影面（漸層下緣 + 下沉層） |
| `map.tile.lock.top` | `#EBE2D2` | 鎖定磚 top（去飽和） |
| `map.tile.lock.face` | `#D8CDB9` | 鎖定磚 face |
| `map.tile.lock.socket` | `#B5A790` | 鎖定磚 socket |
| `map.trail` | `#F8B500` | 已解鎖路徑（金虛線，= accent 山吹金） |
| `map.trail.base` | `#D4C5A2` | 未解鎖路徑底track |

**「磚塊如何 POP」規範**：
- **明度三階差**：top→face→socket 每階 L\* 至少差 ~12，立體才立得起來。
- **對背景**：當前/可玩磚塊 face 對 `surface.base` 對比 ≥ 3:1（色相差再加成）。鎖定磚刻意去飽和、降對比（≈ 1.4:1），與可玩磚拉開狀態差。
- **白色磚號**：17px+ 粗體，對 face 對比 ≥ 3:1（大字標準）。
- **當前磚**：放大 + `accent` 焦點環（`0 0 0 4px accent`），是全頁唯一最高焦點。

### 3.3 棋盤互動視覺（**不在本 doc 管轄** — 服從 move-annotation 系統）

棋盤的方格、棋子、last-move/select/legal/check 高亮、箭頭標註、評估條配色**已被上游鎖定**，採日本傳統色（來源：`design/gdd/game-concept.md` §視覺色彩 + ADR-0006 移動標註渲染基底 + `docs/architecture/control-manifest.md`）。本設計系統**不覆蓋**，僅在此列出供對照：

| 元素 | 日本色 | Hex | 角色 |
| --- | --- | --- | --- |
| keySquare highlight | 山吹色 yamabuki | `#F8B500` | 「這格重要」← **與本 doc 的 accent 同色** |
| playedMove 箭頭 | 利休鼠 rikyū-nezu | `#888E7E` | 你實際走的一手（中性） |
| alternateLine 箭頭 | 淺蔥色 asagi | `#33A6B8` | 另一條可行線（邀請性藍） |
| threat 箭頭 | 紅鬱金 beni-ukon | `#E08E79` | 威脅警示（非火紅） |
| 亮格 / eval 白方 | 胡粉色 gofun | `#FFFFFC` | — |
| 暗格 / eval 黑方 | 桑染 kuwazome | `#946259` | — |
| eval peak marker | 山吹色 yamabuki | `#F8B500` | 最大轉折（同 keySquare 金） |

> **唯一對齊動作**：app chrome 的 `accent` 已採與 keySquare/peak 相同的山吹金 `#F8B500`，確保「焦點/獎勵/關鍵時刻」訊號全站一致。對比、forced-colors、reduced-motion 一律依 `design/ux/accessibility-requirements.md`（該文件 takes precedence）。

---

## 4. Typography

**維持現有自架 CJK 字型，不導入 Google Fonts**（純拉丁字型如 Playfair/Inter 無中文字符，會讓中文 fallback 崩壞）。本節只重訂字階、字重、行高、字距；不動 `src/assets/fonts.css`。

### 4.1 字型角色

| 角色 | 字型 | 已載入字重 | 用途 |
| --- | --- | --- | --- |
| Display / Heading | `Noto Serif TC` | 600 / 700 | 頁標題、課程標題、莊嚴數字（殿堂感） |
| Body / UI | `Sarasa UI TC` | 400 / 700 | 內文、按鈕、label、棋譜 |

Fallback stack 維持 `tailwind.config.ts` 既有設定（PingFang TC → Noto Sans TC → Microsoft JhengHei → system）。

### 4.2 Type Scale（擴充既有 `display` / `display-sm`）

| Token | size / line-height | weight | 字型 | 用途 |
| --- | --- | --- | --- | --- |
| `display` | 2.75rem / 1.15, ls -0.01em | 700 | Serif | KEEP，Hero/頁首大標 |
| `display-sm` | 2rem / 1.2, ls -0.01em | 700 | Serif | KEEP |
| `h1` | 1.75rem / 1.25 | 700 | Serif | 區塊主標 |
| `h2` | 1.375rem / 1.3 | 700 | Serif | 卡片標題 |
| `h3` | 1.125rem / 1.4 | 700 | Sans | 子標 |
| `body` | 1rem / 1.6 | 400 | Sans | 內文（**最小 16px，避免 iOS 自動縮放**） |
| `body-sm` | 0.875rem / 1.6 | 400 | Sans | 次要說明 |
| `label` | 0.8125rem / 1.4, ls 0.02em | 500 | Sans | 標籤、badge、nav |
| `caption` | 0.75rem / 1.4 | 400 | Sans | 附註 |
| `notation` | 0.875rem / 1.5 | 500 | Sans + `tabular-nums` | 棋譜、評分、計時（等寬數字防跳動） |

### 4.3 字重階
- 400 內文 / 500 label・notation / 700 標題與強調。
- Noto Serif TC 僅 600–700 → 襯線只用於標題層；不要用襯線排內文（無 400 字重）。

---

## 5. Nav Bar 設計方向

### 5.0 Header + Tab 結構

- **頂部 header**：只放品牌 logo（Gambit 字標）+ 右側設定齒輪圖示。**不放**任何導覽項目，不重複底部 tab。底色 `surface.deep #103029`，高度 48px（含安全區）。
- **主導覽**：**底部 tab bar**（4 項：學習 / 對弈 / 闖關 / 我的）；加 `pb-[env(safe-area-inset-bottom)]` 避免 iPhone home indicator 遮蓋。
- 桌面寬螢幕（≥ 768px）可改為左側 sidebar，但 token 與狀態規格相同。

**移除木紋照片底，改純色深青瓷 Jade**（`surface.deep #103029`），active 用實心 pill + accent 指示條 + 字重提升取代 `bg-white/10`。檔案：`src/components/app-nav.vue`。

### 5.1 四態規範

| 態 | 樣式 |
| --- | --- |
| default | 文字 `ink.on-deep-dim #9BBDB1`，weight 500，透明底 |
| hover | 文字提亮至 `ink.on-deep #E7F1EC`，底 `white/8`，150ms transition |
| **active** | 文字 `#FFFFFF` weight 700 + 實心 pill 底 `#1C7059`（= `primary.DEFAULT`，白字對比 ≈ 4.5:1 ✓ AA）+ **底部 3px `accent` 指示條** + 內陰影微光 |
| focus-visible | 2px `accent` 外環（鍵盤導覽用，不可移除） |

### 5.2 規範
- 觸控目標 ≥ 44×44px（手機底 tab）。
- 桌面頂 bar / 手機底 tab 共用同一套 token；底 tab 加 `pb-[env(safe-area-inset-bottom)]`。
- nav 項目 ≤ 5（學習 / 對弈 / 闖關 / 紀錄 / 我的）。
- 取代現有 class：`hover:bg-white/5` → `hover:bg-white/8`；`active-class="!text-nav-active bg-white/10"` → 實心 pill + 指示條（見上）。

---

## 6. 棋盤與棋子（維持現有配置）

**不更動**。棋盤 = `/board/wood12.jpg` 整張木紋貼圖（格子烤進圖）；棋子 = Gioco Wood SVG set（`/pieces/*.svg`）；黑子維持 `--piece-dark-brightness: 1.2` filter。

設計系統**只**規範疊加在棋盤上的互動高亮（§3.3）——確保金/綠高亮在木紋上讀得清楚，與全站 accent/primary 一致。`src/assets/board-theme.css` 本體不動。

### 6.1 棋盤顯示規格（校準新增）

- **寬度**：加寬至近滿版——左右 padding 縮至最小（手機 ≤ 8px），棋盤佔主視覺。桌面側欄（棋譜/控制）與棋盤並排，不壓縮棋盤。
- **座標**：顯示 1–8（左側/右側）＋ a–h（上方/下方）。
  - 字型：`notation`（7–8px，`tabular-nums`，weight 500）
  - 色：`#3D2210`（= `ink.DEFAULT`）+ 1px 奶油 text-stroke 確保在深色棋格上可讀
- **對局畫面**：**不顯示 eval 條**（保護心態，無 eval）
- **覆盤畫面**：顯示 eval 條，採**木色**而非標準黑白——
  - 白方優勢色：`#C2A37C`（吸白子木色）
  - 黑方優勢色：`#4E3F36`（吸黑子木色）
  - 分界金線：`#F8B500`（= `accent`）
  - eval 條寬度：8px，貼棋盤左側

---

## 7. 學習地圖設計方向

檔案：`src/components/learn-path.vue`。

0. **方向：由下而上闖關（KEEP）**。第 1 課在最底、往上解鎖；已完成在下方、鎖定在上方、當前是最高的已解鎖磚。現有元件已用 y-flip 實作（`learn-path.vue:86`「Build top-down, then y-flip so node[0] lands at the bottom」）——**維持此行為**。金色 trail 從底部畫到當前進度，未解鎖段用灰虛線。CTA「繼續」泡泡浮在當前磚上方。
1. **幾何**：放棄 `transform: rotate(45deg)`（斜邊 anti-alias 糊邊根因，且需 `.tile__inner` 反向旋轉 + 角落徽章再反轉）→ 改 `clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%)` 或 SVG `<polygon>`。內容天然保持正向、邊緣銳利，省掉所有 counter-rotate。
2. **立體**：face 漸層 `linear-gradient(155deg, map.tile.top, map.tile.face 55%, map.tile.socket)` + 下方 `socket` 層 `translateY(7px)` 做底座；`drop-shadow` 用暖棕（非純黑）。
3. **狀態**：done＝primary 綠 + 角落 ✓ 徽章；current＝放大 + `accent` 山吹金焦點環（全頁唯一最高焦點）；locked＝`map.tile.lock.*` 去飽和 + 🔒（用 SVG icon，非 emoji）。
   - ⚠️ **當前磚的「呼吸」強調必須用 `transform: scale` 或 `opacity`，不可動畫 `box-shadow`**（`accessibility-requirements.md` §4：box-shadow 動畫禁止、60fps 預算）。現有 `learn-path.vue` 的 `@keyframes glow` 動畫 box-shadow 屬既有違規，改幾何時一併修正。reduced-motion 下完全停用呼吸動效、焦點環保持靜態全亮。
4. **路徑 trail**：已解鎖段 `map.trail` 金虛線；未解鎖 `map.trail.base`。
5. **CTA**：`linear-gradient(180deg, accent.light, accent)` 金膠囊，文字 `accent.ink`。
6. **（可選）地圖世界沉浸感**：地圖區段底改 `surface.deep` 深氈綠羊皮紙質感，磚塊在深底上更跳、更有「闖關世界」感。採用時注意該區內所有文字改用 `ink.on-deep`。

---

## 8. 各頁面視覺補充規格

### 8.1 首頁（儀表板）

- **Hero greeting card**：全幅 glass 面板，底色 `surface.deep #103029`，`backdrop-blur: 10px`，`border: 1px solid rgba(255,255,255,.16)`。文字用 `ink.on-deep`；次要用 `ink.on-deep-dim`。
- **greeting 文字**：`h2`（Noto Serif TC 700），如「今天好，一帆？」
- **焦點 CTA 卡**（新對局）：放大版 glass 卡，按鈕用 `primary.DEFAULT #1C7059` + accent 金邊。
- **繼續學習 hero**：奶油底（`surface.base`）區，卡片 `surface.card`，進度條用 `primary.DEFAULT`。
- **總覽 / 即將推出 placeholder**：靜態卡，鎖定態用 `map.tile.lock.*` 去飽和配色，文字 `ink.muted`。

### 8.2 對局畫面（輪流動態 badge）

棋盤上方（或下方）顯示當前回合狀態，**不顯示 eval 條**：

| 狀態 | 樣式 |
| --- | --- |
| **輪到你** | jade 實心膠囊 `primary.DEFAULT`，白字「輪到你」，weight 700，無動效 |
| **AI 思考中** | 深底 `surface.deep` 玻璃膠囊，文字 `ink.on-deep-dim`「AI 思考中」＋ 3 點動效 `●●●`（`opacity` 淡入淡出，250ms stagger，reduced-motion 下靜態顯示「●●●」） |

### 8.3 覆盤畫面

- **木色 eval 條**：見 §6.1，貼棋盤左側 8px 寬條。
- **玩家視角判語**：以白方/黑方為主詞，正優勢顯示綠色標籤（`success.DEFAULT`），負優勢顯示暖紅（`danger.DEFAULT`）。格式：「白方稍優（+0.6）」「黑方佔優（−1.4）」。
- **關鍵一手按鈕**：accent 金 CTA（`linear-gradient(180deg, accent.light, accent)`），文字 `accent.ink`，icon = Lucide `Zap`（閃電），表示最大轉折點跳轉。

### 8.4 Hero 徽章（學習地圖 header 右側）

顯示當前章節的主角棋子，強化「棋之國度」儀式感：

- **形狀**：圓形幣章，直徑 56px（手機）/ 72px（桌面）
- **邊框**：2px 山吹金 `#F8B500`，外圍微光 `0 0 10px rgba(248,181,0,.4)`
- **底色**：`primary.DEFAULT #1C7059`（翡翠底）
- **棋子圖示**：白色 SVG，居中，高 60%。**隨章節主角棋子變化**（兵 / 馬 / 車 / 象 / 后 / 王）
- **四方位刻點**：上下左右各 1 顆 4px 圓點，色 `#F8B500`，距邊 6px
- **無文字**（純圖形，不放數字或章節名）

---

## 9. Elevation / Shadow / Radius / Spacing（沿用既有）

- **Shadow**（KEEP，暖棕柔陰影）：`shadow.card`、`shadow.card-hover`、`shadow.button`。新增深色錨內的卡片用 `surface.deep-2` 抬升（深區不靠陰影靠明度）。
- **Radius**（KEEP）：`btn 0.5rem`、`card 0.75rem`、`lg-card 1rem`、shadcn `--radius 0.625rem`。
- **Spacing**：維持 4 / 8px 節奏；區塊間距階 16 / 24 / 32 / 48。
- **Elevation 階**：page(0) → card(`shadow.card`) → hover(`shadow.card-hover`) → popover/dialog(更強，沿用 shadcn dialog)。不要隨機 shadow 值。

---

## 10. Anti-patterns（應避開）

- ❌ 同色系、同明度堆疊（現況病灶）——任何畫面缺少深色錨點就會回到「灰撲撲」。
- ❌ 照片材質（木紋 jpg）當大面積 UI 底——噪點高、吃對比、active 態被吞。
- ❌ `rotate(45deg)` 假幾何造成斜邊糊邊——改 `clip-path` / SVG。
- ❌ 金色 `accent.DEFAULT` 當內文或小字（對比僅 ≈ 2.5:1）。
- ❌ emoji 當功能 icon（🔒/✓ 等）——用 SVG icon（Lucide / 既有 `/ui/iconCheck_*.png`）。
- ❌ 導入純拉丁 Google Fonts（Playfair/Inter）——破壞中文顯示。
- ❌ accent 濫用——金色一多就廉價；只給焦點/獎勵/進度。
- ❌ 動效 > 400ms、彈跳卡通 easing、不尊重 `prefers-reduced-motion`。
- ❌ 移除 focus ring；icon-only 按鈕無 `aria-label`。

---

## 11. Pre-delivery Checklist

### 視覺品質
- [ ] 每個畫面有明確深色錨點（nav / 地圖世界 / 棋盤），不全是中明度暖棕。
- [ ] 學習磚塊對奶油底明顯跳出（face 對背景 ≥ 3:1）；當前磚是全頁最高焦點。
- [ ] 無 emoji 當 icon；icon 來自單一 SVG family，描邊粗細一致。
- [ ] 金色未用於內文/小字；金底文字用 `accent.ink`，金色文字用 `accent.dark` 且限大字。

### 互動
- [ ] 所有可點元素有 `cursor-pointer` + 按壓回饋（150–300ms transition）。
- [ ] 觸控目標 ≥ 44×44px（含手機底 tab、棋格、磚塊）。
- [ ] nav active 一眼可辨（實心 pill + accent 指示條 + 字重）。
- [ ] disabled 態 opacity 0.4–0.5 + 不可點 + 游標變化。

### 明暗對比（WCAG）
- [ ] 內文對比 ≥ 4.5:1；大字/UI glyph ≥ 3:1（深色錨上的文字另行驗證）。
- [ ] 焦點環、邊框在深色錨與淺底都看得見。
- [ ] 不只靠顏色傳達狀態（done/locked/錯誤同時有形狀或 icon）。

### 版面 / 響應式
- [ ] 內文最小 16px（避免 iOS Safari 自動縮放）。
- [ ] 固定 nav / 底 tab 預留安全區（`env(safe-area-inset-*)`）；內容不被遮。
- [ ] 375 / 768 / 1024 / 1440 四斷點驗證，無水平捲動。
- [ ] 棋譜/評分/計時用 `tabular-nums`，數字變動不跳版。

### 無障礙 / PWA
- [ ] `prefers-reduced-motion` 下停用/減弱動效。
- [ ] iPhone Safari PWA：safe-area、`min-h-dvh`（非 100vh）、底 tab 不被 home indicator 壓到。
- [ ] icon-only 控制項有 `aria-label`；focus 順序合理。

---

## 12. 落地對照表（實作時照此改）

| 檔案 | 改什麼 |
| --- | --- |
| `tailwind.config.ts` | `primary.*` 改 Jade `#1C7059`（§3.1）；新增 `accent.*`（= 山吹金 `#F8B500` 家族）、`surface.deep #103029`、`surface.deep-2 #18443A`、`ink.on-deep #E7F1EC`、`ink.on-deep-dim #9BBDB1`、`map.*`（§3.2）。`nav.bg` 改 `#103029`、`nav.active` 機制改 pill `#1C7059`（§5）。其餘 KEEP。 |
| `src/assets/main.css` | shadcn HSL 同步：`--primary: 164 60% 28%`、`--primary-foreground: 0 0% 100%`、`--ring: 164 60% 28%`（§3.1）。 |
| `src/assets/fonts.css` | **不動**（字型維持）。 |
| `src/components/app-nav.vue` | 移除 `wood12_bg.jpg` 背景，改 `surface.deep #103029` 純色；active 改實心 pill `#1C7059` + accent 指示條；加頂部 header（brand + gear）（§5）。 |
| `src/views/HomeView.vue`（或首頁元件） | 改為儀表板 IA：greeting glass card + 繼續學習 hero + 總覽（§8.1）。 |
| `src/views/GameView.vue`（或對局元件） | 加輪流動態 badge（§8.2）；移除 eval 條（§6.1）。 |
| `src/views/ReviewView.vue`（或覆盤元件） | 加木色 eval 條（§6.1）；判語文字（§8.3）；關鍵一手按鈕（§8.3）。 |
| `src/components/learn-path.vue` | `rotate(45deg)` → `clip-path`；磚塊色改 `map.*`；CTA/trail 改 accent 山吹金；當前磚呼吸動效改 `transform/opacity`；加 Hero 徽章（§8）。 |
| `src/assets/board-theme.css`、move-annotation 系統 | **不動**（棋盤/棋子/標註/評估條由上游管轄，§3.3）。 |

> 本任務只交付本文件。實際改 code 為後續獨立任務。
