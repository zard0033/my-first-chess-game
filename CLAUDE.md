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
- **Chess Engine**: stockfish.wasm (lichess open source)
- **Chess Rules**: chess.js (bundled with vue3-chessboard)
- **Opening Database**: chess-openings (lichess open source)
- **Cloud Backend**: Supabase (PostgreSQL + Auth with Magic Link)
- **Deployment**: GitHub Pages
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Version Control**: Git with trunk-based development

> **Note**: This project does NOT use a traditional game engine (Godot/Unity/Unreal).
> Engine-specialist agents are not applicable. Use web/TypeScript-focused review.

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

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
