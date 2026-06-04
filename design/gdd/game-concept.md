# Game Concept: Chess Training Companion

*Created: 2026-05-27*
*Status: Draft*

> ⚠️ **2026-06-04 — 調性／視覺識別／遊戲化已由 [`game-concept-v2.md`](./game-concept-v2.md) 修訂取代。**
> 本文的 **Visual Identity Anchor §**（lichess-clean／calm-default／board-recedes）**作廢**，改採 v2 的「精緻有溫度的棋之國度」方向（深青瓷＋山吹金＋玻璃質感）。
> 本文其餘營運細節（MVP、Core Loop、雙向連結 hook、風險、技術、棋盤標註的 Nippon 角色色）**仍有效**。

---

## Elevator Pitch

> It's a single-player chess training app where you play against AI and learn through personalized post-game analysis that links every move you make to the lessons you've studied — turning each game into a stepping stone toward playing real opponents on chess.com or lichess.

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Chess training tool / Educational game |
| **Platform** | Web App (Windows browser + iPhone Safari) |
| **Target Audience** | Adult chess beginners who want to improve systematically (see Player Profile) |
| **Player Count** | Single-player only |
| **Session Length** | 10-30 minutes (one game + review) |
| **Monetization** | None (personal project, possibly open source) |
| **Estimated Scope** | Medium (3-6 months part-time for Phase 1) |
| **Comparable Titles** | chess.com (Learn), lichess (Puzzles + Analysis), Chesskit (chesskit.org) |

---

## Core Fantasy

**"I am steadily becoming a better chess player, and I can see it."**

The player feels growth. Not just a number going up, but a real sense that the patterns they study show up in their games, that their mistakes get identified and fixed, and that what they learn today connects to what they did yesterday. The product makes learning chess feel like watching a tree grow — slow, but undeniable when you look back.

---

## Unique Hook

**Bidirectional knowledge linking.**

It's like chess.com's lesson + analysis features, AND ALSO every move in every game you play is automatically cross-referenced against every lesson you've studied — so the AI can tell you "at move 12 you could have used the Italian Game counterplay you learned last week," and lessons can show you "you actually encountered this exact position in your game from March 15."

No other chess platform does this. They treat lessons and games as separate worlds.

---

## Game Pillars

### Pillar 1: Accumulation Over Sessions

Every game leaves a trace. Skill scores update, level progresses, history grows. The player never feels like they're "starting over."

*Design test*: If we're debating whether to show ephemeral feedback or persistent stat changes, persistent wins.

### Pillar 2: Knowledge Connects to Play

Lessons are not isolated content. They surface in real games as relevant feedback. Games surface back in lessons as examples.

*Design test*: If a learning feature doesn't connect to actual played games, it's a candidate for cutting.

> **v0 minimum-viable manifestation (added 2026-05-28)**: v0 ships **static opening knowledge cards** — when Post-Game Review identifies the opening (`identifyOpening(moves)`), it surfaces a one-paragraph card describing the opening's core idea (e.g., "Italian Game: rapid development, central control, pressure on f7"). This is the *knowledge → game* half of the bidirectional hook, proven with a hand-authored ~20-entry data table (ECO code → markdown blurb). The *game → knowledge* half (Claude explanations + cross-game pattern matching) remains Phase 2.
>
> v0 differentiation story: "Already connects opening names to coaching prose; Phase 2 makes the link bidirectional and AI-powered."

### Pillar 3: Single Player, No Pressure

This is a training ground, not a competition. No timer pressure, no leaderboards, no other humans. Mistakes are learning opportunities, not losses.

*Design test*: If a feature creates time/social pressure, it's against this pillar.

### Anti-Pillars (What This Game Is NOT)

- **NOT a multiplayer platform** — No PvP, no online matchmaking, no accounts that compare against others. The player's only opponent is the AI, calibrated to their current level.
- **NOT a chess.com clone** — chess.com is the destination after training. This product makes the journey there efficient, not a replacement.
- **NOT a casual puzzle game** — Puzzles exist but they're training, not entertainment. Targeted weakness areas, not random tactics.

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | Player chooses what to study, when to play, what to review | Supporting |
| **Competence** | Visible skill progression across openings/tactics/endgames; AI difficulty matches level | **Core** |
| **Relatedness** | Minimal (single-player, no social) — relatedness is deferred to chess.com graduation | Minimal |

### Player Type Appeal

- [x] **Achievers** — Skill score growth, level progression, mastery tracking — Core appeal
- [x] **Explorers** — Discover patterns across games, find what they're weak at — Secondary appeal
- [ ] **Socializers** — Not served (intentional)
- [ ] **Killers/Competitors** — Not served (intentional, training ground philosophy)

### Flow State Design

- **Onboarding curve**: First session = play one game against beginner-level AI, see basic stats appear after
- **Difficulty scaling**: AI strength adapts to player's skill score
- **Feedback clarity**: Each game review explicitly names what improved, what regressed, what to study next
- **Recovery from failure**: Losing is normalized — every game produces a review with actionable next steps

---

## Core Loop

### Moment-to-Moment (30 seconds)
Player makes a chess move. AI thinks (Stockfish). AI moves. Player evaluates the new position. Tension/calm cycle.

### Short-Term (5-15 minutes)
One complete game from opening to endgame against AI. Win, lose, or draw — game ends with an offer to review.

### Session-Level (30-60 minutes)
1. Play 1-2 games
2. Review each game with AI annotations + opening identification
3. Optionally do a recommended puzzle targeting their weakest area
4. See updated skill scores and growth curve before closing

### Long-Term Progression
- **Skill scores** in three categories (Opening, Tactics, Endgame) — grow with successful application, decay slightly with mistakes
- **Level** unlocks harder AI opponents and new lesson tracks
- **Game history** grows — each entry is a re-watchable, re-reviewable artifact
- **Phase 2:** AI-detected patterns ("you frequently miss back-rank threats") surface as personalized lessons

### Retention Hooks
- **Curiosity**: "What did Stockfish say about my last move?" (immediate post-game payoff)
- **Investment**: Skill scores and game history — accumulating value that's lost if abandoned
- **Mastery**: Each session has a measurable "did I improve?" answer

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| **lichess** | Open source chess components (chessground, stockfish.wasm, openings db), Puzzle system | Single-user only, no social, with knowledge linking | Validates the technical stack; proves chess training in browser works |
| **chess.com (Learn)** | Structured lesson tracks, daily puzzles | Lessons cross-reference player's own games | Validates appetite for structured chess learning |
| **Chesskit** | Game review + Stockfish analysis web app | Vue not React, bidirectional linking, accumulation system | Same niche already exists — validates market |
| **Duolingo** | Streaks, daily targets, growth feedback | Chess-specific skill model, not language gamification | Validates progression-style learning UX |

**Non-game inspirations**: SRS (Spaced Repetition Systems) like Anki — repeating concepts in context they'll be needed.

---

## Visual Identity Anchor

> *Added 2026-05-28 per AD-PHASE-GATE recommendation. This anchor replaces a full art bible for this project — the visual surface is mostly off-the-shelf (chessground + Tailwind), with per-role color contracts already locked in [ADR-0006](../../docs/architecture/adr-0006-move-annotation-rendering-substrate.md).*

### One-line visual rule

**"lichess-clean meets Nippon traditional colors — the board is the protagonist; everything else recedes."**

### Reference and counter-reference

| Reference | What we take | What we reject |
| --- | --- | --- |
| **lichess.org** | Board takes ~70% of viewport; UI elements minimal; no ads; calm chrome | — |
| **chess.com** | — | Banner ads, social-pressure widgets, red/green emotive feedback, crowded sidebars |
| **Nippon Colors** ([nipponcolors.com](https://nipponcolors.com/)) | Traditional Japanese palette — naturally desaturated, culturally calm, anti-judgmental | Western "alert red / success green" semaphore |

### Visual principles

1. **Calm-default**: every visible element starts in its quietest state. Bring intensity only when the player asks for it (Show detail toggle, hover/tap, etc.). Mobile (< 768px) hides eval bar, played-move arrow, and preliminary `~` chips by default — binding per [ADR-0007 §5](../../docs/architecture/adr-0007-post-game-review-analysis-loop-and-sessionstorage-schema.md).
2. **Role-neutral color, never emotive**: color carries *navigational* meaning (bestMove / playedMove / threat / keySquare), never *judgmental* meaning (good / bad / brilliant / blunder). The annotation `role` enum is structurally enforced via static grep — see [ADR-0006 §VC4](../../docs/architecture/adr-0006-move-annotation-rendering-substrate.md).
3. **The board is the protagonist**: navigation, history, settings, exports all live in the periphery. The board is where attention lands.

### Per-role color palette (Nippon Colors)

| Role | Color name | Hex | Use |
| --- | --- | --- | --- |
| `bestMove` arrow | 青磁色 seiji-iro | `#7ebea5` | Calm teal — "the engine's recommendation", confident without being assertive |
| `playedMove` arrow | 利休鼠 rikyū-nezu | `#888e7e` | Neutral grey-green — "what you actually did", no judgment |
| `alternateLine` arrow | 浅葱色 asagi-iro | `#33a6b8` | Light blue — "another viable line", invitational |
| `threat` arrow | 紅鬱金 beni-ukon | `#e08e79` | Muted coral — warning without alarm; deliberately *not* fire-red |
| `keySquare` highlight | 山吹色 yamabuki-iro | `#f8b500` | Warm gold — "this square matters", attention without urgency |
| Light squares | 胡粉色 gofun-iro | `#fffffc` | Off-white — warmer than pure white, less glare on mobile |
| Dark squares | 桑染 kuwazome | `#946259` | Mulberry-dyed brown — Japanese alternative to lichess's olive |
| Eval bar — White side | 胡粉色 gofun-iro | `#fffffc` | Matches light squares |
| Eval bar — Black side | 桑染 kuwazome | `#946259` | Matches dark squares |
| Peak marker (biggest swing) | 山吹色 yamabuki-iro | `#f8b500` | Same gold as keySquare — consistent "this is the moment" signal |

> All colors are sourced from [nipponcolors.com](https://nipponcolors.com/) and verified for [forced-colors](https://www.w3.org/TR/css-color-adjust-1/#forced) fallback (system colors override the palette when forced-colors mode is on; arrow outlines remain visible).

### Piece set

**`cburnett`** — the chessground default, served as inline SVG.

- **Why cburnett**: highest forced-colors compatibility (clean strokes), familiar to chess.com/lichess migrants (the entire target audience), tested on every chessground deployment in the wild. Picking it now prevents re-screenshotting every UI test mid-v0.
- **Custom piece art**: explicitly never. We do not commission, generate, or commit custom piece SVGs. Re-evaluating means revisiting accessibility contrast, forced-colors fallback, and dark-mode (when added) — not worth the cost for a training tool.

### Explicit deferrals

| Deferred | Decision | Why |
| --- | --- | --- |
| Dark mode | Phase 2 (post-MVP) | Adds palette + contrast verification + chessground theme swap. Out of v0 scope. `forced-colors` covers high-contrast accessibility in the meantime. |
| Custom piece art | Never | See above |
| Animated transitions beyond chessground defaults | Phase 2 | chessground's built-in slide + fade is sufficient for v0; Lottie / GSAP additions deferred |
| Per-user theme picker | Phase 2 | One theme in v0 — minimise tuning-knob surface |

### UI surface allocation (target)

- **~70% of viewport**: chess board + annotation overlay (per-role colors)
- **~20%**: peripheral panels (move list, eval badge, opening header, navigation buttons)
- **~10%**: app chrome (header / footer / status)

On mobile (< 768px), the proportions shift to ~85% board, ~15% essentials (per ADR-0007 calm default).

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 25-50 |
| **Gaming experience** | Casual to mid-core (not chess masters, but engaged learners) |
| **Time availability** | 30-60 minute sessions, 2-5 times per week |
| **Platform preference** | Desktop for focused practice, mobile for puzzles in spare moments |
| **Current habits** | Plays casually on chess.com or lichess; has tried lessons but finds them disconnected from real games |
| **What they're looking for** | Systematic improvement they can actually feel happening |
| **What would turn them away** | Online play requirement, social pressure, feature bloat, slow performance |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Stack** | Web App: Vue 3 + TypeScript + chessground + stockfish.wasm + Supabase (see [technical-preferences.md](../../.claude/docs/technical-preferences.md)) |
| **Key Technical Challenges** | (1) Stockfish performance on iPhone Safari; (2) Bidirectional position-to-lesson matching algorithm; (3) PWA offline behavior for in-progress games |
| **Art Style** | See [Visual Identity Anchor](#visual-identity-anchor) — lichess-clean + Nippon Colors palette + cburnett piece set; calm-default, role-neutral, board-as-protagonist |
| **Art Pipeline Complexity** | Low — chess pieces use existing SVG sets from chessground; UI elements use Tailwind defaults + customization |
| **Audio Needs** | Minimal — move sounds, check warning, level-up cue. No music. |
| **Networking** | None (local play vs AI only) |
| **Content Volume** | Phase 1: ~20-30 lessons total (5 openings, 10 tactics motifs, 5 endgame patterns). Phase 2: expandable lesson library |
| **Procedural Systems** | Puzzle generation from played games (similar to lichess-puzzler approach) |

---

## Risks and Open Questions

### Design Risks
- **Bidirectional linking quality**: If lesson-to-game matches feel weak or wrong, the core unique hook fails. Need to prototype this with real games before committing.
- **Skill scoring formula**: A bad formula either feels stagnant (no growth) or random (numbers shift without reason).
- **Solo loneliness**: Without social, retention depends entirely on intrinsic motivation. Some users may need accountability.

### Technical Risks
- **stockfish.wasm on mobile**: WASM performance on iPhone Safari is unpredictable. Deep analysis (Phase 2 review) may be too slow.
- **PWA offline limitations**: iOS PWA storage limits and lifecycle quirks could break "save in-progress game."
- **Position matching at scale**: Phase 2 bidirectional matching needs an efficient algorithm — full FEN-string match is too restrictive, pattern-based matching is harder.

### Market Risks
- **Niche audience**: Adult chess beginners who want structured learning AND prefer single-player tools is a narrow group.
- **Free alternatives**: chess.com Free + lichess Free already cover 80% of what most learners need.

### Scope Risks
- **Lesson content volume**: 20-30 lessons each requiring positions, explanations, and difficulty grading is a significant content task for one person.
- **Phase 2 LLM costs**: Free Claude usage isn't possible — even at $0.30/month it's a cost commitment.

### Open Questions
- How to source/author lesson content efficiently? (Decision: Phase 1 hand-authored or imported from public PGN databases — Phase 2 ADR)
- What's the minimum number of historical games needed before bidirectional linking becomes valuable? (Prototype to validate)
- Should level/skill scores reset, or be permanent? (Design decision in Progression System GDD)

---

## MVP Definition

**Core hypothesis**: A single-player chess training app with persistent skill tracking and game-by-game review feels more motivating than chess.com's existing tools, even before AI-powered explanations are added.

**Required for MVP (Phase 1)**:
1. **Play a complete game vs Stockfish** with adjustable difficulty
2. **Post-game review** showing Stockfish's evaluation of each move (best move, played move, evaluation delta) + opening name
3. **Static opening knowledge cards** — when the post-game review names an opening (via ADR-0003 opening identification), surface a hand-authored one-paragraph card describing its core idea, key squares, and typical plans. Hand-authored data table of ~20 named openings. *This is v0's minimum-viable manifestation of Pillar 2 ("Knowledge Connects to Play") — see Pillar 2 v0 note above.* (Decided 2026-05-28)
4. **Skill score system** with three axes (Opening / Tactics / Endgame) updated after each game
5. **Level progression** that unlocks harder AI opponents
6. **Game history** that lets the player re-watch any past game with annotations
7. **Cross-device sync** via Supabase + Magic Link login

**Explicitly NOT in MVP** (deferred to Phase 2):
- Natural language AI explanations of moves (requires Claude API) — *completes the bidirectional hook by analyzing the player's specific move in the context of the named opening's plan*
- **Game → knowledge half**: identifying that a position from a played game matches a lesson example (cross-game pattern matching)
- Puzzle generation from played games
- Structured lesson library (interactive lesson screens, beyond the static opening cards)

### Scope Tiers

| Tier | Content | Features | Timeline (part-time) |
| ---- | ---- | ---- | ---- |
| **MVP / Phase 1** | Stockfish-only play + review + accumulation | Items 1-6 above | 2-3 months |
| **Phase 2** | Add AI explanations + bidirectional linking | Claude API + lesson system + position matching | 2-4 months |
| **Phase 3 (future)** | Custom lessons, puzzle generator, deeper analytics | Content tools, pattern recognition | TBD |

---

## Next Steps

- [x] Concept written
- [x] Technology stack chosen and pinned in CLAUDE.md
- [ ] Decompose concept into systems (`/map-systems`)
- [ ] Author per-system GDDs (`/design-system [system]`)
- [ ] Architecture decisions (`/architecture-decision` for stockfish integration, supabase schema, etc.)
- [ ] Prototype core loop (play one game + show Stockfish review) before building full MVP
- [ ] Plan first sprint (`/sprint-plan new`)
