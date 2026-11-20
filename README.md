# We Help! pilot · La Esperanza, Dec 1 2026

Classroom board, teacher portal and live data for the Unit 3 "Community Helpers" pilot lesson.
It started from the board in `../digital-dreamers-demo`, which stays as it is.
**No real student data belongs in this repo.** Rosters will live in the backend only.

## Run it
```bash
python3 -m http.server -d site 8010
```
Open http://localhost:8010: the **board** (TV) and the **teacher portal** (iPads). Add `?date=2026-12-01` to the board URL to rehearse with the lesson date.

Two modes:
- **This device only** (default, no setup): data stays in each browser. The portal drives the board when both are open in the same browser.
- **Synced** (Supabase connected): every iPad and the board sign in with a team account and share live data. If Wi-Fi drops, taps are saved on the iPad and sent in order when the connection comes back, keeping the time of the tap. The top bar shows `Synced`, `Saving…` or `Offline · N waiting`.

## Layout
- `site/board.html`: the classroom TV board (student-facing; never shows names or scores)
- `site/js/board-content.js`: **all board content**: boxes, weekdays, brain breaks, game places, letters, words, reader pages, notes.
  **Language rule:** every student-facing string has `en` and `es`; the board shows English in bold with the Spanish right below in italics (`bi()` in board.js).
  Any `img: null` draws a placeholder tile. To add media, put the file in `site/img/` and set `img: 'img/file.png'`.
- `site/js/board.js`: board behaviour, present mode, and the `window.board` control API
- `site/css/board.css`: styles (base carried over from the We Are Friends board)
- `site/portal.html` + `site/js/portal.js` + `site/css/portal.css`: the teacher portal
- `site/js/store.js`: data store: local mode, or Supabase sync with an offline queue; plus the portal ⇄ board link
- `site/js/config.js`: Supabase URL, anon key and lesson date (empty = local mode)
- `site/js/board-link.js`: board sign-in and realtime link to the iPads (synced mode)
- `site/js/vendor/supabase-2.119.1.js`: Supabase client, stored in the repo so nothing loads from a CDN in class
- `supabase/migrations/`: database tables, row-level security and realtime setup
- `supabase/dev-users.mjs`: creates test accounts on the **local** stack only
- `tests/supabase-rls.mjs`: checks the access rules against the local stack
- `site/js/screen-items.js`: Quick Check item wording, rubric and card-mat pictures (edit here when Kristen & Cari approve wording)
- `site/js/scoring.js`: **Quick Check scoring rules** from Toolkit v2.0 Part 4 (totals, levels, class level, flags,
  second screen, stop check, CSV export). One file used by the board, portal and report; loads in the browser as
  `window.WeHelpScoring` and in Node with `require`.
- `tests/scoring.test.js`: every test case from the toolkit, plus data-integrity checks

## Tests
```bash
node --test tests/*.test.js
```

## Teacher portal
Each iPad signs in once with a name and role. The name is saved with every score.
- **Lesson** (lesson lead): moves the board through boxes 1–8, opens or closes a box, and has per-box controls: attendance (Here / Not here per student; the board shows only the count) and filling in the date; picking the Brain Break (with a hint for when each one helps); the game (show the places, spin, GO / MOVE / STOP, close); reader level, page turns, sequencing check and who to call next. The reader level shows the quick-check recommendation; picking a different level asks for a reason and is logged.
- **Screen** (screener): roster, then one student, then one item per screen: show/say, 4 big score buttons with the rubric, a 5-second wait timer and the student card mat. Item 1 has toggles for the words missed and fills in the score. A 0 asks why. After that: optional bonus, response mode and engaged yes/no, then Save. A missing item is never a zero, and Save stays off until all 5 are scored. The summary shows the total, target, level and flags. **Second screen** shows only the flagged items (Level 1–2, scored 0–1).
- **Card mat**: full screen, pictures only, shuffled each time; press and hold to close.
- **Stop check** (classroom teacher): pick 4–5 students to watch, then mark Yes or No per stop. Each STOP the lesson lead presses opens the next stop here, labelled with the place. Per student: Asked for help · Offered help · Used support · Engaged, and a note. Class summary: students with more Yes than No, and what to do tomorrow.
- **Results**: here today, screened, target met, class level, level counts, stop-check %, second-screen progress, what to do tomorrow, a per-student table, the Brain Break used and the game timeline (places and stops), the reader level log, and the CSV export (no names).
- **Setup**: session date, roster (number, first name), clear scores.

## Board boxes
1 Today (Who is here? count · calendar with full weekday names; the iPad picks which fills the open box, or both) · 2 Plan ·
3 Brain Break (Five-Finger Breathing, Calm Breathing, Notice 3-2-1, March in Place; the teacher picks one) ·
4 Move together (“Let’s Explore Puerto Rico”: the four places, then spinner left / current place right with GO · MOVE · STOP, then “Who helps here?”) ·
5 Word wall (help do see go stop) · 6 Letters (H D S G): both a list on the left with one item at a time as a big card on the right, with a speaker button that says the English aloud · 7 Read together (leveled reader, Level 1–3) · 8 Comprehension (picture sequencing, 2/3/5 pictures by level)

Place pictures are placeholders until the art arrives: set `img` on each place in `board-content.js`.

## Keys
| Where | Keys |
|---|---|
| Board | → / Space next · ← back · 1–8 jump · **Enter** open box · N notes · L lesson flow on/off · R reset · F full screen |
| Any open box | **B** back to board (moves to the next box) |
| 1 Today | ←/→ who is here · calendar · both · D fill in or hide the date |
| 3 Brain Break | 1–4 pick a break · 0 back to all four |
| 4 Move together | I show the places · P play · C close · W or Space spin · 1–4 show a place · G go · M move · S stop |
| 5 Word wall · 6 Letters | ↑/↓ (or ←/→, Space) next or previous · 1–5 jump · S say it aloud |
| 7 Read together | 1–3 set the level (logged as an override) · ←/→ turn pages |
| 8 Comprehension | 1–5 place a card · Backspace undo · C check · X new order |

The **Lesson flow** switch in the board header (or L, or the portal) hides the sidebar so the boxes use the full width while presenting. Speech uses the voices built into the board computer’s browser; it needs one click or key press on the board after it opens.

Clicks work too: the words and letters, the speaker button, the calendar, brain break cards, the SPIN button, level buttons, sequencing cards.

## Control API (for the teacher portal)
`window.board.goto(n) · next() · back() · open() · close() · setAttendance(here, total) · showDate(true|false) · setIntroPart(attend|date|all) · setBrainBreak(id|null) · gamePhase(intro|play|close) · spin(i?) · setPlace(i) · signal('go'|'move'|'stop') · setWord(i) · setLetter(i) · say(text) · sayCurrent() · setFlow(true|false) · setLevel(1|2|3, source) · turn(±1) · reset() · getState()`
The same commands also work over `postMessage({type:'wehelp', cmd, args})`.

## Supabase setup (real project, before Dec 1)
1. **Create a new Supabase project** for the pilot. Keep it separate from other DREAMS projects.
2. **Create the tables:** open SQL Editor, paste all of `supabase/migrations/20261118000000_wehelp_pilot.sql` and run it, then do the same with `20261119000000_session_activity.sql` (adds the Brain Break and game log).
   (Or with the CLI: `supabase link --project-ref <ref>` then `supabase db push`.)
3. **Turn off public sign-ups:** Authentication → Sign In / Providers → turn off **Allow new users to sign up**. Only accounts the team creates can get in.
4. **Create the accounts:** Authentication → Users → Add user (tick auto-confirm). Make one each for the lesson lead, screener, classroom teacher, tech support, and **one board account** for the TV. Then add each to the team list in the SQL Editor:
   ```sql
   insert into public.members (user_id, name, role)
   select id, 'Cari', 'screener' from auth.users where email = 'cari@…';
   -- roles: lead · screener · teacher · tech · board
   ```
5. **Connect the devices.** Either put the Project URL and anon public key (Project Settings → API) in `site/js/config.js` and redeploy, or enter them on each iPad in Portal → Setup → Sync. The anon key is designed to be public; the access rules protect the data.
6. **Host `site/` over HTTPS** (GitHub Pages, Netlify or Vercel), open it on each iPad, and sign in once. iPads stay signed in.
7. **Load the roster** in Portal → Setup (number, first name). Names exist only in Supabase and on the team's iPads. The CSV export uses numbers.

**What the access rules enforce:** only accounts on the team list can read or write anything. The board account can drive the board channel but can never read student data. Scores outside 0–3 are rejected by the database. The reader-level log can't be edited or deleted.

## Local Supabase (development)
```bash
supabase start          # API on http://127.0.0.1:56321 (ports moved to 563xx so other local projects can keep 543xx)
node supabase/dev-users.mjs http://127.0.0.1:56321 <service_role key from `supabase status`>
npm install && npm run test:rls
```
Then in Portal → Setup → Sync, enter `http://127.0.0.1:56321` and the local anon key. Test accounts and passwords are in `supabase/.dev-users.local.json` (not committed).
If the CLI says `failed to read profile`, your global `~/.supabase/profile` points at a profile it can't read. Run the commands with a clean home folder, e.g. `HOME=/tmp/sb DOCKER_HOST=unix://$HOME/.docker/run/docker.sock supabase start`.

## Open items
- Score descriptions for items 2–5 and the bonus are still drafts (Kristen & Cari). They don't change the scoring math.
- Landmark pairings for Hospital, Police Station and Home (Lizbeth's game spec). Capitolio and El Faro aren't placed yet.
- Gesture text for the 5 words (Kristen).
- Picture counts for sequencing (currently 2 / 3 / 5) to confirm with Cari.
- Real Supabase project, accounts and roster (steps above).
- Real media: reader pages, word cards, letter art, place and landmark art.
- Brand fonts: the toolkit specifies Baloo 2 and Nunito. The board still uses the demo's self-hosted Poppins.
