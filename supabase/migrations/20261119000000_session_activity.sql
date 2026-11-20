-- Dec 1 board changes: Brain Break choice and the "Let's Explore Puerto Rico" game log live on the session.
-- activity = { brainBreaks: [{id, at, by}], draws: [{place, at, by, how}], stops: [{n, place, at, by}] }
-- Attendance (present, present_at) and the game notes per student (help_asked, help_offered, support,
-- game_engaged, game_note) are stored in students.meta, so they need no new columns.
alter table public.sessions add column if not exists activity jsonb not null default '{}';
