// Local development only: creates test team accounts on the LOCAL Supabase stack (supabase start) and adds them
// to `members`. Usage: node supabase/dev-users.mjs <API_URL> <SERVICE_ROLE_KEY>
// Writes the generated test passwords to supabase/.dev-users.local.json (git-ignored). Never run against production.
import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const [url, service] = process.argv.slice(2);
if (!url || !service || !/127\.0\.0\.1|localhost/.test(url)) { console.error('Local stack only: node supabase/dev-users.mjs http://127.0.0.1:56321 <service_role key>'); process.exit(1); }
const H = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
const people = [
  ['lizbeth', 'Lizbeth', 'lead'], ['cari', 'Cari', 'screener'], ['teacher', 'Classroom teacher', 'teacher'],
  ['madeline', 'Madeline', 'tech'], ['board', 'Classroom board', 'board'],
];
const out = {};
for (const [slug, name, role] of people) {
  const email = `${slug}@dreams.test`, password = randomBytes(9).toString('base64url');
  let r = await fetch(`${url}/auth/v1/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ email, password, email_confirm: true }) });
  let j = await r.json();
  if (!r.ok && /already/.test(JSON.stringify(j))) {
    const list = await (await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: H })).json();
    const u = list.users.find(u => u.email === email);
    r = await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: 'PUT', headers: H, body: JSON.stringify({ password }) }); j = await r.json();
  }
  if (!j.id) { console.error('Could not create', email, j); process.exit(1); }
  const m = await fetch(`${url}/rest/v1/members`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: j.id, name, role }) });
  if (!m.ok) { console.error('members insert failed', await m.text()); process.exit(1); }
  out[slug] = { email, password, role };
}
writeFileSync(new URL('./.dev-users.local.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('Created', Object.keys(out).length, 'local test accounts → supabase/.dev-users.local.json');
