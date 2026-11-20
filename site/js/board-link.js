/* Board ⇄ portal link across devices (SYNCED mode only).
 * The board signs in with the team's board account. That account can use the board channel but RLS stops it
 * from reading any student data. Without a sign-in the board still works by keyboard and same-device tabs.
 * Shift+L signs the board out.
 */
(function(){
  var CFG = window.WEHELP_CONFIG || {};
  if(!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.board)) return;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'wehelp-board-auth' } });
  var ch = null, last = null, dot = null;

  function status(on, text){
    if(!dot){ dot = document.createElement('div'); dot.style.cssText = 'position:fixed;right:12px;top:6px;z-index:50;font:600 11px Poppins,system-ui,sans-serif;color:#fff;opacity:.75;display:flex;gap:6px;align-items:center'; document.body.appendChild(dot); }
    dot.innerHTML = '<i style="width:9px;height:9px;border-radius:50%;background:' + (on ? '#3FA35B' : '#8A94A3') + ';display:inline-block"></i>' + text;
  }
  function connect(){
    try{ sb.realtime.setAuth(); }catch(e){}
    ch = sb.channel('board-' + (CFG.sessionDate || ''), { config: { private: true, broadcast: { self: false } } })
      .on('broadcast', { event: 'cmd' }, function(m){ var d = m.payload || {}; var fn = window.board[d.cmd]; if(typeof fn === 'function' && d.cmd !== 'getState') fn.apply(null, d.args || []); })
      .on('broadcast', { event: 'hello' }, function(){ window.board.announce(); })
      .subscribe(function(s){ status(s === 'SUBSCRIBED', s === 'SUBSCRIBED' ? 'Synced' : 'Connecting…'); if(s === 'SUBSCRIBED') window.board.announce(); });
  }
  window.addEventListener('wehelp-board-state', function(e){ last = e.detail; if(ch) ch.send({ type: 'broadcast', event: 'state', payload: last }); });

  function signInForm(){
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(27,42,74,.85);display:grid;place-items:center;font-family:Poppins,system-ui,sans-serif';
    o.innerHTML = '<form style="background:#fff;border-radius:20px;padding:24px;width:min(380px,90vw);display:flex;flex-direction:column;gap:10px">'
      + '<b style="font-size:20px;color:#2A3D66">Connect the board</b><span style="font-size:13px;color:#5A6572">Sign in with the team’s board account so the iPads can drive this screen.</span>'
      + '<input name="e" type="email" autocomplete="username" placeholder="Board account email" required style="font:inherit;padding:10px;border:2px solid #E3E8EE;border-radius:10px">'
      + '<input name="p" type="password" autocomplete="current-password" placeholder="Password" required style="font:inherit;padding:10px;border:2px solid #E3E8EE;border-radius:10px">'
      + '<span class="err" style="color:#E63946;font-size:13px;min-height:16px"></span>'
      + '<button style="font:inherit;font-weight:700;padding:12px;border:0;border-radius:12px;background:#2E86D1;color:#fff">Sign in</button>'
      + '<button type="button" class="skip" style="font:inherit;font-size:13px;padding:6px;border:0;background:none;color:#5A6572">Use without sync</button></form>';
    document.body.appendChild(o);
    var f = o.querySelector('form');
    o.querySelector('.skip').onclick = function(){ o.remove(); status(false, 'Not synced'); };
    f.onsubmit = function(e){ e.preventDefault(); e.stopPropagation(); f.querySelector('.err').textContent = '';
      sb.auth.signInWithPassword({ email: f.e.value.trim(), password: f.p.value }).then(function(r){
        if(r.error){ f.querySelector('.err').textContent = r.error.message; return; }
        o.remove(); connect(); }); };
    f.addEventListener('keydown', function(e){ e.stopPropagation(); });
  }
  sb.auth.getSession().then(function(r){ if(r.data && r.data.session) connect(); else signInForm(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'L' && e.shiftKey && !e.metaKey && !e.ctrlKey){ if(ch) sb.removeChannel(ch); ch = null; sb.auth.signOut().then(signInForm); } });
})();
