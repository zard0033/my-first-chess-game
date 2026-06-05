# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Project Overview

**Chess Training Companion** — A single-player chess training web app for beginners.
Built as a Web App (not a traditional game engine project) because the target
platforms are Windows browser + iPhone Safari, and the product is a training tool
rather than a game requiring physics or 3D rendering.

See `~/interviews/chess-training-companion-brief.md` for the full concept brief.

## Technology Stack

- **Platform**: Web App (TypeScript + Browser APIs)
- **Frontend Framework**: Vue 3 + Vue Router + Pinia
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build System**: Vite + vite-plugin-pwa
- **Chess Board**: vue3-chessboard (wraps lichess chessground for Vue)
- **Chess Engine**: Stockfish 18 Lite (single-threaded WASM, NNUE embedded) — `stockfish@18.0.7` (nmrugg/stockfish.js); files in `public/stockfish/stockfish-18-lite-single.{js,wasm}`
- **Chess Rules**: chess.js (bundled with vue3-chessboard)
- **Opening Database**: chess-openings (lichess open source)
- **Cloud Backend**: Supabase (PostgreSQL + Auth with Magic Link)
- **Deployment**: GitHub Pages
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Version Control**: Git with trunk-based development
- **Node Runtime**: 22+ (CI 與本機開發必須一致)

> **Note**: This project does NOT use a traditional game engine (Godot/Unity/Unreal).
> Engine-specialist agents are not applicable. Use web/TypeScript-focused review.

> **CI Node 版本鎖 22，勿降回 20**：`src/lib/supabase.ts` 在 import 時即
> `createClient()`，Supabase RealtimeClient 需要 WebSocket。Node < 22 無原生
> WebSocket，會在測試載入階段（import supabase 的 suite）直接拋錯使 CI 失敗，
> 但本機 Node 22 看不出來。降版本前先改成裝 `ws` 並注入 transport。

### Phase 2 Reserved (not yet integrated)

- **PGN Viewer**: pgn-viewer (lichess open source) — for game replay UI
- **AI Explanation**: Claude API (Anthropic) — natural language move explanations
- **Backend Functions**: Supabase Edge Functions — protect Claude API key

## Project Structure

@.claude/docs/directory-structure.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

> **Push guardrail**: this repo is a fork of the `Claude-Code-Game-Studios` template.
> `origin` = `zard0033/my-first-chess-game` (your fork); `upstream` = the template.
> Always push explicitly with `git push origin main` — never bare `git push` — so a
> branch that tracks `upstream` can never push your work to the template repo.

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Visual Design System (Gambit)

**全站視覺 SoT = `design/gambit-design-system/`**。
實作任何 UI 前先讀其 `README.md` + `colors_and_type.css`。以下為非協商鐵則：

- **色彩**：每屏都要 deep-jade 錨 `#103029`；品牌金 `#F8B500` 只用於 focus / reward 的
  fill / indicator，**絕不當內文**（內文金用 `#8F6200` 且限大字）；內容區 warm cream；陰影暖棕非純黑。
- **字型（Tailwind family）**：標題 `font-display`（BIZ UDPMincho 明朝）、內文 `font-sans`（Sarasa）、
  課程內文 `font-lesson`（LXGW WenKai）、數字 / 棋譜 `font-num`（Cubic 11, tabular）、品牌字標
  `font-brand`（Cinzel）。內文最小 16px（避免 iOS auto-zoom）。
- **Icon**：Lucide line icons 單一字族；**絕不用 emoji 當功能 icon**。
- **導覽**：底部 tab 為主導覽；頂部 header 只放品牌 + 設定齒輪。
- **動效**：150–300ms，只動 transform / opacity（box-shadow 動畫禁止）；尊重 `prefers-reduced-motion`。
- **觸控目標 ≥ 44×44px**。棋盤 / 棋子 / 標註 / eval 為上游所有，**不重新上色**。
- **繁中語氣**：成熟、平靜、低壓力，稱呼「你」；無 streak / timer / leaderboard。

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
