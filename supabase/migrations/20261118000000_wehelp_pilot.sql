-- We Help! pilot · Dec 1 2026 · Escuela La Esperanza
-- Tables for the Quick Check, stop check and reader-level log, with row-level security.
-- Rules: only team accounts listed in `members` can read or write. The classroom board signs in with a
-- `board` account that can use the board's realtime channel but can never read student data.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- members
-- One row per team account. Add rows from the Supabase dashboard (SQL editor) after creating the user.
create table public.members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('lead', 'screener', 'teacher', 'tech', 'board')),
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;

create or replace function public.is_member() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where user_id = auth.uid()) $$;

create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where user_id = auth.uid() and role <> 'board') $$;

create policy "members read team" on public.members for select to authenticated using (public.is_member());

-- ---------------------------------------------------------------- sessions
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  site        text not null default 'Escuela La Esperanza',
  class_name  text not null default '8th grade English',
  teacher     text not null default '',
  stop_turn   smallint not null default 1 check (stop_turn >= 1),
  stop_turns  smallint not null default 5 check (stop_turns between 1 and 20),
  demo        boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (date, site)
);
alter table public.sessions enable row level security;
create policy "staff read sessions"   on public.sessions for select to authenticated using (public.is_staff());
create policy "staff add sessions"    on public.sessions for insert to authenticated with check (public.is_staff());
create policy "staff update sessions" on public.sessions for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------- students (roster + quick check scores)
-- Score columns: 0–3, or null = not given yet (never treated as zero).
create table public.students (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions (id) on delete cascade,
  student_no      smallint not null check (student_no > 0),
  first_name      text not null,
  watched         boolean not null default false,
  a1 smallint check (a1 between 0 and 3), a2 smallint check (a2 between 0 and 3), a3 smallint check (a3 between 0 and 3),
  a4 smallint check (a4 between 0 and 3), a5 smallint check (a5 between 0 and 3),
  a1_missed       text[] not null default '{}',
  bonus           smallint check (bonus between 0 and 3),
  zero_notes      jsonb not null default '{}',
  response_mode   text check (response_mode in ('speech', 'pointing', 'gesture', 'sign', 'AAC', 'Spanish')),
  engaged         boolean,
  engagement_note text,
  r1 smallint check (r1 between 0 and 3), r2 smallint check (r2 between 0 and 3), r3 smallint check (r3 between 0 and 3),
  r4 smallint check (r4 between 0 and 3), r5 smallint check (r5 between 0 and 3),
  started_at      timestamptz,
  finished_at     timestamptz,
  re_started_at   timestamptz,
  recorded_by     text,
  screened_by     text,
  feeling         text check (feeling in ('happy', 'calm', 'sad', 'mad')),   -- Introduction feelings check-in, one per student
  feeling_at      timestamptz,
  meta            jsonb not null default '{}',   -- per-item timestamps and anything else the portal records
  updated_at      timestamptz not null default now(),   -- set by the device when the change was made (offline-safe)
  updated_by      uuid default auth.uid(),
  unique (session_id, student_no)
);
create index students_session on public.students (session_id);
alter table public.students enable row level security;
create policy "staff read students"   on public.students for select to authenticated using (public.is_staff());
create policy "staff add students"    on public.students for insert to authenticated with check (public.is_staff());
create policy "staff update students" on public.students for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff remove students" on public.students for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------- stop check marks (one row per watched student per STOP turn)
create table public.stop_marks (
  student_id  uuid not null references public.students (id) on delete cascade,
  session_id  uuid not null references public.sessions (id) on delete cascade,
  turn        smallint not null check (turn between 1 and 20),
  value       char(1) not null check (value in ('Y', 'N')),
  recorded_by text,
  at          timestamptz not null default now(),
  primary key (student_id, turn)
);
create index stop_marks_session on public.stop_marks (session_id);
alter table public.stop_marks enable row level security;
create policy "staff read marks"   on public.stop_marks for select to authenticated using (public.is_staff());
create policy "staff add marks"    on public.stop_marks for insert to authenticated with check (public.is_staff());
create policy "staff update marks" on public.stop_marks for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff clear marks"  on public.stop_marks for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------- reader level log (append only: the teacher-override audit trail)
create table public.level_log (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions (id) on delete cascade,
  at          timestamptz not null default now(),
  by_name     text,
  level       smallint not null check (level between 1 and 3),
  recommended smallint check (recommended between 1 and 3),
  source      text not null,
  reason      text
);
create index level_log_session on public.level_log (session_id);
alter table public.level_log enable row level security;
create policy "staff read log" on public.level_log for select to authenticated using (public.is_staff());
create policy "staff add log"  on public.level_log for insert to authenticated with check (public.is_staff());

-- ---------------------------------------------------------------- live updates
alter publication supabase_realtime add table public.sessions, public.students, public.stop_marks, public.level_log;

-- Board link: private realtime channels named "board-<date>". Team members (including the board account) only.
create policy "members use board channel" on realtime.messages for select to authenticated
  using (public.is_member() and realtime.topic() like 'board-%');
create policy "members send on board channel" on realtime.messages for insert to authenticated
  with check (public.is_member() and realtime.topic() like 'board-%');

-- ---------------------------------------------------------------- table privileges
-- Signed-in users get table access, and the row-level security policies above decide what each one can see.
-- The anon (signed-out) role gets nothing.
grant usage on schema public to authenticated, service_role;
grant select on public.members to authenticated;
grant select, insert, update on public.sessions to authenticated;
grant select, insert, update, delete on public.students, public.stop_marks to authenticated;
grant select, insert on public.level_log to authenticated;
grant all on public.members, public.sessions, public.students, public.stop_marks, public.level_log to service_role;
grant execute on function public.is_member(), public.is_staff() to authenticated;
revoke all on public.members, public.sessions, public.students, public.stop_marks, public.level_log from anon;
