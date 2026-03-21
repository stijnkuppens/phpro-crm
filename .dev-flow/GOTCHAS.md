# Gotchas

Persistent across all dev-flows. Hard-won lessons.

## unified-consultants
- **No FK between bench and active tables**: `link_bench_to_account()` archives the bench row and creates a NEW active record with no reference back. When merging tables, skip all archived bench rows — they all have corresponding active records.
- **Migration numbering**: Always check `ls supabase/migrations/ | tail -5` before proposing a migration number. As of 2026-03-21, next available is 00069.
- **avatar_path is net-new**: Neither bench_consultants nor active_consultants had an avatar column. It's a new feature added alongside the merge.
