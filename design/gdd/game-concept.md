# Game Concept: Chess Training Companion

*Created: 2026-05-27*
*Status: Draft*

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
| **Art Style** | Clean, modern, calm — chess board takes center stage, UI fades into background |
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
3. **Skill score system** with three axes (Opening / Tactics / Endgame) updated after each game
4. **Level progression** that unlocks harder AI opponents
5. **Game history** that lets the player re-watch any past game with annotations
6. **Cross-device sync** via Supabase + Magic Link login

**Explicitly NOT in MVP** (deferred to Phase 2):
- Natural language AI explanations of moves (requires Claude API)
- Bidirectional lesson-to-game linking (requires lessons + matching algorithm)
- Puzzle generation from played games
- Structured lesson library

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
