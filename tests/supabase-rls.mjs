// Access-rule (RLS) checks against the LOCAL Supabase stack. Needs: supabase start, node supabase/dev-users.mjs.
// Run: npm run test:rls   (reads the API URL and anon key from `supabase status`)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const [url, anon, usersFile] = process.argv.slice(2);
const U = JSON.parse(readFileSync(usersFile, 'utf8'));
const mk = () => createClient(url, anon, { auth: { persistSession: false } });
const as = async who => { const c = mk(); const { error } = await c.auth.signInWithPassword({ email: U[who].email, password: U[who].password }); if (error) throw error; return c; };
const out = []; const ok = (name, cond) => out.push((cond ? 'PASS ' : 'FAIL ') + name);
const cari = await as('cari'), board = await as('board'), anonC = mk();
const TEST_DATE = '2000-01-01';   // separate from the real lesson date
let { data: s } = await cari.from('sessions').select('*').eq('date', TEST_DATE).maybeSingle();
if (!s) { const r = await cari.from('sessions').insert({ date: TEST_DATE, site: 'RLS test' }).select().single(); s = r.data; }
ok('screener can create or read a session', !!s);
await cari.from('students').delete().eq('session_id', s.id);
const { error: e2 } = await cari.from('students').insert({ session_id: s.id, student_no: 1, first_name: 'Testa', a1: 2 });
ok('screener can add student', !e2);
const { error: e3 } = await cari.from('students').insert({ session_id: s.id, student_no: 2, first_name: 'Bad', a1: 4 });
ok('score 4 rejected by database', !!e3);
const b = await board.from('students').select('*'); ok('board account sees no students', !b.error && b.data.length === 0 || !!b.error);
const b2 = await board.from('students').insert({ session_id: s.id, student_no: 3, first_name: 'X' }); ok('board account cannot add students', !!b2.error);
const a = await anonC.from('students').select('*'); ok('signed-out sees no students', !!a.error || a.data.length === 0);
const a2 = await anonC.from('sessions').select('*'); ok('signed-out sees no sessions', !!a2.error || a2.data.length === 0);
const l = await cari.from('level_log').insert({ session_id: s.id, level: 2, source: 'test' }).select().single(); ok('log insert', !!l.data);
const l2 = await cari.from('level_log').update({ level: 3 }).eq('id', l.data.id).select(); ok('log cannot be edited (append only)', !!l2.error || l2.data.length === 0);
const l3 = await cari.from('level_log').delete().eq('id', l.data.id).select(); ok('log cannot be deleted', !!l3.error || l3.data.length === 0);
// realtime board channel: board account ⇄ screener
const got = await new Promise(async res => {
  const t = setTimeout(() => res('timeout'), 8000);
  await board.realtime.setAuth(); await cari.realtime.setAuth();
  const rb = board.channel('board-2026-12-01', { config: { private: true } }).on('broadcast', { event: 'cmd' }, m => { clearTimeout(t); res(m.payload); });
  rb.subscribe(st => { if (st === 'SUBSCRIBED') {
    const rc = cari.channel('board-2026-12-01', { config: { private: true } });
    rc.subscribe(s2 => { if (s2 === 'SUBSCRIBED') rc.send({ type: 'broadcast', event: 'cmd', payload: { cmd: 'goto', args: [3] } }); });
  } });
});
ok('board receives command over private channel: ' + JSON.stringify(got), got?.cmd === 'goto');
const anonGot = await new Promise(res => { const t = setTimeout(() => res('no access'), 5000);
  anonC.channel('board-2026-12-01', { config: { private: true } }).subscribe((st, err) => { if (st === 'SUBSCRIBED') { clearTimeout(t); res('subscribed'); } if (st === 'CHANNEL_ERROR') { clearTimeout(t); res('denied'); } }); });
ok('signed-out cannot join board channel: ' + anonGot, anonGot !== 'subscribed');
// clean up test rows
await cari.from('students').delete().eq('session_id', s.id);
console.log(out.join('\n')); process.exit(0);
