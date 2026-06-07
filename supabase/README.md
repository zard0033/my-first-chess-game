# Supabase — schema & migrations

Project ref: **`vfnzekqtvxhewifnmtnz`** (URL in `.env.local` as `VITE_SUPABASE_URL`).

## How migrations are applied (IMPORTANT)

This repo is **not** linked to the Supabase CLI (no `config.toml`, no `supabase/.temp`).
Migrations in `migrations/` are applied **manually via the Dashboard SQL Editor** —
that is how every table here was created.

1. Open the SQL editor: `https://supabase.com/dashboard/project/vfnzekqtvxhewifnmtnz/sql/new`
2. Paste the migration file's SQL and **Run**.
3. Success = `Success. No rows returned`.

> A migration file living in `migrations/` does **not** mean it has been applied —
> check the live DB. (E.g. `dungeon_progress` sat as a file for days before being run
> on 2026-06-07.)

## Verify a table without logging in (anon REST probe)

Using the public anon key (`VITE_SUPABASE_ANON_KEY`), no auth needed:

```bash
URL=<VITE_SUPABASE_URL>; KEY=<VITE_SUPABASE_ANON_KEY>
# table exists + read RLS scoped → HTTP 200 []  (missing table → PGRST205 / 404)
curl -s -w "%{http_code}\n" "$URL/rest/v1/<table>?select=*&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
# write RLS protected → HTTP 401 code 42501 "violates row-level security policy"
curl -s -X POST "$URL/rest/v1/<table>" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"user_id":"00000000-0000-0000-0000-000000000000","...":"..."}'
```

## RLS policy convention

Progress tables (`lesson_progress`, `dungeon_progress`, …) use one owner-scoped policy:

```sql
CREATE POLICY "Users access own rows" ON public.<table> USING (user_id = auth.uid());
```

Postgres applies the omitted `WITH CHECK` from `USING`, so this also gates INSERT to
own rows — no separate insert policy needed. Row existence = the monotonic fact
(completed / solved); reconciliation is a union, so local and cloud never conflict.
