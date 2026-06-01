# QA Evidence: S7-03 DB Migration

**Date**: 2026-06-01
**Reviewer**: QA team-qa (automated review)
**Verdict**: PASS

---

## Checklist

- [x] `supabase/migrations/` contains exactly 2 SQL files
  - `20260821000000_create_game_sessions.sql`
  - `20260821000001_create_skill_scores.sql`

### game_sessions table

- [x] All 12 columns present: id, user_id, played_at, result, player_color, end_reason, ai_difficulty, pgn, move_count, opening_eco, opening_name, created_at
- [x] CHECK constraint: `result IN ('white_wins', 'black_wins', 'draw')`
- [x] CHECK constraint: `player_color IN ('white', 'black')`
- [x] CHECK constraint: `end_reason IN ('checkmate', 'resign', 'stalemate', 'draw_agreement', 'fifty_move', 'threefold', 'insufficient')`
- [x] CHECK constraint: `ai_difficulty BETWEEN 0 AND 20`
- [x] CHECK constraint: `move_count >= 0`
- [x] `ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY` present (SUPA-AC-12)
- [x] `CREATE POLICY "Users access own rows" ... USING (user_id = auth.uid())` present (SUPA-AC-11)

### skill_scores table

- [x] All 8 columns present: id, user_id, as_of_game_id, opening_score, tactics_score, endgame_score, level, created_at
- [x] Score columns use `numeric(5,1)` type
- [x] CHECK constraint: `opening_score BETWEEN 0 AND 100`
- [x] CHECK constraint: `tactics_score BETWEEN 0 AND 100`
- [x] CHECK constraint: `endgame_score BETWEEN 0 AND 100`
- [x] CHECK constraint: `level >= 1`
- [x] `ALTER TABLE public.skill_scores ENABLE ROW LEVEL SECURITY` present (SUPA-AC-12)
- [x] `CREATE POLICY "Users access own rows" ... USING (user_id = auth.uid())` present (SUPA-AC-11)
- [x] No `SECURITY DEFINER` present in either file

### Optional (deferred — requires Docker + Supabase CLI)

- [ ] RLS isolation test: User A data not visible to User B → deferred to Sprint 8 integration pass
