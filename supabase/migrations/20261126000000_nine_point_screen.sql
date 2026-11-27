-- 9-point primary screen (replaces the 0–3 scale of Toolkit v2.0). Rules: site/js/scoring.js.
-- Column → item: a1 = item 3 receptive vocabulary (0–5), a2 = item 4 expressive (0–1), a3 = item 5 two-step
-- direction (0–1), a4 = item 6 target sound (0–1), a5 = item 7 anchor sentence (0–1). r1–r5 = second screen.
-- bonus = item 8, not scored: 'Completed' / 'Attempted' / 'Not offered'.
-- A null score means not recorded yet or "Not administered" (never a zero).
-- Per-item statuses, raw counts, response modes, support levels and the teacher's level override are stored in
-- students.meta (a1_status, a1_words, a2_count, a2_mode, a2_support, a3_steps, a3_in_order, a3_support,
-- a5_anchor, a5_mode, a5_support, level_override, level_override_reason, level_override_by, …).
--
-- Rows scored on the old 0–3 scale cannot be converted (the raw answers were not kept), so this migration
-- fails if any exist. Clear them first (portal Setup → "Clear all scores") before applying it.

alter table public.students
  drop constraint if exists students_a1_check, drop constraint if exists students_a2_check,
  drop constraint if exists students_a3_check, drop constraint if exists students_a4_check,
  drop constraint if exists students_a5_check,
  drop constraint if exists students_r1_check, drop constraint if exists students_r2_check,
  drop constraint if exists students_r3_check, drop constraint if exists students_r4_check,
  drop constraint if exists students_r5_check,
  drop constraint if exists students_bonus_check;

do $$
begin
  if exists (select 1 from public.students where bonus is not null) then
    raise exception 'students.bonus holds old 0–3 scores. Clear scores before applying the 9-point screen migration.';
  end if;
end $$;

alter table public.students alter column bonus type text using null;

alter table public.students
  add constraint students_a1_check check (a1 between 0 and 5),
  add constraint students_a2_check check (a2 between 0 and 1),
  add constraint students_a3_check check (a3 between 0 and 1),
  add constraint students_a4_check check (a4 between 0 and 1),
  add constraint students_a5_check check (a5 between 0 and 1),
  add constraint students_r1_check check (r1 between 0 and 5),
  add constraint students_r2_check check (r2 between 0 and 1),
  add constraint students_r3_check check (r3 between 0 and 1),
  add constraint students_r4_check check (r4 between 0 and 1),
  add constraint students_r5_check check (r5 between 0 and 1),
  add constraint students_bonus_check check (bonus in ('Completed', 'Attempted', 'Not offered'));

comment on column public.students.a1 is 'Item 3 receptive vocabulary, 0–5';
comment on column public.students.a2 is 'Item 4 expressive vocabulary, 0–1';
comment on column public.students.a3 is 'Item 5 two-step direction, 0–1';
comment on column public.students.a4 is 'Item 6 target sound, 0–1';
comment on column public.students.a5 is 'Item 7 anchor sentence, 0–1';
comment on column public.students.bonus is 'Item 8 bonus, not scored: Completed / Attempted / Not offered';
