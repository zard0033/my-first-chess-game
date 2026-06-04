<!-- STATUS -->
Epic: 視覺設計系統重構（設計階段完成，待落地）
Feature: Design System 校準完成，品牌 Logo 待定
Task: 把最終設計落地到 code（Jade token → IA → 元件）
<!-- /STATUS -->

> **新 session 交接（2026-06-04 第六輪）— VDS 校準 + Logo 探索**
> 本輪完成 `visual-design-system.md` 校準（emerald → Jade），並初探品牌 logo（AI 工具限制，SVG 手刻效果不佳，暫停）。
> **尚未把最終 Jade 視覺落地到 production code**。HEAD 仍接續 30dc830。

## ✅ 本輪完成

### A. 概念重構 — `design/gdd/game-concept-v2.md`（新）
- 定調從「平靜極簡 lichess 工具」→「**精緻有溫度的『棋之國度』學習遊戲**」（遊戲感 6–8、成熟不童趣）。
- 新增 **Pillar 4 畢業導向**、輕敘事（導師＝**貝絲·哈蒙 Beth Harmon** persona 保留；視覺形象延後到 art-bible）。
- 參考座標：Epic Seven、鳴潮、Chants of Sennaar、黑神話悟空。
- **保留**：雙向連結 hook、累積、Nippon 標註角色色。`game-concept.md` 頂部加指引 banner（視覺/調性已被 v2 取代）。

### B. 視覺設計系統 — `design/visual-design-system.md`（⚠️ 需校準）
- 此檔是中途版（寫 emerald、缺最終 IA/徽章/eval）。**最終決策見下方，需回頭校準此檔**。

### C. Claude Design 種子 — `design/`
- `claude-design-brief.md`（一頁規格）＋ `claude-design-seed-mockup.png`（**4 頁做完 mockup**：首頁儀表板／學習地圖／對局／覆盤）。雙用：餵 Claude Design ＋ art-bible 骨架。

### D. 資產清理（移除 AI 生圖）
- 刪 `public/learn/coach.png`、`trophy.png`、`bg.png` ＋ `garden-gpt-image-2/`（gpt-image prompt）。
- `learn-path.vue`：移除 coach 立繪＋trophy（capstone 改用 Crown lucide icon）。
- `LearnView.vue`：移除 `bg.png` 貼圖背景（`.learn-page::before`）。

### E. Token 實驗已 revert
- 中途 Step 1 把 `primary` 改 emerald 的 `tailwind.config.ts` / `src/assets/main.css` **已還原**——設計最終定 **深青瓷 Jade**（非 emerald），token 留待正式落地一起做對。

## 🎯 最終設計決策（落地的依據）
- **色彩**：主色 **深青瓷 Jade**、accent **山吹金 #F8B500**（= 既有品牌金）、**真實木盤＋Gioco Wood 棋子不動**；**現代玻璃質感** finish；上下深青瓷細框、中間淺奶油。
- **IA**：**首頁＝儀表板**（新對局深青瓷焦點卡 + 繼續學習 hero + 總覽含「即將推出」placeholder）、**學習＝地圖**（透視山徑、由下而上、章節 hero）、**對局**、**覆盤**。導覽＝**底部 tab**；上方 header 只放品牌＋設定齒輪（不重複 tab）。
- **Hero 徽章**：右側**金邊翡翠錢幣**（白色棋子＋四方位刻點，**隨課程主角棋子變化**）。
- **對局**：**無 eval**（保護心態）＋**輪流動態 badge**（輪到你／AI 思考中●●●）。
- **覆盤**：**木色 eval**（吸棋子色：白子 #C2A37C／黑子 #4E3F36 ＋金線）、依**玩家視角**綠/紅判語「白方稍優 (+0.6)」、**關鍵一手**按鈕。
- **棋盤**：加寬近滿版＋ **1–8 / a–h 座標**。
- **用詞精簡**、卡片描述**一行不換行**。

## 待辦 backlog（依優先序）
1. **把最終設計落地 code**：Jade token（tailwind/main.css）→ header/nav/tab → 首頁儀表板 → 學習地圖（`rotate(45deg)`→`clip-path`/透視）→ 對局/覆盤 → 徽章/動態 badge/eval/座標。
2. **品牌 Logo**：AI 工具（外部）繼續測試，或委外製作；需要 Jade 版 + 白色版各一。
3. （可選）拿種子圖去 **Claude Design** 生成探索。
4. 原 backlog：**Puzzles 闖關**（無 GDD，需規劃）、**Profile 成長頁**（空殼）、**Learn Tier3/4 內容**。
5. 技術債：game-replay QA（S10-04/05）；iOS Magic Link 實機補測。

# Active Session State

**Last updated**: 2026-06-04（第六輪 · VDS 校準）
**HEAD**: 接續 30dc830（本輪變更待 commit）
**本輪變更檔案**: `design/visual-design-system.md`（校準完成）
**Tests**: 未跑（本輪未動 production 邏輯）· **Build**: 未驗
