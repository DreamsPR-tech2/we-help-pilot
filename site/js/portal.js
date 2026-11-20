/* We Help! teacher portal.
 * Sections: Lesson (drives the board) · Screen (1-to-1 quick check + second screen) · Stop check · Results · Setup.
 * Data: WeHelpStore (local for now, Supabase in Phase 4). Rules: WeHelpScoring. Students never see this screen
 * except the full-screen card mat.
 */
(function(){
  var S = window.WeHelpScoring, St = window.WeHelpStore, ITEMS = window.WEHELP_ITEMS, CARDS = window.WEHELP_CARDS, C = window.WEHELP;
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function given(v){ return v !== null && v !== undefined && v !== ''; }
  var app = $('#app');

  var ROLES = [
    { id: 'lead',     label: 'Lesson lead',       home: 'lesson' },
    { id: 'screener', label: 'Screener',          home: 'screen' },
    { id: 'teacher',  label: 'Classroom teacher', home: 'stop' },
    { id: 'tech',     label: 'Tech support',      home: 'results' }
  ];
  var TABS = [['lesson', 'Lesson'], ['screen', 'Screen'], ['stop', 'Stop check'], ['results', 'Results'], ['setup', 'Setup']];
  var ZERO_REASONS = ['Distracted', 'Did not want to take part', 'Did not seem to understand', 'Upset or tired'];
  var STEP_WRAP = 6, STEP_SUM = 7;   // screen steps: 0–4 items 1–5, 5 bonus, 6 mode & engagement, 7 summary

  function me(){ return St.me(); }
  function data(){ return St.get(); }
  function students(){ return data().students.slice().sort(function(a, b){ return a.no - b.no; }); }
  function result(s){ return S.student(St.toRec(s)); }
  function summary(){ return S.classSummary(students().map(St.toRec)); }
  function toast(msg){ var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2200); }
  function levelPill(L){ return L ? '<span class="pill lv' + L + '">Level ' + L + '</span>' : ''; }
  function fmtSecs(ms){ var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  // ---------- routing ----------
  function route(){ var h = location.hash.replace(/^#/, '').split('/'); return { tab: h[0] || '', id: h[1] || null, step: h[2] != null ? +h[2] : null }; }
  function go(hash){ if(location.hash === '#' + hash) render(); else location.hash = hash; }
  addEventListener('hashchange', render);

  // ---------- top bar ----------
  function renderTop(tab){
    var re = summary().rescreen_list.length;
    $('#tabs').innerHTML = TABS.map(function(t){
      var on = t[0] === tab || (tab === 'rescreen' && t[0] === 'screen');
      return '<a href="#' + t[0] + '" class="' + (on ? 'on' : '') + '">' + t[1] + (t[0] === 'screen' && re ? ' <span class="badge" title="Second screen">' + re + '</span>' : '') + '</a>';
    }).join('');
    var m = St.mode === 'synced' ? (St.member && St.member()) : me();
    $('#meBtn').innerHTML = m ? esc(m.name) + '<span class="role"> · ' + esc((ROLES.filter(function(r){ return r.id === m.role; })[0] || {}).label) + '</span>' : 'Sign in';
    $('#demoBar').hidden = !data().demo;
    renderSync();
  }
  function renderSync(){
    var st = St.status(), el = $('#sync');
    if(!el){ el = document.createElement('span'); el.id = 'sync'; $('.top').insertBefore(el, $('#meBtn')); }
    if(st.mode === 'local'){ el.className = 'sync local'; el.textContent = 'This device only'; el.title = 'Not connected to Supabase. Data stays on this device.'; return; }
    var txt, cls;
    if(!st.signedIn){ txt = 'Signed out'; cls = 'off'; }
    else if(st.error){ txt = 'Sync problem'; cls = 'err'; }
    else if(!st.online){ txt = 'Offline' + (st.pending ? ' · ' + st.pending + ' waiting' : ''); cls = 'off'; }
    else if(st.pending){ txt = 'Saving ' + st.pending + '…'; cls = 'busy'; }
    else { txt = 'Synced'; cls = 'ok'; }
    el.className = 'sync ' + cls; el.textContent = txt;
    el.title = (st.error ? st.error + '\n' : '') + (st.lastSync ? 'Last synced ' + new Date(st.lastSync).toLocaleTimeString() : '') + (st.pending ? '\nChanges are saved on this iPad and will be sent when the connection is back.' : '');
  }
  $('#meBtn').onclick = function(){ go('signin'); };

  // ---------- sign in (per device) ----------
  function viewSignin(){
    if(St.mode === 'synced' && St.needsSignIn()) return viewAccount();
    if(St.mode === 'synced'){ var mem = St.member && St.member();
      app.innerHTML = '<div class="card stack" style="max-width:520px;margin:20px auto"><h2>' + (mem ? 'Signed in as ' + esc(mem.name) : 'Not on the team list') + '</h2>'
        + (mem && mem.role === 'board' ? '<p>This is the board account. Use it on the classroom TV only. Sign in here with your own account.</p>' : mem ? '<p class="muted">Role: ' + esc((ROLES.filter(function(r){ return r.id === mem.role; })[0] || {}).label || mem.role) + '. Your name and role come from the team list in Supabase.</p>' : '<p>This account can sign in but isn’t in the team list yet. Ask Madeline to add it.</p>')
        + '<div class="row">' + (mem && mem.role !== 'board' ? '<button class="btn pri" type="button" id="goHome">Continue</button>' : '') + '<button class="btn" type="button" id="outBtn">Sign out</button></div></div>';
      if($('#goHome')) $('#goHome').onclick = function(){ go(homeOf(me())); };
      $('#outBtn').onclick = function(){ St.signOut().then(function(ok){ if(ok !== false) render(); }); };
      return; }
    var m = me() || {};
    app.innerHTML = '<div class="card stack" style="max-width:520px;margin:20px auto">'
      + '<h2>Who is using this iPad?</h2><p class="muted small" style="margin:0">Your name is saved with every score you record. You can change it any time from the top bar.</p>'
      + '<label class="f">Your name<input type="text" id="meName" value="' + esc(m.name || '') + '" placeholder="e.g. Cari" autocomplete="off"></label>'
      + '<div class="f" style="font-weight:600;color:var(--navy);font-size:14px">Your role</div><div class="chips" id="meRole">'
      + ROLES.map(function(r){ return '<button type="button" class="chip' + (m.role === r.id ? ' on' : '') + '" data-r="' + r.id + '">' + r.label + '</button>'; }).join('') + '</div>'
      + '<button class="btn pri big" id="meSave" type="button">Continue</button></div>';
    var role = m.role || null;
    $('#meRole').onclick = function(e){ var b = e.target.closest('[data-r]'); if(!b) return; role = b.dataset.r; $$('#meRole .chip').forEach(function(c){ c.classList.toggle('on', c === b); }); };
    $('#meSave').onclick = function(){ var n = $('#meName').value.trim(); if(!n || !role){ toast('Add your name and pick a role'); return; }
      St.setMe({ name: n, role: role }); go(ROLES.filter(function(r){ return r.id === role; })[0].home); };
  }

  function homeOf(m){ var r = m && ROLES.filter(function(x){ return x.id === m.role; })[0]; return r ? r.home : 'signin'; }
  function viewAccount(){
    app.innerHTML = '<form class="card stack" id="acct" style="max-width:440px;margin:20px auto">'
      + '<h2>Sign in</h2><p class="muted small" style="margin:0">Use your DREAMS team account. This iPad stays signed in for the pilot.</p>'
      + '<label class="f">Email<input type="email" name="e" autocomplete="username" required></label>'
      + '<label class="f">Password<input type="password" name="p" autocomplete="current-password" required style="width:100%;border:2px solid var(--line);border-radius:10px;padding:9px 11px;font-size:16px"></label>'
      + '<span id="acctErr" class="small" style="color:var(--red);min-height:18px"></span>'
      + '<button class="btn pri big" type="submit">Sign in</button></form>';
    $('#acct').onsubmit = function(e){
      e.preventDefault(); var f = e.target, b = f.querySelector('button'); b.disabled = true; $('#acctErr').textContent = '';
      St.signIn(f.e.value.trim(), f.p.value).then(function(){
        var mem = St.member(); if(mem && mem.role !== 'board') go(homeOf(me())); else render();
      }, function(err){ b.disabled = false; $('#acctErr').textContent = err.message || 'Could not sign in'; });
    };
  }

  // =====================================================================
  // SCREEN: roster
  // =====================================================================
  function status(s){
    var r = result(s), started = ['a1','a2','a3','a4','a5'].some(function(k){ return given(s[k]); });
    if(!r.complete) return started ? { cls: 'part', pill: '<span class="pill wait">In progress · ' + (5 - r.missing.length) + ' of 5</span>' } : { cls: '', pill: '<span class="pill wait">Not screened</span>' };
    var p = '<span class="pill">' + r.start_total + '/15</span>' + levelPill(r.start_level);
    if(r.rescreen_needed) p += r.rescreen_done ? '<span class="pill ok">2nd screen ' + (r.growth >= 0 ? '+' : '') + r.growth + '</span>' : '<span class="pill re">2nd screen: ' + r.flagged_items.length + ' items</span>';
    return { cls: r.rescreen_needed && !r.rescreen_done ? 'flag' : 'done', pill: p };
  }
  function viewRoster(){
    var sm = summary(), list = students();
    var order = S.pickerOrder(list.map(St.toRec)).filter(function(i){ return sm.students[i].rescreen_needed && sm.students[i].complete; });
    app.innerHTML = '<div class="stack">'
      + '<div class="spread"><h2>Quick check</h2><div class="row"><span class="pill">' + sm.screened + ' of ' + list.length + ' screened</span>'
      + (sm.class_level ? '<span class="pill">Class level so far</span>' + levelPill(sm.class_level) : '') + '</div></div>'
      + '<div class="roster">' + list.map(function(s){ var st = status(s);
          return '<button type="button" class="stu ' + st.cls + '" data-id="' + s.id + '"><span class="no">#' + s.no + '</span><b>' + esc(s.name) + '</b><span class="row" style="gap:5px">' + st.pill + '</span></button>'; }).join('') + '</div>'
      + '<div class="card stack"><div class="spread"><h3>Second screen</h3><span class="muted small">Level 1 or 2 students, items scored 0 or 1 only</span></div>'
      + (order.length ? '<div class="chips">' + order.map(function(i){ var s = list[i], r = sm.students[i];
          return '<button type="button" class="btn' + (r.rescreen_done ? ' ghost' : '') + '" data-re="' + s.id + '">' + (r.rescreen_done ? '✓ ' : '') + esc(s.name) + ' · items ' + r.flagged_items.join(', ') + '</button>'; }).join('') + '</div>'
        : '<p class="muted small" style="margin:0">Nobody needs a second screen yet.</p>')
      + '</div></div>';
    app.onclick = function(e){
      var b = e.target.closest('[data-id]'); if(b){ var s = St.student(b.dataset.id), r = result(s); go('screen/' + s.id + '/' + (r.complete ? STEP_SUM : firstOpenStep(s))); return; }
      var re = e.target.closest('[data-re]'); if(re){ go('rescreen/' + re.dataset.re + '/0'); }
    };
  }
  function firstOpenStep(s){ for(var i = 0; i < 5; i++) if(!given(s[ITEMS[i].key])) return i; return 5; }

  // =====================================================================
  // SCREEN: one student, one item per screen
  // =====================================================================
  function a1FromMissed(missed){ var c = 5 - missed.length; return c === 5 ? 3 : c >= 3 ? 2 : c >= 1 ? 1 : 0; }
  function setField(id, fn){ St.update(function(d){ var s = d.students.filter(function(x){ return x.id === id; })[0]; if(s){ fn(s); s.recorded_by = (me() || {}).name || ''; } }); }

  function viewScreen(id, step, re){
    var s = St.student(id); if(!s){ go('screen'); return; }
    var r = result(s);
    var items = re ? r.flagged_items.map(function(n){ return ITEMS[n - 1]; }) : ITEMS;
    var last = re ? items.length : STEP_SUM;
    if(step == null || isNaN(step)) step = 0;
    if(!re && !s.started_at) setField(id, function(x){ x.started_at = St.now(); });
    if(re && !s.re_started_at) setField(id, function(x){ x.re_started_at = St.now(); });
    s = St.student(id);

    var dots = items.map(function(it, i){
      var k = re ? 'r' + it.n : it.key, v = s[k], cls = i === step ? 'cur' : given(v) ? 'done' : '';
      return '<button type="button" data-step="' + i + '" class="' + cls + '" aria-label="Item ' + it.n + '">' + (it.n === 'bonus' ? '★' : it.n) + '</button>';
    }).join('') + (re ? '' : '<button type="button" data-step="' + STEP_WRAP + '" class="' + (step === STEP_WRAP ? 'cur' : given(s.response_mode) && given(s.engaged) ? 'done' : '') + '" aria-label="Mode and engagement">✎</button>');

    var head = '<div class="scr-top"><button class="btn ghost" type="button" data-nav="roster">← Roster</button><span class="who">' + esc(s.name) + '</span>'
      + (re ? '<span class="pill re">Second screen</span>' : '') + '<span class="clock" id="clock"></span></div>'
      + '<div class="steps">' + dots + '</div>';

    var body;
    if(step < items.length) body = itemView(s, items[step], re);
    else if(!re && step === STEP_WRAP) body = wrapView(s);
    else body = re ? reSummaryView(s) : summaryView(s);

    app.innerHTML = '<div class="stack">' + head + '<div class="card">' + body + '</div></div>';
    startClock(s, re);

    app.onclick = function(e){
      var t = e.target, b;
      if((b = t.closest('[data-nav="roster"]'))){ go('screen'); return; }
      if((b = t.closest('[data-step]'))){ go((re ? 'rescreen/' : 'screen/') + id + '/' + b.dataset.step); return; }
      if((b = t.closest('[data-score]'))){ score(s, items[step], re, +b.dataset.score, step); return; }
      if((b = t.closest('[data-miss]'))){ var w = b.dataset.miss; setField(id, function(x){ var m = (x.a1_missed || []).slice(); var i = m.indexOf(w); if(i >= 0) m.splice(i, 1); else m.push(w); x.a1_missed = S.BIG5.filter(function(v){ return m.indexOf(v) >= 0; }); x.a1 = a1FromMissed(x.a1_missed); }); render(); return; }
      if((b = t.closest('[data-reason]'))){ var key = b.dataset.key; setField(id, function(x){ x.zero_notes = x.zero_notes || {}; x.zero_notes[key] = b.dataset.reason; }); render(); return; }
      if((b = t.closest('[data-next]'))){ nextStep(id, step, re, last); return; }
      if((b = t.closest('[data-prev]'))){ if(step > 0) go((re ? 'rescreen/' : 'screen/') + id + '/' + (step - 1)); return; }
      if((b = t.closest('[data-skip]'))){ setField(id, function(x){ x.bonus = null; }); go('screen/' + id + '/' + STEP_WRAP); return; }
      if((b = t.closest('[data-mode]'))){ setField(id, function(x){ x.response_mode = x.response_mode === b.dataset.mode ? null : b.dataset.mode; }); render(); return; }
      if((b = t.closest('[data-eng]'))){ setField(id, function(x){ x.engaged = b.dataset.eng === 'yes'; }); render(); return; }
      if((b = t.closest('[data-save]'))){ saveScreen(id); return; }
      if((b = t.closest('[data-mat]'))){ openMat(b.dataset.mat.split(',')); return; }
      if((b = t.closest('.wait5'))){ b.classList.remove('run', 'end'); void b.offsetWidth; b.classList.add('run'); clearTimeout(b._t); b._t = setTimeout(function(){ b.classList.add('end'); }, 5000); return; }
      if((b = t.closest('[data-nextstu]'))){ var nx = nextUnscreened(id); go(nx ? 'screen/' + nx + '/0' : 'screen'); return; }
      if((b = t.closest('[data-startre]'))){ go('rescreen/' + id + '/0'); return; }
    };
    app.oninput = function(e){
      var t = e.target;
      if(t.dataset.note){ var key = t.dataset.note, v = t.value; setField(id, function(x){ x.zero_notes = x.zero_notes || {}; x.zero_notes[key] = v; }); }
      if(t.id === 'engNote'){ var v2 = t.value; setField(id, function(x){ x.engagement_note = v2; }); }
    };
  }

  function itemView(s, it, re){
    var k = re ? 'r' + it.n : it.key, v = s[k], noteKey = k;
    var startV = re ? s[it.key] : null;
    var h = '<div class="item"><div class="area">' + (it.n === 'bonus' ? 'Bonus' : 'Item ' + it.n) + ' · ' + esc(it.area)
      + (it.draft ? '<span class="draft">draft wording</span>' : '') + (re ? ' <span class="pill">started at ' + startV + '</span>' : '') + '</div>'
      + '<div class="show"><b>Show:</b> ' + esc(it.show) + '</div><div class="say">' + esc(it.say) + '</div>'
      + '<div class="row"><button type="button" class="btn wait5"><i></i>⏱ Wait 5 s</button><button type="button" class="btn" data-mat="' + it.mat.join(',') + '">▣ Card mat</button></div>';
    if(it.n === 1){
      var miss = re ? (s.r1_missed || []) : (s.a1_missed || []);
      h += re ? '' : '<div class="missed"><b>Tap the words missed</b><div class="chips">' + S.BIG5.map(function(w){ return '<button type="button" class="chip miss' + (miss.indexOf(w) >= 0 ? ' on' : '') + '" data-miss="' + w + '">' + w + '</button>'; }).join('') + '</div>'
        + '<span class="muted small">' + (5 - miss.length) + ' of 5 correct. The score below follows; tap 0 for no response.</span></div>';
    }
    h += '<div class="scores">' + it.rubric.map(function(txt, i){ return '<button type="button" class="sc' + (v === i ? ' on' : '') + '" data-s="' + i + '" data-score="' + i + '"><b>' + i + '</b><span>' + esc(txt) + '</span></button>'; }).join('') + '</div>';
    if(v === 0){
      var note = (s.zero_notes || {})[noteKey] || '';
      h += '<div class="zero"><b>If 0, why?</b><div class="chips">' + ZERO_REASONS.map(function(rz){ return '<button type="button" class="chip' + (note === rz ? ' on' : '') + '" data-reason="' + esc(rz) + '" data-key="' + noteKey + '">' + rz + '</button>'; }).join('') + '</div>'
        + '<input type="text" data-note="' + noteKey + '" value="' + esc(note) + '" placeholder="Or type a short note"></div>';
    }
    h += '<div class="navrow"><button type="button" class="btn" data-prev>← Back</button>'
      + (it.optional ? '<button type="button" class="btn ghost" data-skip>Skip bonus</button>' : '')
      + '<button type="button" class="btn pri big" data-next' + (given(v) || it.optional ? '' : ' disabled') + '>Next →</button></div></div>';
    return h;
  }

  function score(s, it, re, val, step){
    var k = re ? 'r' + it.n : it.key, id = s.id;
    setField(id, function(x){ x[k] = val; if(val !== 0 && x.zero_notes) delete x.zero_notes[k]; if(re) x['r' + it.n + '_at'] = St.now(); });
    // auto-advance on 1–3 (a 0 waits for the note; item 1 waits for the missed words)
    if(val !== 0 && it.n !== 1){ render(); setTimeout(function(){ var r2 = route(); if(r2.id === id && r2.step === step) nextStep(id, step, re, re ? result(St.student(id)).flagged_items.length : STEP_SUM); }, 380); }
    else render();
  }
  function nextStep(id, step, re, last){
    var n = step + 1; if(n > last) n = last;
    go((re ? 'rescreen/' : 'screen/') + id + '/' + n);
  }

  function wrapView(s){
    var miss = S.missingItems(St.toRec(s));
    return '<div class="item"><div class="area">Before you save</div>'
      + '<h3>Main response mode</h3><div class="chips">' + S.RESPONSE_MODES.map(function(m){ return '<button type="button" class="chip' + (s.response_mode === m ? ' on' : '') + '" data-mode="' + m + '">' + m + '</button>'; }).join('') + '</div>'
      + '<h3>Motivated and engaged?</h3><div class="row"><button type="button" class="btn' + (s.engaged === true ? ' on' : '') + '" data-eng="yes">Yes</button><button type="button" class="btn' + (s.engaged === false ? ' on' : '') + '" data-eng="no">No</button></div>'
      + '<input type="text" id="engNote" value="' + esc(s.engagement_note || '') + '" placeholder="One-line note (students never see this)">'
      + (miss.length ? '<div class="zero"><b>Still missing: item ' + miss.join(', ') + '</b><span class="small">A missing item is not a zero. Score it, or leave the screen open and come back.</span></div>' : '')
      + '<div class="navrow"><button type="button" class="btn" data-prev>← Back</button><button type="button" class="btn pri big" data-save' + (miss.length ? ' disabled' : '') + '>Save screen</button></div></div>';
  }
  function saveScreen(id){
    var s = St.student(id), miss = S.missingItems(St.toRec(s));
    if(miss.length){ toast('Score item ' + miss.join(', ') + ' first'); return; }
    setField(id, function(x){ x.finished_at = St.now(); x.screened_by = (me() || {}).name || ''; });
    go('screen/' + id + '/' + STEP_SUM);
  }
  function nextUnscreened(id){ var l = students(); for(var i = 0; i < l.length; i++){ if(l[i].id !== id && !result(l[i]).complete) return l[i].id; } return null; }

  function flagText(r){ return r.flags.length ? '<div class="reco">' + r.flags.map(function(f){ return '<div>' + esc(S.FLAGS[f]) + '</div>'; }).join('') + '</div>' : ''; }
  function summaryView(s){
    var r = result(s);
    if(!r.complete) return '<p>This screen isn’t finished. Missing item ' + r.missing.join(', ') + '.</p><button class="btn pri" type="button" data-step="' + firstOpenStep(s) + '">Continue screen</button>';
    var dur = s.started_at && s.finished_at ? new Date(s.finished_at) - new Date(s.started_at) : null;
    return '<div class="stack"><h2>' + esc(s.name) + ' · saved</h2><div class="sumbox">'
      + '<div class="stat"><small>Total</small><b>' + r.start_total + '<small> / 15</small></b></div>'
      + '<div class="stat"><small>Target (8+)</small><b>' + (r.target_met ? 'Met' : 'Not yet') + '</b></div>'
      + '<div class="stat"><small>Level</small><b>' + r.start_level + '</b></div>'
      + (given(s.bonus) ? '<div class="stat"><small>Bonus</small><b>' + s.bonus + '<small> / 3</small></b></div>' : '')
      + (dur ? '<div class="stat"><small>Time</small><b>' + fmtSecs(dur) + '</b></div>' : '') + '</div>'
      + flagText(r)
      + (r.rescreen_needed ? '<p class="small muted" style="margin:0">Second screen later on item ' + r.flagged_items.join(', ') + '.</p>' : '')
      + '<div class="navrow"><button type="button" class="btn" data-step="0">Edit scores</button><button type="button" class="btn pri big" data-nextstu>Next student →</button></div></div>';
  }
  function reSummaryView(s){
    var r = result(s);
    var rows = r.flagged_items.map(function(n){ var a = s['a' + n], b = s['r' + n];
      return '<tr><td>Item ' + n + ' · ' + esc(ITEMS[n - 1].area) + '</td><td class="n">' + a + '</td><td class="n">' + (given(b) ? b : '–') + '</td></tr>'; }).join('');
    return '<div class="stack"><h2>' + esc(s.name) + ' · second screen</h2>'
      + '<div class="tablewrap"><table class="res"><tr><th>Reassessed item</th><th>Start</th><th>Now</th></tr>' + rows + '</table></div>'
      + '<div class="sumbox"><div class="stat"><small>Start → end</small><b>' + r.start_total + ' → ' + r.end_total + '</b></div>'
      + '<div class="stat"><small>Change</small><b>' + (r.growth >= 0 ? '+' : '') + r.growth + '</b></div>'
      + '<div class="stat"><small>Level</small><b>' + r.start_level + ' → ' + r.end_level + '</b></div></div>'
      + '<p class="small muted" style="margin:0">Performance on reassessed items only. Unchanged scores are useful for tomorrow’s plan.</p>'
      + '<div class="navrow"><button type="button" class="btn" data-step="0">Edit</button><button type="button" class="btn pri big" data-nav="roster">Done</button></div></div>';
  }

  var clockT = null;
  function startClock(s, re){
    clearInterval(clockT);
    var from = re ? s.re_started_at : s.started_at, to = re ? null : s.finished_at, el = $('#clock');
    if(!el || !from) return;
    function tick(){ var ms = (to ? new Date(to) : new Date()) - new Date(from); el.textContent = '⏱ ' + fmtSecs(ms); el.classList.toggle('slow', !re && ms > 120000); }
    tick(); if(!to) clockT = setInterval(tick, 1000);
  }

  // ---------- student card mat (full screen; no words, no scores; press and hold to exit) ----------
  function openMat(keys){
    var k = keys.slice();
    for(var j = k.length - 1; j > 0; j--){ var x = Math.floor(Math.random() * (j + 1)), t = k[j]; k[j] = k[x]; k[x] = t; }
    var m = document.createElement('div'); m.id = 'mat';
    var cols = innerWidth > innerHeight * 1.2 ? k.length : k.length === 4 ? 2 : Math.min(k.length, 3);   // portrait: 2–3 per row so cards stay big
    m.innerHTML = '<div class="cards" style="--n:' + k.length + ';--cols:' + cols + '">' + k.map(function(c){ var cd = CARDS[c] || {};
      return '<div class="mc" style="--cc:' + (cd.color || '#2E86D1') + '">' + (cd.img ? '<img src="' + esc(cd.img) + '" alt="">' : '<svg viewBox="0 0 48 48">' + (cd.glyph || '') + '</svg>') + '</div>'; }).join('')
      + '</div><button type="button" class="hold"><i></i>Press and hold to close</button>';
    document.body.appendChild(m);
    try{ (m.requestFullscreen || m.webkitRequestFullscreen || function(){}).call(m); }catch(e){}
    var hold = m.querySelector('.hold'), timer = null;
    function down(e){ e.preventDefault(); hold.classList.add('down'); timer = setTimeout(close, 1200); }
    function up(){ hold.classList.remove('down'); clearTimeout(timer); }
    function close(){ try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} m.remove(); }
    hold.addEventListener('pointerdown', down); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function(ev){ hold.addEventListener(ev, up); });
  }

  // =====================================================================
  // STOP CHECK (classroom teacher)
  // =====================================================================
  var lastStopCall = 0;
  var HELP = [['help_asked', 'Asked for help'], ['help_offered', 'Offered help'], ['support', 'Used support']];
  function viewStop(){
    var d = data(), list = students(), w = d.stop.watched, turn = d.stop.turn, turns = d.stop.turns, stops = d.activity.stops;
    var watched = list.filter(function(s){ return w.indexOf(s.id) >= 0; });
    var yes = 0, no = 0, moreYes = 0, seen = 0;
    watched.forEach(function(s){ var y = 0, n = 0; (s.stop || []).forEach(function(v){ if(v === 'Y') y++; if(v === 'N') n++; }); yes += y; no += n; if(y + n){ seen++; if(y > n) moreYes++; } });
    var pct = S.stopPercent(yes, no);
    var bs = St.board.state(), called = bs && bs.signal === 'stop' && Date.now() - lastStopCall < 8000;
    var at = stops.filter(function(x){ return x.n === turn; })[0], atP = at && placeById(at.place);
    app.innerHTML = '<div class="stack">'
      + '<div class="spread"><h2>Stop check</h2><span class="pill">' + (yes + no ? 'Yes on ' + yes + ' of ' + (yes + no) + ' marks · ' + pct + '%' : 'Nothing marked yet') + '</span></div>'
      + '<p class="muted small" style="margin:0">Each time the leader says “Stop!”: did the student freeze within about 3 seconds, in their own way? <b>Yes</b> = stopped. <b>No</b> = kept going, or stopped only after a second cue or a touch. Leave it blank if they were away or you could not see. A blank is not a No.</p>'
      + (called ? '<div class="stopcall">STOP was just called' + (atP ? ' at ' + esc(atP.landmark) : '') + '. Mark stop ' + turn + ' now.</div>' : '')
      + '<details class="card"' + (watched.length ? '' : ' open') + '><summary><b>Students to watch</b> <span class="muted small">(' + watched.length + ' chosen · 4–5 is enough)</span></summary><div class="chips" style="margin-top:10px">'
      + list.map(function(s){ return '<button type="button" class="chip' + (w.indexOf(s.id) >= 0 ? ' on' : '') + '" data-watch="' + s.id + '">' + esc(s.name) + (s.present === false ? ' · not here' : '') + '</button>'; }).join('') + '</div></details>'
      + (watched.length ? '<div class="turnbar"><button type="button" class="btn" data-turn="-1">←</button><span class="t">Stop ' + turn + ' of ' + turns + (atP ? ' · ' + esc(atP.landmark) : '') + '</span><button type="button" class="btn" data-turn="1">Next stop →</button>'
        + (turn === turns ? '<button type="button" class="btn ghost" data-addturn>+ Add a stop</button>' : '') + '</div>'
        + '<div class="stopgrid">' + watched.map(function(s){ var st = s.stop || [], v = st[turn - 1];
            var hist = ''; for(var i = 0; i < turns; i++) hist += '<span class="' + (st[i] || '') + (i === turn - 1 ? ' cur' : '') + '">' + (st[i] || (i + 1)) + '</span>';
            return '<div class="srow"><span class="nm">' + esc(s.name) + '</span><div class="hist">' + hist + '</div><div class="yn"><button type="button" class="btn y' + (v === 'Y' ? ' on' : '') + '" data-yn="Y" data-id="' + s.id + '">Yes</button><button type="button" class="btn n' + (v === 'N' ? ' on' : '') + '" data-yn="N" data-id="' + s.id + '">No</button></div>'
              + '<div class="snote"><div class="chips">' + HELP.map(function(h){ return '<button type="button" class="chip' + (s[h[0]] ? ' on' : '') + '" data-help="' + h[0] + '" data-id="' + s.id + '">' + h[1] + '</button>'; }).join('')
              + '<button type="button" class="chip' + (s.game_engaged === true ? ' on' : '') + '" data-geng="' + s.id + '">Engaged</button></div>'
              + '<input type="text" data-gnote="' + s.id + '" value="' + esc(s.game_note || '') + '" placeholder="Note (students never see this)"></div></div>'; }).join('') + '</div>'
        + '<div class="card"><b>Class summary</b> · Students with more Yes than No: <b>' + moreYes + ' of ' + seen + '</b> watched'
        + (seen ? '<p class="small" style="margin:6px 0 0">' + (moreYes * 2 >= seen ? 'Mostly Yes: keep the routine and move on.' : 'Mostly No: play the stop-and-go part again tomorrow before adding a new skill.') + ' One session shows today’s response, not lasting gains.</p>' : '') + '</div>'
        : '')
      + '</div>';
    app.onclick = function(e){
      var b;
      if((b = e.target.closest('[data-watch]'))){ var id = b.dataset.watch; St.update(function(d){ var i = d.stop.watched.indexOf(id); if(i >= 0) d.stop.watched.splice(i, 1); else d.stop.watched.push(id); }); render(); return; }
      if((b = e.target.closest('[data-turn]'))){ var dt = +b.dataset.turn; St.update(function(d){ d.stop.turn = Math.max(1, Math.min(d.stop.turns, d.stop.turn + dt)); }); render(); return; }
      if((b = e.target.closest('[data-addturn]'))){ St.update(function(d){ d.stop.turns++; d.stop.turn = d.stop.turns; }); render(); return; }
      if((b = e.target.closest('[data-yn]'))){ var val = b.dataset.yn, sid = b.dataset.id;
        setField(sid, function(x){ x.stop = (x.stop || []).slice(); while(x.stop.length < turn) x.stop.push(null); x.stop[turn - 1] = x.stop[turn - 1] === val ? null : val; });
        render(); return; }
      if((b = e.target.closest('[data-help]'))){ var f = b.dataset.help; setField(b.dataset.id, function(x){ if(x[f]) delete x[f]; else x[f] = St.now(); }); render(); return; }
      if((b = e.target.closest('[data-geng]'))){ setField(b.dataset.geng, function(x){ if(x.game_engaged === true) delete x.game_engaged; else x.game_engaged = true; }); render(); return; }
    };
    app.oninput = function(e){ var t = e.target; if(t.dataset.gnote){ var v = t.value; setField(t.dataset.gnote, function(x){ x.game_note = v; }); } };
  }

  // =====================================================================
  // LESSON (lesson lead): drives the classroom board
  // =====================================================================
  function viewLesson(){
    var bs = St.board.state() || {}, conn = St.board.connected(), cur = bs.cur || 1, box = C.boxes[cur - 1], sm = summary();
    var ctl = '';
    if(box && box.id === 'intro'){
      var list = students(), here = list.filter(function(s){ return s.present === true; }).length, marked = list.filter(function(s){ return s.present === true || s.present === false; }).length;
      if(conn && (bs.here !== here || bs.total !== list.length)) St.board.send('setAttendance', here, list.length);   // board shows the count only
      var part = bs.introPart || 'attend';
      ctl = '<div class="introstep"><h3>On the board</h3><div class="seg" role="group" aria-label="What the open box shows">'
        + [['attend', '1 · Who is here?'], ['date', '2 · Calendar'], ['all', 'Both']].map(function(p){
            return '<button type="button" class="btn' + (part === p[0] ? ' on' : '') + '" data-cmd="setIntroPart" data-a="' + p[0] + '" aria-pressed="' + (part === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>'
        + (bs.open ? '' : '<p class="small muted" style="margin:0">Tap “Open box full size” above so the chosen part fills the board.</p>') + '</div>';
      var show = function(p){ return part === 'all' || part === p; };
      var stepAtt = '<div class="introstep"><h3><i>1</i>Who is here? <span class="pill">' + here + ' here · ' + marked + ' of ' + list.length + ' marked</span></h3>'
        + '<p class="small muted" style="margin:0">Ask “Who is here?” and tap each student. The board shows only the count, never names.</p>'
        + '<div class="row"><button type="button" class="btn ghost" data-allhere>Mark everyone here</button></div>'
        + '<div class="attgrid">' + list.map(function(s){
            return '<div class="frow' + (s.present === true ? ' done' : s.present === false ? ' away' : '') + '"><span class="nm">' + esc(s.name) + '</span><div class="fopts">'
              + '<button type="button" class="fbtn' + (s.present === true ? ' on' : '') + '" data-att="1" data-id="' + s.id + '" aria-pressed="' + (s.present === true) + '">Here</button>'
              + '<button type="button" class="fbtn' + (s.present === false ? ' on off' : '') + '" data-att="0" data-id="' + s.id + '" aria-pressed="' + (s.present === false) + '">Not here</button>'
              + '</div></div>'; }).join('') + '</div></div>';
      var stepDate = '<div class="introstep"><h3><i>2</i>Calendar</h3><div class="row"><span class="datebig">' + esc(bs.date || 'Open the board to see its date') + '</span>'
        + '<button type="button" class="btn' + (bs.dateShown ? '' : ' pri') + '" data-cmd="showDate" data-a="' + (bs.dateShown ? 0 : 1) + '">' + (bs.dateShown ? 'Hide the date' : 'Fill in the date') + '</button></div></div>';
      ctl += (show('attend') ? stepAtt : '') + (show('date') ? stepDate : '');
    } else if(box && box.id === 'ready'){
      var cur = bs.bb || null, used = (data().activity.brainBreaks || []);
      ctl = '<h3>Pick a brain break for how the class is doing</h3><div class="bbpick">'
        + C.brainBreaks.map(function(b){ return '<button type="button" class="bbopt' + (cur === b.id ? ' on' : '') + '" data-bb="' + b.id + '"><img src="' + esc(b.img) + '" alt=""><span>' + bi(b.en, b.es) + '<small>' + esc(b.when) + ' · ' + esc(b.time) + '</small></span></button>'; }).join('') + '</div>'
        + '<div class="row">' + (cur ? '<button type="button" class="btn ghost" data-cmd="setBrainBreak" data-a="">Show all four again</button>' : '')
        + '<a class="btn ghost" href="' + esc(C.brainBreakGuide) + '" target="_blank" rel="noopener">How to use (guide card) ↗</a></div>'
        + (used.length ? '<p class="small muted" style="margin:0">Used today: ' + used.map(function(u){ return esc(bbName(u.id)) + ' at ' + clock(u.at); }).join(' · ') + '</p>' : '');
    } else if(box && box.id === 'move'){
      var act = data().activity, phase = bs.phase || 'intro', spinning = !!bs.spinning, pl = bs.place != null ? C.places[bs.place] : null;
      ctl = '<h3>Let’s Explore Puerto Rico · Go, Move and Stop</h3><div class="seg" role="group" aria-label="Game part">'
        + [['intro', '1 · Show the places'], ['play', '2 · Play'], ['close', '3 · Who helps here?']].map(function(p){
            return '<button type="button" class="btn' + (phase === p[0] ? ' on' : '') + '" data-cmd="gamePhase" data-a="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>'
        + '<button type="button" class="btn pri big" data-spin' + (spinning ? ' disabled' : '') + '>' + (spinning ? 'Spinning…' : 'Spin the wheel') + '</button>'
        + '<div class="nowcard">' + (spinning ? '<span class="muted">The wheel is spinning…</span>' : pl ? '<b>' + esc(pl.landmark) + '</b> · ' + esc(pl.en) + '<br><span class="small">Say: “' + esc(act.draws.length > 1 ? pl.goEn.replace(/^Go/, 'Next, go') : pl.goEn.replace(/^Go/, 'First, go')) + '” · Move: ' + esc(pl.move) + ' ' + esc(pl.how) + ' · Helper: ' + esc(pl.helper) + '</span>' : '<span class="muted">Spin to pick the first place.</span>') + '</div>'
        + '<div class="row cuebtns"><button type="button" class="btn go big" data-sig="go"' + (pl ? '' : ' disabled') + '>GO</button><button type="button" class="btn mvb big" data-sig="move"' + (pl ? '' : ' disabled') + '>MOVE</button><button type="button" class="btn stop big" data-sig="stop"' + (pl ? '' : ' disabled') + '>STOP</button></div>'
        + '<p class="small muted" style="margin:0">STOP opens the next stop on the classroom teacher’s Stop check screen, labelled with this place.</p>'
        + '<details><summary class="small">Show a place without spinning (a student drew a paper card)</summary><div class="chips" style="margin-top:8px">' + C.places.map(function(p, i){ return '<button type="button" class="chip' + (bs.place === i ? ' on' : '') + '" data-place="' + i + '">' + esc(p.landmark) + '</button>'; }).join('') + '</div></details>'
        + (act.draws.length || act.stops.length ? '<div class="gamelog"><b>Today so far</b> · ' + act.draws.length + ' place' + (act.draws.length === 1 ? '' : 's') + ', ' + act.stops.length + ' stop' + (act.stops.length === 1 ? '' : 's') + '<br>'
            + gameTimeline(act) + '</div>' : '');
    } else if(box && (box.id === 'wall' || box.id === 'pep')){
      var isW = box.id === 'wall', items = isW ? C.words : C.letters, at = Math.max(0, Math.min(items.length - 1, (isW ? bs.word : bs.letter) || 0));
      var cmd = isW ? 'setWord' : 'setLetter', label = function(x){ return isW ? x.en : x.L + x.L.toLowerCase() + ' · ' + x.word; };
      ctl = '<h3>' + (isW ? 'Word' : 'Letter') + ' ' + (at + 1) + ' of ' + items.length + ': ' + esc(label(items[at])) + '</h3>'
        + '<div class="chips">' + items.map(function(x, i){ return '<button type="button" class="chip' + (i === at ? ' on' : '') + '" data-cmd="' + cmd + '" data-a="' + i + '">' + (i + 1) + ' · ' + esc(label(x)) + '</button>'; }).join('') + '</div>'
        + '<div class="row"><button type="button" class="btn" data-cmd="' + cmd + '" data-a="' + Math.max(0, at - 1) + '"' + (at === 0 ? ' disabled' : '') + '>← Previous</button>'
        + '<button type="button" class="btn pri big" data-cmd="sayCurrent" style="flex:1">Say it on the board</button>'
        + '<button type="button" class="btn" data-cmd="' + cmd + '" data-a="' + Math.min(items.length - 1, at + 1) + '"' + (at === items.length - 1 ? ' disabled' : '') + '>Next →</button></div>'
        + '<p class="small muted" style="margin:0">The board computer says the English ' + (isW ? 'word' : 'letter and word') + ' out loud. Its speakers need to be on, and the board needs one click or key press after it opens before the browser allows sound.</p>';
    } else if(box && box.id === 'read'){
      ctl = levelControls(sm, bs) + '<div class="row"><button type="button" class="btn" data-cmd="turn" data-a="-1">← Page</button><button type="button" class="btn" data-cmd="turn" data-a="1">Page →</button></div>';
    } else if(box && box.id === 'comp'){
      var order = S.pickerOrder(students().map(St.toRec)), list = students();
      ctl = '<h3>Who to call (second-screen students first)</h3><div class="chips">' + order.map(function(i){ var r = sm.students[i]; return '<span class="chip' + (r.rescreen_needed ? ' on' : '') + '">' + esc(list[i].name) + '</span>'; }).join('') + '</div>'
        + '<div class="row"><button type="button" class="btn" data-cmd="seqUndo">Undo card</button><button type="button" class="btn pri" data-cmd="seqCheck">Check order</button><button type="button" class="btn ghost" data-cmd="seqNew">New order</button></div>';
    }
    var note = box && C.notes[box.id];
    app.innerHTML = '<div class="stack">'
      + '<div class="spread"><h2>Lesson</h2><div class="row"><span class="conn' + (conn ? ' on' : '') + '"><i></i>' + (conn ? 'Board connected' : 'Board not open') + '</span><a class="btn" href="board.html" target="wehelp-board">Open board ↗</a></div></div>'
      + (conn ? '' : '<p class="small muted" style="margin:0">Open the board on the classroom TV computer. For now it must be in another tab of this same browser; Phase 4 connects separate devices.</p>')
      + '<div class="boxes">' + C.boxes.map(function(b){ return '<button type="button" class="bx' + (b.n === cur ? ' on' : b.n < cur ? ' done' : '') + '" data-cmd="goto" data-a="' + b.n + '"><i>' + b.n + '</i>' + esc(b.title) + '</button>'; }).join('') + '</div>'
      + '<div class="row"><button type="button" class="btn" data-cmd="back">← Back</button><button type="button" class="btn' + (bs.open ? '' : ' pri') + '" data-cmd="' + (bs.open ? 'close' : 'open') + '">' + (bs.open ? 'Close box' : 'Open box full size') + '</button><button type="button" class="btn warn" data-cmd="next">Done, next →</button>'
        + '<button type="button" class="btn ghost" data-cmd="setFlow" data-a="' + (bs.flow === false ? 1 : 0) + '">Lesson flow on board: ' + (bs.flow === false ? 'Off' : 'On') + '</button></div>'
      + (ctl ? '<div class="card stack">' + ctl + '</div>' : '')
      + (note ? '<div class="card"><h3>' + esc(note[0]) + '</h3><p class="small" style="margin:6px 0 0">' + esc(note[1]) + '</p></div>' : '')
      + '</div>';
    app.onclick = function(e){
      var t;
      if((t = e.target.closest('[data-att]'))){ setPresent(t.dataset.id, t.dataset.att === '1'); return; }
      if(e.target.closest('[data-allhere]')){ St.update(function(d){ d.students.forEach(function(s){ if(s.present !== true){ s.present = true; s.present_at = St.now(); } }); }); sendAttendance(); render(); return; }
      if((t = e.target.closest('[data-bb]'))){ chooseBrainBreak(t.dataset.bb); return; }
      if(e.target.closest('[data-spin]')){ spinGame(); return; }
      if((t = e.target.closest('[data-place]'))){ showPlace(+t.dataset.place); return; }
      if((t = e.target.closest('[data-sig]'))){ gameSignal(t.dataset.sig); return; }
      var b = e.target.closest('[data-cmd]'); if(!b) return;
      var cmd = b.dataset.cmd, a = b.dataset.a, bb = b.dataset.b;
      if(cmd === 'setLevel'){ chooseLevel(+a, b.dataset.src || 'override'); return; }
      var num = function(v){ return v != null && v !== '' && !isNaN(v) ? +v : v; };
      St.board.send.apply(null, [cmd].concat(a != null ? [num(a)] : []).concat(bb != null ? [num(bb)] : []));
      setTimeout(render, 250);
    };
  }
  // Attendance: one Here / Not here per student, with the time it was marked. The board gets the count only.
  function sendAttendance(){ var l = students(); if(St.board.connected()) St.board.send('setAttendance', l.filter(function(s){ return s.present === true; }).length, l.length); }
  function setPresent(id, here){
    St.update(function(d){ var s = d.students.filter(function(x){ return x.id === id; })[0]; if(!s) return;
      if(s.present === here){ delete s.present; delete s.present_at; } else { s.present = here; s.present_at = St.now(); } });
    sendAttendance(); render();
  }
  function bi(en, es){ return '<span class="bi"><b>' + esc(en) + '</b><i>' + esc(es) + '</i></span>'; }
  function clock(iso){ return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function bbName(id){ var b = C.brainBreaks.filter(function(x){ return x.id === id; })[0]; return b ? b.en : id; }
  function placeName(i){ var p = C.places[i]; return p ? p.landmark : '?'; }
  // Brain Break: the choice is shown on the board and logged with the time and who chose it
  function chooseBrainBreak(id){
    var bs = St.board.state() || {};
    if(bs.bb !== id) St.update(function(d){ d.activity.brainBreaks.push({ id: id, at: St.now(), by: (me() || {}).name || '' }); });
    St.board.send('setBrainBreak', id); setTimeout(render, 250);
  }
  // Game: the iPad picks the place (each place once before any repeats) so every draw is logged here
  function spinGame(){
    var bs = St.board.state() || {}, round = bs.round || [], left = [], i;
    if(bs.spinning) return;
    for(i = 0; i < C.places.length; i++) if(round.indexOf(i) < 0 && i !== bs.place) left.push(i);
    if(!left.length) for(i = 0; i < C.places.length; i++) if(i !== bs.place) left.push(i);
    var pick = left[Math.floor(Math.random() * left.length)];
    St.update(function(d){ d.activity.draws.push({ place: C.places[pick].id, at: St.now(), by: (me() || {}).name || '', how: 'spin' }); });
    St.board.send('spin', pick); setTimeout(render, 300);
  }
  function showPlace(i){
    St.update(function(d){ d.activity.draws.push({ place: C.places[i].id, at: St.now(), by: (me() || {}).name || '', how: 'card' }); });
    St.board.send('setPlace', i); setTimeout(render, 250);
  }
  // STOP adds a stop to the log and moves the classroom teacher's Stop check to that stop
  function gameSignal(sig){
    var bs = St.board.state() || {};
    if(sig === 'stop' && bs.place != null && bs.signal !== 'stop'){
      St.update(function(d){ var n = d.activity.stops.length + 1;
        d.activity.stops.push({ n: n, place: C.places[bs.place].id, at: St.now(), by: (me() || {}).name || '' });
        d.stop.turns = Math.max(d.stop.turns, n); d.stop.turn = n; });
    }
    St.board.send('signal', sig); setTimeout(render, 250);
  }
  function placeById(id){ for(var i = 0; i < C.places.length; i++) if(C.places[i].id === id) return C.places[i]; return null; }
  function gameTimeline(act){
    var ev = act.draws.map(function(x){ return { at: x.at, t: '📍 ' + ((placeById(x.place) || {}).landmark || x.place) }; })
      .concat(act.stops.map(function(x){ return { at: x.at, t: '✋ Stop ' + x.n }; }));
    ev.sort(function(a, b){ return a.at < b.at ? -1 : 1; });
    return '<span class="small">' + ev.map(function(e){ return esc(e.t) + ' <span class="muted">' + clock(e.at) + '</span>'; }).join(' → ') + '</span>';
  }
  function levelControls(sm, bs){
    var rec = sm.class_level, cur = bs.level || null;
    return '<h3>Reader level</h3>'
      + '<p class="small" style="margin:0">' + (rec ? 'Quick check recommends <b>Level ' + rec + '</b> (' + sm.screened + ' screened · ' + [1, 2, 3].map(function(L){ return 'L' + L + ': ' + sm.level_counts[L]; }).join(', ') + ').' : 'No screens saved yet.') + ' Board shows: <b>' + (cur ? 'Level ' + cur : 'no level') + '</b>.</p>'
      + '<div class="levelpick">' + (rec ? '<button type="button" class="btn pri" data-cmd="setLevel" data-a="' + rec + '" data-src="quick check">Use Level ' + rec + ' from the quick check</button>' : '')
      + [1, 2, 3].map(function(L){ return '<button type="button" class="btn' + (cur === L ? ' on' : '') + (rec === L ? ' rec' : '') + '" data-cmd="setLevel" data-a="' + L + '" data-src="override">Level ' + L + '</button>'; }).join('') + '</div>';
  }
  function chooseLevel(L, src){
    var rec = summary().class_level, reason = '';
    if(src === 'override' && rec && L !== rec){
      reason = prompt('Teacher override: Level ' + L + ' instead of the recommended Level ' + rec + '. Reason (saved in the log):', '');
      if(reason === null) return;
    }
    St.update(function(d){ d.levelLog.push({ at: St.now(), by: (me() || {}).name || '', level: L, recommended: rec, source: L === rec ? 'quick check' : 'override', reason: reason }); });
    St.board.send('setLevel', L, L === rec ? 'quick check' : 'override');
    toast('Board set to Level ' + L); setTimeout(render, 250);
  }

  // =====================================================================
  // RESULTS
  // =====================================================================
  function viewResults(){
    var sm = summary(), list = students(), d = data();
    var rows = list.map(function(s, i){ var r = sm.students[i];
      return '<tr><td>' + s.no + '</td><td><b>' + esc(s.name) + '</b></td><td>' + (s.present === true ? 'Yes' : s.present === false ? 'No' : '') + '</td><td class="n">' + (r.complete ? r.start_total : '–') + '</td><td>' + (r.complete ? (r.target_met ? '<span class="pill ok">Yes</span>' : '<span class="pill no">No</span>') : '<span class="pill wait">' + (r.missing.length < 5 ? 'Missing ' + r.missing.join(',') : 'Not screened') + '</span>') + '</td>'
        + '<td>' + levelPill(r.start_level) + '</td><td>' + (s.engaged === true ? 'Y' : s.engaged === false ? 'N' : '') + '</td>'
        + '<td>' + (r.rescreen_needed ? (r.rescreen_done ? '<span class="pill ok">Done</span>' : '<span class="pill re">Items ' + r.flagged_items.join(',') + '</span>') : '') + '</td>'
        + '<td class="n">' + (r.rescreened ? r.end_total : '') + '</td><td>' + (r.rescreened ? levelPill(r.end_level) : '') + '</td><td class="n">' + (r.rescreened ? (r.growth >= 0 ? '+' : '') + r.growth : '') + '</td>'
        + '<td class="n">' + ((s.stop || []).filter(Boolean).length ? (s.stop || []).filter(function(v){ return v === 'Y'; }).length + '/' + (s.stop || []).filter(Boolean).length : '') + '</td>'
        + '<td class="small">' + HELP.filter(function(h){ return s[h[0]]; }).map(function(h){ return h[1]; }).concat(s.game_engaged ? ['Engaged'] : []).concat(s.game_note ? ['“' + esc(s.game_note) + '”'] : []).join(' · ') + '</td></tr>'; }).join('');
    var act = d.activity, here = list.filter(function(s){ return s.present === true; }).length;
    var re = sm.students.filter(function(r){ return r.rescreened; });
    app.innerHTML = '<div class="stack">'
      + '<div class="spread"><h2>Results · ' + esc(d.session.date) + '</h2><button type="button" class="btn pri" id="csv">⬇ Export CSV (no names)</button></div>'
      + '<div class="sumbox">'
      + '<div class="stat"><small>Screened</small><b>' + sm.screened + '<small> of ' + list.length + '</small></b></div>'
      + '<div class="stat"><small>Met target (8+)</small><b>' + sm.target_met + '<small> of ' + sm.screened + '</small></b></div>'
      + '<div class="stat"><small>Class level</small><b>' + (sm.class_level || '–') + '</b></div>'
      + '<div class="stat"><small>Levels 1 · 2 · 3</small><b>' + sm.level_counts[1] + ' · ' + sm.level_counts[2] + ' · ' + sm.level_counts[3] + '</b></div>'
      + '<div class="stat"><small>Stop check</small><b>' + (sm.stop_percent === null ? '–' : sm.stop_percent + '%') + '<small> ' + (sm.stop_yes + sm.stop_no ? sm.stop_yes + ' of ' + (sm.stop_yes + sm.stop_no) + ' turns' : '') + '</small></b></div>'
      + '<div class="stat"><small>Here today</small><b>' + here + '<small> of ' + list.length + '</small></b></div>'
      + '<div class="stat"><small>Second screen</small><b>' + re.length + '<small> of ' + sm.rescreen_list.length + ' done</small></b></div>'
      + '</div>'
      + '<div class="card stack"><h3>What to do tomorrow</h3>' + (sm.recommendations.length ? '<div class="reco">' + sm.recommendations.map(function(r){ return '<div>' + esc(r.text) + (r.students ? ' <small>(' + r.students + ' of ' + sm.screened + ' students)</small>' : '') + '</div>'; }).join('') + '</div>' : '<p class="muted small" style="margin:0">No flags yet.</p>')
      + (re.length ? '<p class="small muted" style="margin:0">Second-screen results are performance on reassessed items only, not whole-class growth.</p>' : '') + '</div>'
      + '<div class="card stack"><h3>Brain Break and game</h3>'
      + '<p class="small" style="margin:0"><b>Brain Break:</b> ' + (act.brainBreaks.length ? act.brainBreaks.map(function(u){ return esc(bbName(u.id)) + ' (' + clock(u.at) + (u.by ? ', ' + esc(u.by) : '') + ')'; }).join(' · ') : 'none picked') + '</p>'
      + '<p class="small" style="margin:0"><b>Game:</b> ' + (act.draws.length || act.stops.length ? gameTimeline(act) : 'not played yet') + '</p></div>'
      + '<div class="tablewrap"><table class="res"><tr><th>#</th><th>Student</th><th>Here</th><th>Start</th><th>Target</th><th>Start level</th><th>Engaged</th><th>2nd screen</th><th>End</th><th>End level</th><th>Change</th><th>Stop</th><th>Game notes</th></tr>' + rows + '</table></div>'
      + (d.levelLog.length ? '<div class="card"><h3>Reader level log</h3><div class="log">' + d.levelLog.map(function(l){ return new Date(l.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · Level ' + l.level + ' · ' + esc(l.source) + (l.recommended ? ' (recommended ' + l.recommended + ')' : '') + (l.reason ? ' · “' + esc(l.reason) + '”' : '') + (l.by ? ' · ' + esc(l.by) : ''); }).join('<br>') + '</div></div>' : '')
      + '</div>';
    $('#csv').onclick = function(){
      var csv = S.toCSV(students().map(St.toRec), d.session.date), name = S.csvFileName(d.session.date);
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      toast('Saved ' + name);
    };
    app.onclick = null;
  }

  // =====================================================================
  // SETUP
  // =====================================================================
  function viewSetup(){
    var d = data();
    app.innerHTML = '<div class="stack">'
      + '<h2>Setup</h2>'
      + '<div class="card stack"><h3>Session</h3><div class="grid2"><label class="f">Date<input type="date" id="sDate" value="' + esc(d.session.date) + '"></label>'
      + '<label class="f">Classroom teacher<input type="text" id="sTeacher" value="' + esc(d.session.teacher) + '"></label></div></div>'
      + '<div class="card stack"><h3>Roster</h3><p class="small muted" style="margin:0">One student per line: number, then first name. Scores stay with a student as long as the number and name don’t change.</p>'
      + '<textarea id="sRoster" rows="10">' + esc(students().map(function(s){ return s.no + ', ' + s.name; }).join('\n')) + '</textarea>'
      + '<div class="row"><button type="button" class="btn pri" id="sSave">Save roster</button></div></div>'
      + connectionCard()
      + '<div class="card stack"><h3>Scores</h3><p class="small muted" style="margin:0">' + (St.mode === 'synced' ? 'Clearing scores affects every device. The reader level log is kept.' : 'Everything is saved in this browser only.') + '</p>'
      + '<div class="row"><button type="button" class="btn" id="sClear">Clear all scores (keep roster)</button><button type="button" class="btn ghost" id="sDemo">Load demo roster</button></div></div>'
      + '</div>';
    $('#sDate').onchange = function(){ var v = this.value; St.update(function(d){ d.session.date = v; }); toast('Date saved'); };
    $('#sTeacher').onchange = function(){ var v = this.value.trim(); St.update(function(d){ d.session.teacher = v; }); toast('Saved'); };
    $('#sSave').onclick = function(){
      var rows = [], bad = [], seen = {};
      $('#sRoster').value.split('\n').forEach(function(line, i){ line = line.trim(); if(!line) return;
        var m = /^(\d+)\s*[,.\t ]\s*(.+)$/.exec(line); if(!m){ bad.push(i + 1); return; }
        if(seen[m[1]]){ bad.push(i + 1); return; } seen[m[1]] = 1; rows.push([+m[1], m[2].trim()]); });
      if(bad.length){ toast('Check line ' + bad.join(', ') + ' (number, name; numbers can’t repeat)'); return; }
      St.replaceRoster(rows); toast('Roster saved: ' + rows.length + ' students'); render();
    };
    $('#sClear').onclick = function(){ if(confirm('Clear every score, note and stop-check mark on this device? The roster stays. This can’t be undone.')){ St.reset(true); toast('Scores cleared'); render(); } };
    if($('#cSave')) $('#cSave').onclick = function(){ var u = $('#cUrl').value.trim(), k = $('#cKey').value.trim(); if(!/^https?:\/\//.test(u) || k.length < 20){ toast('Add the project URL and anon key'); return; }
      try{ localStorage.setItem('wehelp-connect:v1', JSON.stringify({ url: u, key: k })); }catch(e){} location.reload(); };
    if($('#cOff')) $('#cOff').onclick = function(){ if(!confirm('Disconnect this device from Supabase? It goes back to keeping data on this device only.')) return;
      St.signOut().then(function(ok){ if(ok === false) return; try{ localStorage.removeItem('wehelp-connect:v1'); }catch(e){} location.reload(); }); };
    if($('#cOut')) $('#cOut').onclick = function(){ St.signOut().then(function(ok){ if(ok !== false) go('signin'); }); };
    $('#sDemo').onclick = function(){ if(confirm('Replace the roster and all scores with the fictional demo roster?')){ St.reset(false); toast('Demo roster loaded'); render(); } };
    app.onclick = null;
  }

  function connectionCard(){
    var st = St.status(), cfg = window.WEHELP_CONFIG || {}, fixed = false;
    try{ fixed = !localStorage.getItem('wehelp-connect:v1') && !!cfg.supabaseUrl; }catch(e){}
    if(St.mode === 'synced') return '<div class="card stack"><h3>Sync</h3><p class="small" style="margin:0">Connected to <b>' + esc(cfg.supabaseUrl) + '</b> · lesson date ' + esc(cfg.sessionDate || '') + '.<br>'
      + (st.pending ? st.pending + ' change(s) waiting to send. ' : 'Everything is sent. ') + (st.lastSync ? 'Last synced ' + new Date(st.lastSync).toLocaleTimeString() + '.' : '') + '</p>'
      + '<div class="row"><button type="button" class="btn" id="cOut">Sign out</button>' + (fixed ? '' : '<button type="button" class="btn ghost" id="cOff">Disconnect this device</button>') + '</div></div>';
    return '<div class="card stack"><h3>Sync</h3><p class="small muted" style="margin:0">This device keeps data to itself. To share data across all iPads and the board, connect it to the team’s Supabase project (Project Settings → API).</p>'
      + '<div class="grid2"><label class="f">Project URL<input type="text" id="cUrl" placeholder="https://xxxx.supabase.co" autocomplete="off"></label><label class="f">Anon public key<input type="text" id="cKey" autocomplete="off"></label></div>'
      + '<div class="row"><button type="button" class="btn pri" id="cSave">Connect this device</button></div></div>';
  }

  // ---------- render ----------
  function render(){
    var r = route(), m = me();
    if(St.mode === 'synced'){
      var stt = St.status(), mem = St.member && St.member();
      if(!stt.ready){ app.innerHTML = '<p class="muted" style="text-align:center;margin-top:40px">Signing in…</p>'; return; }
      if((!stt.signedIn || !mem || mem.role === 'board') && r.tab !== 'signin'){ location.replace('#signin'); return; }
      if(stt.signedIn && mem && mem.role !== 'board' && !data().session.id && r.tab !== 'signin'){ renderTop(r.tab); app.innerHTML = '<p class="muted" style="text-align:center;margin-top:40px">Loading the lesson…</p>'; return; }
    }
    if(!m && r.tab !== 'signin'){ location.replace('#signin'); return; }
    var tab = r.tab || (m ? ROLES.filter(function(x){ return x.id === m.role; })[0].home : 'signin');
    renderTop(tab);
    app.oninput = null;
    if(tab !== 'screen' && tab !== 'rescreen') clearInterval(clockT);
    if(tab === 'signin') viewSignin();
    else if(tab === 'screen') r.id ? viewScreen(r.id, r.step, false) : viewRoster();
    else if(tab === 'rescreen') viewScreen(r.id, r.step, true);
    else if(tab === 'stop') viewStop();
    else if(tab === 'lesson') viewLesson();
    else if(tab === 'results') viewResults();
    else if(tab === 'setup') viewSetup();
    else go(ROLES.filter(function(x){ return x.id === m.role; })[0].home);
  }
  function busyTyping(){ var a = document.activeElement; return a && /INPUT|TEXTAREA|SELECT/.test(a.tagName); }
  var wasLoaded = St.status().loaded, errShown = null;
  St.subscribe(function(d, src){
    if(src === 'remote' && !busyTyping()) render();
    if(src === 'status'){
      var st = St.status(); renderSync();
      if(st.loaded && !wasLoaded){ wasLoaded = true; render(); }
      if(st.error && st.error !== errShown){ errShown = st.error; toast(st.error); }
    }
  });
  St.board.subscribe(function(bs){
    if(bs.signal === 'stop' && !viewStop._sig){ lastStopCall = Date.now(); }
    viewStop._sig = bs.signal === 'stop';
    var t = route().tab; if((t === 'lesson' || t === 'stop') && !busyTyping()) render();
  });
  St.board.ping();
  St.ready.then(function(){ var r = route(), mem = St.member && St.member(); if(St.mode === 'synced' && r.tab === 'signin' && mem && mem.role !== 'board') go(homeOf(me())); else render(); St.board.ping(); });
  render();
})();
