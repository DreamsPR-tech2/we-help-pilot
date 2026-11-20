/* We Help! data store.
 *
 * Two modes, same API (get / update / subscribe …):
 *  - LOCAL: no Supabase configured (js/config.js). Everything lives in this browser; other tabs on this device share it.
 *  - SYNCED: Supabase configured. Every device signs in with a team account. Changes are saved on the device first
 *    (so nothing is lost if Wi-Fi drops), queued, and sent to Supabase in order when there is a connection.
 *    Changes from other devices arrive over realtime. Timestamps are taken on the device when the tap happened.
 *
 * The portal only ever mutates the plain data object inside Store.update(fn); in SYNCED mode the store works out
 * what changed and turns it into row writes.
 *
 * Also holds the board link (portal ⇄ board): BroadcastChannel for tabs on the same device, plus a private
 * Supabase realtime channel "board-<date>" across devices.
 */
(function(){
  var CFG = window.WEHELP_CONFIG || {};
  var REMOTE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  var KEY = REMOTE ? 'wehelp-cache:v1' : 'wehelp-data:v1', OUTBOX_KEY = 'wehelp-outbox:v1', ME_KEY = 'wehelp-me:v1';
  var SESSION_DATE = CFG.sessionDate || '2026-12-01';

  // Fictional demo roster. Real names are loaded before the day into the team's backend, never into this repo.
  var DEMO_NAMES = ['Adrián', 'Camila', 'Diego', 'Gabriela', 'Jomar', 'Kiara', 'Luis', 'Valeria'];
  var SCORE_FIELDS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a1_missed', 'bonus', 'zero_notes', 'response_mode', 'engaged', 'engagement_note',
    'r1', 'r2', 'r3', 'r4', 'r5', 'started_at', 'finished_at', 're_started_at', 'recorded_by', 'screened_by', 'feeling', 'feeling_at'];

  function nowISO(){ return new Date().toISOString(); }
  function uuid(){
    if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function same(a, b){ return JSON.stringify(a) === JSON.stringify(b); }
  function blankStudent(no, name){ return { id: uuid(), no: no, name: name, a1_missed: [], zero_notes: {}, stop: [] }; }
  function seed(){
    return {
      v: 1, demo: !REMOTE,
      session: { id: null, date: SESSION_DATE, site: 'Escuela La Esperanza', className: '8th grade English', teacher: '' },
      students: REMOTE ? [] : DEMO_NAMES.map(function(n, i){ return blankStudent(i + 1, n); }),
      stop: { watched: [], turn: 1, turns: 5 },
      levelLog: [],
      activity: blankActivity(),
      updated_at: nowISO()
    };
  }
  // Session log: brain breaks picked, game places drawn, STOPs called (with the place)
  function blankActivity(){ return { brainBreaks: [], draws: [], stops: [] }; }
  function fixActivity(d){ var a = d.activity || {}; d.activity = { brainBreaks: a.brainBreaks || [], draws: a.draws || [], stops: a.stops || [] }; return d; }

  var data, subs = [];
  function loadCache(){ try{ var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if(d && d.v === 1) return fixActivity(d); }catch(e){} return seed(); }
  data = loadCache();
  function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){ console.warn('Could not save', e); } }
  function emit(src){ subs.forEach(function(fn){ try{ fn(data, src); }catch(e){ console.error(e); } }); }

  // other tabs on this device
  window.addEventListener('storage', function(e){ if(e.key === KEY){ data = loadCache(); emit('remote'); } });

  var Store = {
    mode: REMOTE ? 'synced' : 'local',
    get: function(){ return data; },
    update: function(fn){
      var before = REMOTE ? clone(data) : null;
      fn(data); data.updated_at = nowISO();
      if(REMOTE) Sync.diff(before, data);
      persist(); emit('local');
      if(REMOTE) Sync.flush();
    },
    subscribe: function(fn){ subs.push(fn); return function(){ subs = subs.filter(function(f){ return f !== fn; }); }; },
    reset: function(keepRoster){
      if(REMOTE){
        Store.update(function(d){
          if(keepRoster){ d.students.forEach(function(s){ SCORE_FIELDS.forEach(function(f){ s[f] = f === 'a1_missed' ? [] : f === 'zero_notes' ? {} : null; });
            Object.keys(s).forEach(function(k){ if(['id', 'no', 'name', 'stop'].indexOf(k) < 0 && SCORE_FIELDS.indexOf(k) < 0) delete s[k]; }); s.stop = []; }); }
          else { d.students = DEMO_NAMES.map(function(n, i){ return blankStudent(i + 1, n); }); d.demo = true; }
          d.stop.watched = []; d.stop.turn = 1; d.stop.turns = 5; d.activity = blankActivity();
        });
        return;
      }
      var names = keepRoster ? data.students.map(function(s){ return [s.no, s.name]; }) : null;
      var session = data.session;
      data = seed(); data.session = session;
      if(names){ data.students = names.map(function(p){ return blankStudent(p[0], p[1]); }); data.demo = false; }
      persist(); emit('local');
    },
    replaceRoster: function(rows){ // rows: [[no, name], …]
      Store.update(function(d){
        var byName = {}; d.students.forEach(function(s){ byName[s.no + '|' + s.name] = s; });
        d.students = rows.map(function(r){ return byName[r[0] + '|' + r[1]] || blankStudent(r[0], r[1]); });
        d.stop.watched = d.stop.watched.filter(function(id){ return d.students.some(function(s){ return s.id === id; }); });
        d.demo = false;
      });
    },
    student: function(id){ for(var i = 0; i < data.students.length; i++) if(data.students[i].id === id) return data.students[i]; return null; },
    now: nowISO,
    // who is using this device (in SYNCED mode this comes from the team list after sign-in)
    me: function(){ try{ return JSON.parse(localStorage.getItem(ME_KEY) || 'null'); }catch(e){ return null; } },
    setMe: function(me){ try{ if(me) localStorage.setItem(ME_KEY, JSON.stringify(me)); else localStorage.removeItem(ME_KEY); }catch(e){} },
    // sync status for the top bar
    status: function(){ return REMOTE ? Sync.status() : { mode: 'local' }; },
    ready: Promise.resolve(),
    needsSignIn: function(){ return false; },
    signIn: function(){ return Promise.reject(new Error('Not connected to Supabase')); },
    signOut: function(){ return Promise.resolve(); }
  };

  // Turns a stored student into the record shape scoring.js expects.
  Store.toRec = function(s){
    var r = {}; for(var k in s) r[k] = s[k];
    r.student_no = s.no; r.session_date = data.session.date;
    var st = s.stop || [];
    r.stop_yes = st.filter(function(v){ return v === 'Y'; }).length;
    r.stop_no = st.filter(function(v){ return v === 'N'; }).length;
    return r;
  };

  // =====================================================================
  // SYNCED mode
  // =====================================================================
  var Sync = (function(){
    if(!REMOTE) return null;
    var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'wehelp-auth' } });
    var outbox = []; try{ outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]'); }catch(e){}
    var st = { online: navigator.onLine, flushing: false, lastSync: null, error: null, user: null, member: null, loaded: false };
    var version = 0, retryT = null, refreshT = null, realtime = null;

    function saveOutbox(){ try{ localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); }catch(e){} }
    function setStatus(p){ for(var k in p) st[k] = p[k]; emit('status'); }

    // ---- data object ⇄ rows ----
    function studentRow(s, sessionId){
      var row = { id: s.id, session_id: sessionId, student_no: s.no, first_name: s.name, watched: data.stop.watched.indexOf(s.id) >= 0, meta: {} };
      SCORE_FIELDS.forEach(function(f){ if(s[f] !== undefined) row[f] = s[f]; });
      Object.keys(s).forEach(function(k){ if(['id', 'no', 'name', 'stop'].indexOf(k) < 0 && SCORE_FIELDS.indexOf(k) < 0) row.meta[k] = s[k]; });
      return row;
    }
    function fromRows(sess, studs, marks, logs){
      var d = {
        v: 1, demo: !!sess.demo,
        session: { id: sess.id, date: sess.date, site: sess.site, className: sess.class_name, teacher: sess.teacher || '' },
        students: [], stop: { watched: [], turn: sess.stop_turn, turns: sess.stop_turns },
        activity: null,
        levelLog: logs.map(function(l){ return { id: l.id, at: l.at, by: l.by_name || '', level: l.level, recommended: l.recommended, source: l.source, reason: l.reason || '' }; }),
        updated_at: sess.updated_at
      };
      studs.forEach(function(r){
        var s = { id: r.id, no: r.student_no, name: r.first_name, stop: [] };
        SCORE_FIELDS.forEach(function(f){ if(r[f] !== null && r[f] !== undefined) s[f] = r[f]; });
        if(!s.a1_missed) s.a1_missed = []; if(!s.zero_notes) s.zero_notes = {};
        var m = r.meta || {}; for(var k in m) s[k] = m[k];
        if(r.watched) d.stop.watched.push(r.id);
        d.students.push(s);
      });
      var byId = {}; d.students.forEach(function(s){ byId[s.id] = s; });
      marks.forEach(function(m){ var s = byId[m.student_id]; if(!s) return; while(s.stop.length < m.turn) s.stop.push(null); s.stop[m.turn - 1] = m.value; });
      d.students.sort(function(a, b){ return a.no - b.no; });
      d.activity = sess.activity; fixActivity(d);
      return d;
    }

    // ---- what changed → queued writes ----
    function enqueue(op){
      // merge into a waiting patch for the same row, so a typed note becomes one write
      if(op.k === 'patch'){
        for(var i = outbox.length - 1; i >= 0; i--){
          var o = outbox[i];
          if(o.t === op.t && o.id === op.id && o.k === 'patch' && !o.sending){ for(var f in op.p) o.p[f] = op.p[f]; saveOutbox(); return; }
          if(o.t === op.t && o.id === op.id) break;
        }
      }
      outbox.push(op); saveOutbox();
    }
    function diff(a, b){
      version++;
      var sid = b.session.id;
      if(!sid){ return; }   // not loaded yet: the change stays in the cache and is written on the next load
      var sp = {};
      if(a.session.teacher !== b.session.teacher) sp.teacher = b.session.teacher;
      if(a.stop.turn !== b.stop.turn) sp.stop_turn = b.stop.turn;
      if(a.stop.turns !== b.stop.turns) sp.stop_turns = b.stop.turns;
      if(a.demo !== b.demo) sp.demo = b.demo;
      if(!same(a.activity, b.activity)) sp.activity = b.activity;
      if(Object.keys(sp).length){ sp.updated_at = nowISO(); enqueue({ t: 'sessions', k: 'patch', id: sid, p: sp }); }

      var A = {}; a.students.forEach(function(s){ A[s.id] = s; });
      var B = {}; b.students.forEach(function(s){ B[s.id] = s; });
      a.students.forEach(function(s){ if(!B[s.id]) enqueue({ t: 'students', k: 'delete', id: s.id }); });
      b.students.forEach(function(s){
        var old = A[s.id], wOld = a.stop.watched.indexOf(s.id) >= 0, wNew = b.stop.watched.indexOf(s.id) >= 0;
        if(!old){ var row = studentRow(s, sid); row.updated_at = nowISO(); enqueue({ t: 'students', k: 'insert', id: s.id, row: row });
          (s.stop || []).forEach(function(v, i){ if(v) enqueue(markOp(s.id, sid, i + 1, v)); }); return; }
        var p = {}, ro = studentRow(old, sid), rn = studentRow(s, sid);
        if(rn.student_no !== ro.student_no) p.student_no = rn.student_no;
        if(rn.first_name !== ro.first_name) p.first_name = rn.first_name;
        if(wOld !== wNew) p.watched = wNew;
        SCORE_FIELDS.forEach(function(f){ var x = ro[f] === undefined ? null : ro[f], y = rn[f] === undefined ? null : rn[f]; if(!same(x, y)) p[f] = y; });
        if(!same(ro.meta, rn.meta)) p.meta = rn.meta;
        if(Object.keys(p).length){ p.updated_at = nowISO(); enqueue({ t: 'students', k: 'patch', id: s.id, p: p }); }
        var so = old.stop || [], sn = s.stop || [], n = Math.max(so.length, sn.length);
        for(var i = 0; i < n; i++){ if((so[i] || null) !== (sn[i] || null)) enqueue(markOp(s.id, sid, i + 1, sn[i] || null)); }
      });
      var seen = {}; a.levelLog.forEach(function(l){ if(l.id) seen[l.id] = 1; });
      b.levelLog.forEach(function(l){ if(!l.id) l.id = uuid(); if(!seen[l.id]) enqueue({ t: 'level_log', k: 'insert', id: l.id,
        row: { id: l.id, session_id: sid, at: l.at, by_name: l.by || null, level: l.level, recommended: l.recommended || null, source: l.source, reason: l.reason || null } }); });
    }
    function markOp(studentId, sid, turn, value){
      return value ? { t: 'stop_marks', k: 'upsert', id: studentId + ':' + turn, row: { student_id: studentId, session_id: sid, turn: turn, value: value, recorded_by: (Store.me() || {}).name || null, at: nowISO() } }
                   : { t: 'stop_marks', k: 'delete', id: studentId + ':' + turn, row: { student_id: studentId, turn: turn } };
    }

    // ---- send queued writes, in order ----
    function isNetworkError(err){ return !err.code && !err.status || /fetch|network|timeout|Load failed/i.test(err.message || ''); }
    function send(op){
      var q;
      if(op.t === 'sessions') q = sb.from('sessions').update(op.p).eq('id', op.id);
      else if(op.t === 'students' && op.k === 'insert') q = sb.from('students').upsert(op.row);
      else if(op.t === 'students' && op.k === 'patch') q = sb.from('students').update(op.p).eq('id', op.id);
      else if(op.t === 'students' && op.k === 'delete') q = sb.from('students').delete().eq('id', op.id);
      else if(op.t === 'stop_marks' && op.k === 'upsert') q = sb.from('stop_marks').upsert(op.row);
      else if(op.t === 'stop_marks' && op.k === 'delete') q = sb.from('stop_marks').delete().match(op.row);
      else if(op.t === 'level_log') q = sb.from('level_log').insert(op.row);   // append-only table: plain insert
      else return Promise.resolve({ error: null });
      return q.then(function(r){ return r; }, function(e){ return { error: e }; });
    }
    function flush(){
      if(st.flushing || !st.user || !data.session.id) return;
      if(!outbox.length){ return; }
      setStatus({ flushing: true });
      (function step(){
        if(!outbox.length){ setStatus({ flushing: false, lastSync: nowISO(), online: true, error: null }); scheduleRefresh(50); return; }
        var op = outbox[0]; op.sending = true;
        send(op).then(function(r){
          op.sending = false;
          if(r.error && r.error.code === '23505') r.error = null;   // already saved (sent twice after a dropped connection)
          if(r.error){
            if(isNetworkError(r.error)){ setStatus({ flushing: false, online: false }); saveOutbox(); clearTimeout(retryT); retryT = setTimeout(flush, 4000); return; }
            console.error('Write rejected', op, r.error); setStatus({ error: (r.error.message || 'A change was rejected') + ' (' + op.t + ')' });
          }
          outbox.shift(); saveOutbox(); emit('status'); step();
        });
      })();
    }

    // ---- load everything for the session (also used to reconcile after writes and realtime events) ----
    function refresh(){
      if(!st.user) return Promise.resolve();
      if(outbox.length || st.flushing){ scheduleRefresh(800); return Promise.resolve(); }
      var v0 = version;
      return ensureSession().then(function(sess){
        if(!sess) return;
        return Promise.all([
          sb.from('students').select('*').eq('session_id', sess.id),
          sb.from('stop_marks').select('*').eq('session_id', sess.id),
          sb.from('level_log').select('*').eq('session_id', sess.id).order('at')
        ]).then(function(r){
          var err = r[0].error || r[1].error || r[2].error; if(err) throw err;
          if(version !== v0 || outbox.length){ scheduleRefresh(500); return; }   // a newer local change exists: try again after it is sent
          var d = fromRows(sess, r[0].data, r[1].data, r[2].data);
          var changed = !same(stripTs(d), stripTs(data));
          data = d; persist(); setStatus({ online: true, loaded: true, lastSync: nowISO() });
          if(changed) emit('remote');
          subscribe(sess.id);
        });
      }).catch(function(e){ if(isNetworkError(e)) setStatus({ online: false }); else setStatus({ error: e.message }); });
    }
    function stripTs(d){ var c = clone(d); delete c.updated_at; return c; }
    function scheduleRefresh(ms){ clearTimeout(refreshT); refreshT = setTimeout(refresh, ms); }
    function ensureSession(){
      return sb.from('sessions').select('*').eq('date', SESSION_DATE).limit(1).then(function(r){
        if(r.error) throw r.error;
        if(r.data && r.data[0]) return r.data[0];
        return sb.from('sessions').insert({ date: SESSION_DATE }).select().single().then(function(r2){ if(r2.error) throw r2.error; return r2.data; });
      });
    }
    function subscribe(sessionId){
      if(realtime) return;
      realtime = sb.channel('db-' + sessionId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: 'session_id=eq.' + sessionId }, function(){ scheduleRefresh(250); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stop_marks', filter: 'session_id=eq.' + sessionId }, function(){ scheduleRefresh(250); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'level_log', filter: 'session_id=eq.' + sessionId }, function(){ scheduleRefresh(250); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: 'id=eq.' + sessionId }, function(){ scheduleRefresh(250); })
        .subscribe(function(s){ if(s === 'SUBSCRIBED') scheduleRefresh(100); });
    }

    // ---- auth ----
    function afterAuth(user){
      if(!user){ setStatus({ user: null, member: null }); return Promise.resolve(); }
      setStatus({ user: user });
      try{ sb.realtime.setAuth(); }catch(e){}
      return sb.from('members').select('name, role').eq('user_id', user.id).maybeSingle().then(function(r){
        var m = r.data || null;
        setStatus({ member: m, error: m ? null : 'This account isn’t on the team list yet.' });
        if(m) Store.setMe({ name: m.name, role: m.role });
        if(m && m.role !== 'board'){ flush(); return refresh(); }
      }, function(){ setStatus({ online: false }); });
    }
    Store.ready = sb.auth.getSession().then(function(r){ return afterAuth(r.data && r.data.session ? r.data.session.user : null); }).catch(function(){}).then(function(){ setStatus({ ready: true }); });
    sb.auth.onAuthStateChange(function(ev, session){ if(ev === 'SIGNED_OUT'){ setStatus({ user: null, member: null }); } if(ev === 'TOKEN_REFRESHED' && session){ try{ sb.realtime.setAuth(session.access_token); }catch(e){} } });
    Store.needsSignIn = function(){ return !st.user; };
    Store.signIn = function(email, password){
      return sb.auth.signInWithPassword({ email: email, password: password }).then(function(r){ if(r.error) throw r.error; return afterAuth(r.data.user); });
    };
    Store.signOut = function(){
      if(outbox.length && !confirm(outbox.length + ' change(s) have not been sent yet. Sign out anyway? They stay on this device and are sent at the next sign-in.')) return Promise.resolve(false);
      if(realtime){ sb.removeChannel(realtime); realtime = null; }
      Store.setMe(null);
      return sb.auth.signOut().then(function(){ return true; });
    };
    Store.member = function(){ return st.member; };
    Store.client = sb;

    window.addEventListener('online', function(){ setStatus({ online: true }); flush(); scheduleRefresh(300); });
    window.addEventListener('offline', function(){ setStatus({ online: false }); });
    setInterval(function(){ if(outbox.length) flush(); }, 15000);

    return {
      diff: diff, flush: flush, refresh: refresh, client: sb,
      status: function(){ return { mode: 'synced', ready: !!st.ready, online: st.online, pending: outbox.length, flushing: st.flushing, lastSync: st.lastSync, error: st.error, signedIn: !!st.user, member: st.member, loaded: st.loaded }; }
    };
  })();

  // =====================================================================
  // Board link (portal side)
  // =====================================================================
  var chan = null; try{ chan = new BroadcastChannel('wehelp-board'); }catch(e){}
  var rt = null;
  var boardSubs = [], boardState = null, boardSeen = 0, lastJSON = '';
  function onBoardMsg(m){
    if(!m || m.type !== 'state') return;
    var j = JSON.stringify(m.state), wasOff = !Store.board.connected(); boardSeen = Date.now();
    if(j === lastJSON && !wasOff) return; lastJSON = j; boardState = m.state;
    boardSubs.forEach(function(fn){ fn(boardState); });
  }
  if(chan) chan.onmessage = function(e){ onBoardMsg(e.data || {}); };
  function boardChannel(){
    if(!REMOTE || rt || !Store.status().signedIn) return rt;
    rt = Sync.client.channel('board-' + SESSION_DATE, { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'state' }, function(m){ onBoardMsg({ type: 'state', state: m.payload }); })
      .subscribe(function(s){ if(s === 'SUBSCRIBED') rt.send({ type: 'broadcast', event: 'hello', payload: {} }); });
    return rt;
  }
  if(REMOTE) Store.subscribe(function(d, src){ if(src === 'status') boardChannel(); });
  Store.board = {
    send: function(cmd){
      var args = [].slice.call(arguments, 1), msg = { type: 'cmd', cmd: cmd, args: args };
      if(chan) chan.postMessage(msg);
      var c = boardChannel(); if(c) c.send({ type: 'broadcast', event: 'cmd', payload: msg });
    },
    state: function(){ return boardState; },
    connected: function(){ return !!boardState && Date.now() - boardSeen < 15000; },
    subscribe: function(fn){ boardSubs.push(fn); },
    ping: function(){ if(chan) chan.postMessage({ type: 'hello' }); var c = boardChannel(); if(c) c.send({ type: 'broadcast', event: 'hello', payload: {} }); }
  };

  window.WeHelpStore = Store;
})();
