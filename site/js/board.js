/* We Help! classroom board.
 * Student-facing: never shows names, scores or teacher controls.
 * Content comes from board-content.js (window.WEHELP). State is kept in localStorage; the teacher portal drives it
 * through window.board / postMessage / the board link.
 * Language rule: English in bold, Spanish right below in italics. Use bi(en, es) for every student-facing pair.
 */
(function(){
  var C = window.WEHELP, BOXES = C.boxes, LAST = BOXES.length, NP = C.places.length;
  var KEY = 'wehelp-board:v2';
  var $ = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return [].slice.call((r||document).querySelectorAll(s)); };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  // The bilingual standard: English bold, Spanish italic underneath.
  function bi(en, es, cls){ return '<span class="bi'+(cls?' '+cls:'')+'"><b>'+esc(en)+'</b>'+(es?'<i>'+esc(es)+'</i>':'')+'</span>'; }
  function boxById(id){ for(var i=0;i<BOXES.length;i++) if(BOXES[i].id===id) return BOXES[i]; return null; }
  function boxAt(n){ return BOXES[n-1]; }

  // ---------- date (override with ?date=2026-12-01 for rehearsals) ----------
  var today = (function(){
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    return m ? new Date(+m[1], +m[2]-1, +m[3]) : new Date();
  })();
  function fmt(loc, o){ try{ return today.toLocaleDateString(loc, o); }catch(e){ return today.toDateString(); } }
  var D = {
    weekday: C.weekdays[today.getDay()].en,
    weekdayEs: C.weekdays[today.getDay()].es,
    long: fmt('en-US', {month:'long', day:'numeric', year:'numeric'}),
    longEs: fmt('es-PR', {day:'numeric', month:'long', year:'numeric'}),
    day: today.getDate()
  };
  D.label = D.weekday+', '+D.long;
  D.month = fmt('en-US', {month:'long'}); D.monthEs = fmt('es-PR', {month:'long'});

  // ---------- state ----------
  function freshGame(){ return { phase:'intro', place:null, pending:null, signal:null, rot:0, spinning:false, round:[] }; }
  function fresh(){ return { cur:1, notes:false, flow:true, word:0, letter:0, introPart:'attend', dateShown:false, here:0, total:0, bb:null, game:freshGame(),
    level:null, levelLog:[], page:0, seq:{placed:[], checked:false, shuffle:[]} }; }
  var state = fresh();
  try{ var s = JSON.parse(localStorage.getItem(KEY)||'null'); if(s && typeof s.cur==='number'){ for(var k in state) if(s[k]!==undefined) state[k]=s[k]; } }catch(e){}
  (function(){ var g = freshGame(); for(var k in g) if(state.game[k]===undefined) state.game[k] = g[k]; })();
  if(state.cur>LAST+1) state.cur = 1;
  if(state.game.spinning){ state.game.spinning = false; state.game.place = state.game.pending; state.game.pending = null; }   // reloaded mid-spin
  var chan = null; try{ chan = new BroadcastChannel('wehelp-board'); }catch(e){}
  function snapshot(){ var g = state.game;
    return {cur:state.cur, flow:state.flow!==false, word:state.word, letter:state.letter, open:typeof pres!=='undefined' && pres.mode!=='overview', date:D.label, dateShown:state.dateShown, introPart:state.introPart,
      here:state.here, total:state.total, bb:state.bb, phase:g.phase, place:g.place, signal:g.signal, spinning:g.spinning, round:g.round,
      level:state.level, page:state.page, seq:{placed:state.seq.placed, checked:state.seq.checked}}; }
  function announce(){ var snap = snapshot(); if(chan) chan.postMessage({type:'state', state:snap}); try{ window.dispatchEvent(new CustomEvent('wehelp-board-state', {detail:snap})); }catch(e){} }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} announce(); }

  // ---------- icons ----------
  var PIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="2"/><path d="M21 16l-5.5-5.5L5 20"/></svg>';
  var SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18.3 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  var PERSON = '<svg viewBox="0 0 24 32" aria-hidden="true"><circle cx="12" cy="7.5" r="6"/><path d="M1.5 31.5c0-7.5 4.7-12.5 10.5-12.5s10.5 5 10.5 12.5z"/></svg>';
  var ICON = {
    breath:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linecap="round"><path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 19h6"/></svg>',
    move:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M4 17l4-1 2-3 3 2v6M10 13l1-5 4 2 3 3M8 9l3-1"/></svg>',
    words:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="3.5" width="8" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="8" height="7" rx="1.5"/><rect x="2.5" y="13.5" width="8" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="8" height="7" rx="1.5"/></svg>',
    letters:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l4-12 4 12M4.5 15h5"/><path d="M14 7h4a3 3 0 0 1 0 6h-4zM14 13h5a3 3 0 0 1 0 6h-5z"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2z"/><path d="M12 6v14"/></svg>',
    order:'<svg viewBox="0 0 24 24" fill="none" stroke="#3FA35B" stroke-width="2" stroke-linejoin="round"><rect x="2" y="7" width="5.5" height="10" rx="1.5"/><rect x="9.25" y="7" width="5.5" height="10" rx="1.5"/><rect x="16.5" y="7" width="5.5" height="10" rx="1.5"/></svg>'
  };
  // media: real image when `img` is set, else a labelled placeholder tile
  function media(img, label, color){
    if(img) return '<img class="media" src="'+esc(img)+'" alt="'+esc(label)+'">';
    return '<div class="phd"'+(color?' style="--pc:'+color+'"':'')+'>'+PIC+'<span>'+esc(label)+'</span></div>';
  }
  var CHECK = function(c){ return '<div class="check"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="var(--'+c+')" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'; };

  // ---------- box bodies ----------
  // Month calendar (weeks start on Sunday), weekdays written out in full. Today's square is marked once the date is filled in.
  function monthGrid(){
    var y = today.getFullYear(), m = today.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m+1, 0).getDate();
    var cells = '', n = 0, i;
    for(i=0;i<first;i++,n++) cells += '<span class="d pad"></span>';
    for(i=1;i<=days;i++,n++) cells += '<span class="d'+(i===D.day?' today':'')+'">'+i+'</span>';
    for(;n%7;n++) cells += '<span class="d pad"></span>';
    return '<div class="mgrid'+(n>35?' rows6':'')+'"><div class="mhead">'+bi(D.month+' '+y, D.monthEs+' '+y)+'</div>'
      + '<div class="wk">'+C.weekdays.map(function(w, k){ return '<span'+(k===today.getDay()?' class="tdw"':'')+'>'+bi(w.en, w.es)+'</span>'; }).join('')+'</div>'
      + '<div class="days">'+cells+'</div></div>';
  }
  function wheelSVG(){
    var r = 97, out = '<svg viewBox="-100 -100 200 200" aria-hidden="true">';
    C.places.forEach(function(p, i){
      var a0 = (-90+i*360/NP)*Math.PI/180, a1 = (-90+(i+1)*360/NP)*Math.PI/180, c = (i+.5)*360/NP;
      out += '<path d="M0 0L'+(r*Math.cos(a0)).toFixed(2)+' '+(r*Math.sin(a0)).toFixed(2)+'A'+r+' '+r+' 0 0 1 '+(r*Math.cos(a1)).toFixed(2)+' '+(r*Math.sin(a1)).toFixed(2)+'Z" fill="'+p.color+'" stroke="#fff" stroke-width="3"/>'
        + '<g transform="rotate('+c.toFixed(1)+') translate(0 -62)"><text class="wl-en" text-anchor="middle">'+esc(p.en)+'</text><text class="wl-es" text-anchor="middle" y="13">'+esc(p.es)+'</text></g>';
    });
    return out + '<circle r="98" fill="none" stroke="#2A3D66" stroke-width="4"/></svg>';
  }
  var BODY = {
    // Two cards: who is here · calendar. On the board overview they sit side by side. When the box is open,
    // the part chosen on the iPad (attend, date) fills the box, or 'all' shows both.
    intro: function(){
      return '<div class="intro" id="intro">'
        + '<section class="isec iatt"><h4 class="ititle">'+bi(C.attendance.en, C.attendance.es)+'</h4><div class="att" id="att"></div><div class="attn" id="attN"></div></section>'
        + '<section class="isec ical" id="iDate" data-act="date"><h4 class="ititle">'+bi('Calendar', 'Calendario')+'</h4>' + monthGrid()
        +   '<div class="dline"><span class="k">'+bi('Today is', 'Hoy es')+'</span><div class="dval"><b><span class="f f1">'+esc(D.weekday)+',</span> <span class="f f2">'+esc(D.long)+'</span></b>'
        +   '<i class="f f3">'+esc(D.weekdayEs)+', '+esc(D.longEs)+'</i></div></div></section>'
        + '</div>';
    },
    today: function(){
      return '<div class="today"><div class="td-plan">'
        + C.plan.map(function(p){ var b = boxById(p.box); return '<div class="prow" data-box="'+p.box+'"><span class="pn">'+b.n+'</span>'+ICON[p.icon]+bi(b.title, b.es)+'</div>'; }).join('')
        + '</div></div>';
    },
    ready: function(){
      return '<div class="bb" id="bb" data-chosen=""><div class="bb-grid">'
        + C.brainBreaks.map(function(b, i){ return '<button class="bbt" type="button" data-act="bb" data-id="'+b.id+'"><span class="k">'+(i+1)+'</span><img src="'+esc(b.img)+'" alt="">'+bi(b.en, b.es)+'</button>'; }).join('')
        + '</div><div class="bb-one" id="bbOne" data-act="bbclear"></div></div>';
    },
    move: function(){
      return '<div class="mv" id="mv" data-phase="intro">'
        + '<div class="mv-list"><div class="mv-h" id="mvH"></div><div class="mv-places">'
        + C.places.map(function(p, i){ return '<div class="mvp" data-i="'+i+'" style="--pc:'+p.color+'">'+media(p.img, p.landmark, p.color)
            + '<div class="mvp-t"><b class="lm">'+esc(p.landmark)+'</b>'+bi(p.en, p.es, 'kind')+'<span class="hlp">'+bi(p.helper, p.helperEs)+'</span></div></div>'; }).join('')
        + '</div></div>'
        + '<div class="mv-game"><div class="mv-wheel"><div class="wheel-box"><div class="wheel" id="wheel">'+wheelSVG()+'</div><div class="pointer"></div>'
        + '<button class="hub" type="button" data-act="spin">'+bi('SPIN', 'GIRA')+'</button></div></div><div class="mv-now" id="mvNow"></div></div>'
        + '</div>';
    },
    // Word wall and Letters: a vertical list on the left, the highlighted item as a big card on the right
    wall: function(){
      return '<img class="pep-head" src="img/pep-head.png" alt=""><div class="wl" id="wall"><ol class="wl-list">'
        + C.words.map(function(w, i){ return '<li data-act="word" data-i="'+i+'"><span class="n">'+(i+1)+'</span>'+bi(w.en, w.es)+'</li>'; }).join('')
        + '</ol><div class="wl-card" id="wallCard"></div></div>';
    },
    pep: function(){
      return '<img class="pep-head" src="img/pep-head.png" alt=""><div class="wl ltr-wl" id="ltrs"><ol class="wl-list">'
        + C.letters.map(function(l, i){ return '<li data-act="letter" data-i="'+i+'" style="--lc:'+l.color+'"><b class="L">'+l.L+'<span>'+l.L.toLowerCase()+'</span></b>'+bi(l.word, l.es)+'</li>'; }).join('')
        + '</ol><div class="wl-card" id="ltrCard"></div></div>';
    },
    read: function(){
      return '<div class="rd"><div class="cover-ph" id="rdCover"></div><div class="rd-side"><div class="start" id="rdStart"></div><div class="lvls">'
        + [1,2,3].map(function(n){ return '<button class="lvl" type="button" data-act="level" data-l="'+n+'">'+bi(C.readers[n].label, C.readers[n].labelEs)+'</button>'; }).join('')
        + '</div></div></div><div class="rd-big"><div class="spread" id="spread"></div><div class="rd-bar"><span class="pill" id="rdLvl"></span><span id="rdPage"></span><span class="pill">'+bi('← → turn the page', '← → pasa la página')+'</span></div></div>';
    },
    comp: function(){ return '<div class="cp" id="cp"></div>'; }
  };

  // ---------- build the board ----------
  var boardEl = $('#board');
  boardEl.innerHTML = BOXES.map(function(b){
    return '<article class="panel'+(b.span>1?' span'+b.span:'')+'" data-step="'+b.n+'" data-box="'+b.id+'" style="--c:var(--'+b.color+');--cl:var(--'+b.color+'l)">'
      + CHECK(b.color) + '<div class="head"><div class="num">'+b.n+'</div><div class="ttl"><b>'+esc(b.title)+'</b><i>'+esc(b.es)+'</i></div></div>'
      + '<div class="body">'+BODY[b.id]()+'</div></article>';
  }).join('');
  $('#list').innerHTML = BOXES.map(function(b){
    return '<li data-step="'+b.n+'"><span class="box"><span>'+b.n+'</span><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="lbl"><b>'+esc(b.title)+'</b><i>'+esc(b.es)+'</i></span></li>';
  }).join('');
  $('#eyebrow').innerHTML = '<b>'+esc(C.unit.eyebrow.split(' · ')[0])+'</b> · '+esc(C.unit.eyebrow.split(' · ')[1]||'');
  $('#title').innerHTML = bi(C.unit.title, C.unit.titleEs);
  $('#asideSub').textContent = C.unit.title+' · '+C.site;
  $('#footL').innerHTML = '<b>'+esc(C.site)+'</b> &nbsp;•&nbsp; '+esc(C.unit.eyebrow)+' &nbsp;•&nbsp; DREAMS';
  $('#footR').textContent = D.weekday+', '+D.long;
  var panels = $$('.panel', boardEl), items = $$('#list li');
  var finale = $('#finale'), notes = $('#notes');

  // ---------- render ----------
  var lastAtt = '';
  function renderIntro(){
    $('#iDate').classList.toggle('shown', !!state.dateShown);
    $('#intro').dataset.part = state.introPart || 'attend';
    var here = Math.max(0, state.here|0), total = Math.max(here, state.total|0), key = here+'/'+total;
    if(key===lastAtt) return;
    var grew = lastAtt && here > +lastAtt.split('/')[0];
    var icons = ''; for(var i=0;i<Math.min(total, 30);i++) icons += '<span class="p'+(i<here?' in':'')+(grew && i===here-1?' pop':'')+'">'+PERSON+'</span>';
    $('#att').innerHTML = icons;
    $('#attN').innerHTML = '<span class="big'+(grew?' pop':'')+'">'+here+'</span>'+bi(here===1?'student is here':'students are here', here===1?'estudiante está aquí':'estudiantes están aquí');
    lastAtt = key;
  }
  function renderToday(){
    $$('.prow').forEach(function(r){ var n = boxById(r.dataset.box).n; r.classList.toggle('done', n<state.cur); r.classList.toggle('now', n===state.cur); });
  }
  var lastBB = null;
  function renderReady(){
    var id = state.bb, b = C.brainBreaks.filter(function(x){ return x.id===id; })[0] || null;
    $('#bb').dataset.chosen = b ? b.id : '';
    $$('.bbt').forEach(function(t){ t.classList.toggle('on', !!b && t.dataset.id===b.id); });
    if(lastBB===(b&&b.id)) return; lastBB = b && b.id;
    $('#bbOne').innerHTML = b ? '<img class="bb-card" src="'+esc(b.img)+'" alt="'+esc(b.en)+'"><div class="bb-side">'+bi(b.en, b.es, 'bb-ttl')
      + '<span class="pill">'+bi(b.time, b.timeEs)+'</span>'+bi('Seated or standing', 'Sentado o de pie', 'bb-seat')+'</div>' : '';
  }
  var lastNow = null, wheelRot = null;
  function renderMove(){
    var g = state.game, mv = $('#mv'), wheel = $('#wheel');
    mv.dataset.phase = g.phase;
    $('#mvH').innerHTML = g.phase==='close' ? bi(C.game.closeQ, C.game.closeQEs) : bi(C.game.title, C.game.titleEs);
    $$('.mvp').forEach(function(el){ el.classList.toggle('on', g.phase==='play' && +el.dataset.i===g.place); });
    if(wheelRot!==g.rot){
      if(wheelRot===null){ wheel.style.transition = 'none'; }
      else wheel.style.transition = g.spinning ? 'transform '+SPIN_MS+'ms cubic-bezier(.12,.75,.2,1)' : 'transform .9s cubic-bezier(.3,.9,.3,1)';
      wheel.style.transform = 'rotate('+g.rot+'deg)';
      if(wheelRot===null){ void wheel.offsetWidth; wheel.style.transition = ''; }
      wheelRot = g.rot;
    }
    mv.classList.toggle('spinning', !!g.spinning);
    var key = [g.spinning, g.place, g.signal].join('|');
    if(key===lastNow) return; lastNow = key;
    var now = $('#mvNow'), p = g.place!=null ? C.places[g.place] : null;
    if(g.spinning){ now.innerHTML = '<div class="now-wait spin">'+bi('Where will we go?', '¿A dónde vamos?')+'</div>'; return; }
    if(!p){ now.innerHTML = '<div class="now-wait">'+bi('Spin the wheel!', '¡Gira la rueda!')+'</div>'; return; }
    now.innerHTML = '<div class="now" style="--pc:'+p.color+'">'
      + '<div class="now-pic">'+media(p.img, p.landmark, p.color)+'</div>'
      + '<div class="now-txt"><div class="now-lm"><b>'+esc(p.landmark)+'</b><span class="pill">'+esc(p.city)+'</span></div>'
      +   bi(p.goEn, p.goEs, 'now-go')
      +   '<div class="now-move">'+bi(p.move, p.moveEs, 'mv-m')+bi(p.how, p.howEs, 'mv-how')+'</div></div>'
      + '<div class="cuebar">'+C.cues.map(function(c){ return '<span class="cue '+c.id+(g.signal===c.id?' on':'')+'"><i></i>'+bi(c.en, c.es)+'</span>'; }).join('')+'</div>'
      + (g.signal==='stop' ? '<div class="stopov"><div class="oct">'+bi('STOP', '¡PARA!')+'</div><div class="freeze">'+bi('Freeze!', '¡Congélate!')+'<span class="cd"><em>3</em><em>2</em><em>1</em></span></div></div>' : '')
      + '</div>';
  }
  var lastWall = null, lastLtr = null;
  function speakBtn(text){ return '<button class="speak" type="button" data-act="say" data-say="'+esc(text)+'" aria-label="Say '+esc(text)+'">'+SPEAKER+bi('Listen', 'Escucha')+'</button>'; }
  function renderWall(){
    var i = clampI(state.word, C.words.length), w = C.words[i];
    $$('#wall .wl-list li').forEach(function(li){ var k = +li.dataset.i; li.classList.toggle('on', k===i); li.classList.toggle('seen', k<i); });
    if(lastWall===i) return; lastWall = i;
    $('#wallCard').innerHTML = '<div class="wc">'+media(w.img, w.en)+bi(w.en, w.es, 'wc-w')+speakBtn(w.en)+'</div>';
  }
  function renderLetters(){
    var i = clampI(state.letter, C.letters.length), l = C.letters[i];
    $$('#ltrs .wl-list li').forEach(function(li){ var k = +li.dataset.i; li.classList.toggle('on', k===i); li.classList.toggle('seen', k<i); });
    if(lastLtr===i) return; lastLtr = i;
    $('#ltrCard').innerHTML = '<div class="wc" style="--lc:'+l.color+'"><b class="L">'+l.L+'<span>'+l.L.toLowerCase()+'</span></b>'+media(l.img, l.word, l.color)+bi(l.word, l.es, 'wc-w')+speakBtn(l.L+'. '+l.word)+'</div>';
  }
  function clampI(i, n){ i = +i||0; return Math.max(0, Math.min(n-1, i)); }
  function reader(){ return C.readers[state.level||1]; }
  function renderRead(){
    var L = state.level, r = reader();
    $('#rdCover').innerHTML = bi(C.unit.title, C.unit.titleEs)+'<small>'+bi('Large-print reader', 'Libro de letra grande')+'</small>'+(L?'<span class="lv">'+bi('Level '+L, 'Nivel '+L)+'</span>':'');
    var st = $('#rdStart'), was = st.dataset.l;
    st.className = 'start'+(L?'':' wait');
    st.innerHTML = L ? bi('Start at Level '+L, 'Empezamos en el nivel '+L) : bi('Level set after the quick check', 'El nivel sale de la evaluación');
    if(L && String(L)!==was){ st.classList.add('pop'); }
    st.dataset.l = L||'';
    $$('.lvl').forEach(function(b){ b.classList.toggle('on', +b.dataset.l===L); });
    var pages = r.pages, i = Math.min(state.page, Math.max(0, pages.length-1)); i -= i%2; state.page = i;
    function pg(k){ var p = pages[k]; if(!p) return '<div class="pg blank"></div>';
      return '<div class="pg">'+media(p.img, 'Page '+(k+1))+'<b>'+esc(p.text)+'</b><em>'+(k+1)+'</em></div>'; }
    $('#spread').innerHTML = pg(i)+pg(i+1);
    $('#rdLvl').innerHTML = L ? bi(r.label+' · '+r.kind, r.labelEs+' · '+r.kindEs) : bi('Level 1 (preview) · '+r.kind, 'Nivel 1 (vista previa) · '+r.kindEs);
    var span = (i+1)+(pages[i+1]?'–'+(i+2):'');
    $('#rdPage').innerHTML = bi('Pages '+span+' of '+pages.length, 'Páginas '+span+' de '+pages.length);
  }
  // comprehension: pick n pictures from the reader at the class level, in story order
  function seqCards(){
    var pages = reader().pages, n = C.sequenceCount[state.level||1] || 3, out = [];
    for(var k=0;k<n;k++){ var idx = n===1?0:Math.round(k*(pages.length-1)/(n-1)); out.push({k:k, text:pages[idx].text, img:pages[idx].img}); }
    return out;
  }
  function ensureShuffle(n){
    var sh = state.seq.shuffle;
    if(sh.length!==n){ sh = []; for(var i=0;i<n;i++) sh.push(i);
      for(var j=n-1;j>0;j--){ var r = Math.floor(Math.random()*(j+1)), t = sh[j]; sh[j]=sh[r]; sh[r]=t; }
      if(n>1 && sh.every(function(v,i){ return v===i; })){ sh.push(sh.shift()); }
      state.seq = {placed:[], checked:false, shuffle:sh}; }
    return sh;
  }
  function slotName(k, n){ return k===0 ? bi('First', 'Primero') : k===n-1 ? bi('Last', 'Último') : (n>3 ? bi('Next '+k, 'Luego '+k) : bi('Next', 'Luego')); }
  function renderComp(){
    var cards = seqCards(), n = cards.length, sh = ensureShuffle(n), placed = state.seq.placed, chk = state.seq.checked;
    function card(c, key){ return '<div class="scard" data-act="seq" data-k="'+c.k+'">'+(key?'<span class="k">'+key+'</span>':'')+media(c.img, 'Picture')+'<b>'+esc(c.text)+'</b></div>'; }
    var right = 0;
    var slots = cards.map(function(_, s){ var pk = placed[s], cls = '';
      if(chk && pk!=null){ cls = pk===s ? ' ok' : ' no'; if(pk===s) right++; }
      return '<div class="slot'+cls+'">'+slotName(s,n)+'<div class="well" data-act="unplace" data-s="'+s+'">'+(pk!=null?card(cards[pk]):'')+'</div></div>'; }).join('');
    var pool = sh.map(function(k, pos){ var c = cards[k]; return card(c, pos+1).replace('class="scard"', 'class="scard'+(placed.indexOf(k)>=0?' used':'')+'"'); }).join('');
    $('#cp').innerHTML = '<div class="slots" style="--n:'+n+'">'+slots+'</div><div class="pool" style="--n:'+n+'">'+pool+'</div>'
      + '<div class="cp-foot"><span class="pill">'+(state.level ? bi(n+' pictures · Level '+state.level, n+' dibujos · Nivel '+state.level) : bi(n+' pictures', n+' dibujos'))+'</span>'
      + (chk ? '<span class="res">'+bi(right+' of '+n+' in order', right+' de '+n+' en orden')+'</span>' : bi('Put the pictures in order', 'Ordena los dibujos')) + '</div>';
  }
  function render(){
    var finished = state.cur > LAST;
    panels.forEach(function(p){ var n = +p.dataset.step; p.classList.remove('active','done','upcoming');
      p.classList.add(finished || n<state.cur ? 'done' : n===state.cur ? 'active' : 'upcoming'); });
    items.forEach(function(li){ var n = +li.dataset.step; li.classList.remove('active','done');
      if(finished || n<state.cur) li.classList.add('done'); else if(n===state.cur) li.classList.add('active'); });
    var done = finished ? LAST : state.cur-1;
    $('#pbar').style.width = (done/LAST*100)+'%';
    $('#ptext').textContent = finished ? 'All done ✓' : 'Step '+state.cur+' of '+LAST;
    $('#next').innerHTML = finished ? '↺&nbsp; Start again' : state.cur===LAST ? '✓&nbsp; Finish' : '✓&nbsp; Done — next';
    finale.classList.toggle('show', finished);
    if(finished && !finale.dataset.conf){ confetti(); finale.dataset.conf = '1'; }
    if(!finished) finale.dataset.conf = '';
    var b = boxAt(state.cur), nd = b && C.notes[b.id];
    if(nd){ $('#nt').textContent = nd[0]; $('#nb').textContent = nd[1]; }
    notes.classList.toggle('show', state.notes && !!nd && !finished);
    renderIntro(); renderToday(); renderReady(); renderMove(); renderWall(); renderLetters(); renderRead(); renderComp(); renderFlow();
    save();
  }

  // ---------- actions (also the API the teacher portal calls) ----------
  function next(){ if(state.cur>LAST){ state.cur = 1; } else state.cur++; render(); }
  function back(){ if(state.cur>1){ state.cur = Math.min(state.cur-1, LAST); render(); } }
  function jump(n){ if(n>=1 && n<=LAST){ state.cur = n; render(); } }
  function reset(){ if(pres.mode!=='overview') return; clearTimeout(spinT); state = fresh(); render(); }
  // Today: attendance count from the iPad (the board never sees who is here), the date, and which part fills the open box
  function setAttendance(here, total){ state.here = Math.max(0, +here||0); state.total = Math.max(state.here, +total||0); renderIntro(); save(); }
  var PARTS = ['attend', 'date', 'all'];
  function setIntroPart(p){ if(PARTS.indexOf(p)<0) return; state.introPart = p; renderIntro(); save(); }
  function stepIntroPart(d){ var i = PARTS.indexOf(state.introPart); setIntroPart(PARTS[(Math.max(0,i)+d+PARTS.length)%PARTS.length]); }
  function showDate(on){ state.dateShown = on===undefined ? !state.dateShown : !!on; renderIntro(); save(); }
  // Brain Break: the teacher picks one; null goes back to the four choices
  function setBrainBreak(id){ state.bb = C.brainBreaks.some(function(b){ return b.id===id; }) ? id : null; renderReady(); save(); }
  // Move together game: intro (the four places) → play (wheel left, current place right) → close (who helps here?)
  var spinT = null, SPIN_MS = 4200;
  function gamePhase(p){ if(['intro','play','close'].indexOf(p)<0) return; var g = state.game; g.phase = p; if(p!=='play') g.signal = null; renderMove(); save(); }
  function pickPlace(){ var g = state.game, left = [], i;
    for(i=0;i<NP;i++) if(g.round.indexOf(i)<0 && i!==g.place) left.push(i);
    if(!left.length) for(i=0;i<NP;i++) if(i!==g.place) left.push(i);
    return left[Math.floor(Math.random()*left.length)]; }
  function turnTo(i, extra){ var g = state.game, c = (i+.5)*360/NP, target = ((-c)%360+360)%360, cur = ((g.rot%360)+360)%360;
    g.rot = g.rot + 360*extra + ((target-cur+360)%360); }
  function spin(i){
    var g = state.game; if(g.spinning) return;
    i = (i==null || i==='' || isNaN(i)) ? pickPlace() : ((+i)%NP+NP)%NP;
    g.phase = 'play'; turnTo(i, 5); g.spinning = true; g.pending = i; g.place = null; g.signal = null;
    renderMove(); save();
    clearTimeout(spinT); spinT = setTimeout(land, SPIN_MS+100);
  }
  function land(){ var g = state.game; if(!g.spinning) return;
    g.spinning = false; g.place = g.pending; g.pending = null; g.signal = 'go';
    if(g.round.indexOf(g.place)<0) g.round.push(g.place); if(g.round.length>=NP) g.round = [];
    renderMove(); save(); }
  // show a place directly (e.g. a student drew a paper card)
  function setPlace(i){ var g = state.game; if(g.spinning) return; i = ((+i)%NP+NP)%NP;
    g.phase = 'play'; turnTo(i, 0); g.place = i; g.signal = 'go';
    if(g.round.indexOf(i)<0) g.round.push(i); if(g.round.length>=NP) g.round = [];
    renderMove(); save(); }
  function signal(s){ var g = state.game; if(g.spinning || g.place==null) return; g.signal = ['go','move','stop'].indexOf(s)>=0 ? s : null; renderMove(); save(); }
  // Word wall / Letters: one item at a time
  function setWord(i){ state.word = clampI(i, C.words.length); renderWall(); save(); }
  function setLetter(i){ state.letter = clampI(i, C.letters.length); renderLetters(); save(); }
  // Say a word aloud in English on the board computer (speech built into the browser; no audio files needed)
  function say(text){
    try{ var sp = window.speechSynthesis; if(!sp || !text) return;
      sp.cancel(); var u = new SpeechSynthesisUtterance(String(text)); u.lang = 'en-US'; u.rate = .8;
      var vs = sp.getVoices().filter(function(v){ return /^en[-_]US/i.test(v.lang); });
      var pick = vs.filter(function(v){ return /Samantha|Google US English|Aria|Jenny/i.test(v.name); })[0] || vs[0]; if(pick) u.voice = pick;
      $$('.speak').forEach(function(b){ b.classList.add('talking'); });
      u.onend = u.onerror = function(){ $$('.speak').forEach(function(b){ b.classList.remove('talking'); }); };
      sp.speak(u);
    }catch(e){} }
  try{ if(window.speechSynthesis){ speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function(){ speechSynthesis.getVoices(); }; } }catch(e){}   // Chrome loads voices late
  function sayCurrent(){ var b = boxAt(state.cur), id = b && b.id;
    if(id==='pep'){ var l = C.letters[clampI(state.letter, C.letters.length)]; say(l.L+'. '+l.word); }
    else { say(C.words[clampI(state.word, C.words.length)].en); } }
  // Lesson flow sidebar on/off (off = the boxes use the full width while presenting)
  function setFlow(on){ state.flow = on===undefined ? state.flow===false : !!on; renderFlow(); save(); }
  function renderFlow(){
    var off = state.flow===false, st = $('#stage'); $('#flowBtn').setAttribute('aria-pressed', String(!off));
    if(st.classList.contains('noflow')===off) return;
    st.classList.toggle('noflow', off);
    if(pres.mode==='expanded' && pres.el){ var el = pres.el; el.style.transition = 'none'; setBox(el, stageInner()); expandedBody(el); void el.offsetWidth; el.style.transition = ''; }
  }
  function setLevel(L, source){ L = L ? Math.max(1, Math.min(3, +L)) : null; if(L===state.level) return;
    state.levelLog.push({at:new Date().toISOString(), from:state.level, to:L, source:source||'board'});
    state.level = L; state.page = 0; state.seq = {placed:[], checked:false, shuffle:[]}; render(); }
  function turn(d){ var n = reader().pages.length, p = state.page + 2*d; if(p<0 || p>=n) return; state.page = p; renderRead(); save(); }
  function seqPlace(k){ var pl = state.seq.placed; if(pl.indexOf(k)>=0) return; var s = 0; while(pl[s]!=null) s++;
    if(s>=seqCards().length) return; pl[s] = k; state.seq.checked = false; renderComp(); save(); }
  function seqUnplace(s){ if(state.seq.placed[s]==null) return; state.seq.placed[s] = null; state.seq.checked = false; renderComp(); save(); }
  function seqUndo(){ var pl = state.seq.placed; for(var s=pl.length-1;s>=0;s--){ if(pl[s]!=null){ seqUnplace(s); return; } } }
  function seqCheck(){ state.seq.checked = true; renderComp(); save(); }
  function seqNew(){ state.seq = {placed:[], checked:false, shuffle:[]}; renderComp(); save(); }

  // ---------- clicks ----------
  boardEl.addEventListener('click', function(e){
    var a = e.target.closest('[data-act]');
    if(a){
      e.stopPropagation();
      var act = a.dataset.act;
      if(act==='date'){ showDate(); return; }
      if(act==='bb'){ setBrainBreak(a.dataset.id); return; }
      if(act==='bbclear'){ setBrainBreak(null); return; }
      if(act==='spin'){ spin(); return; }
      if(act==='word'){ setWord(+a.dataset.i); return; }
      if(act==='letter'){ setLetter(+a.dataset.i); return; }
      if(act==='say'){ say(a.dataset.say); return; }
      if(act==='level'){ setLevel(+a.dataset.l===state.level?null:+a.dataset.l, 'board'); return; }
      if(act==='seq'){ seqPlace(+a.dataset.k); return; }
      if(act==='unplace'){ seqUnplace(+a.dataset.s); return; }
    }
    var p = e.target.closest('.panel'); if(p && pres.mode==='overview') jump(+p.dataset.step);
  });
  $('#next').onclick = function(){ if(pres.mode==='overview') next(); };
  $('#back').onclick = function(){ if(pres.mode==='overview') back(); };
  $('#reset').onclick = reset;
  $('#flowBtn').onclick = function(){ setFlow(); };
  items.forEach(function(li){ li.onclick = function(){ if(pres.mode==='overview') jump(+li.dataset.step); }; });

  // ---------- present mode: Enter opens the current box full size, B puts it back ----------
  var pres = {mode:'overview', el:null, ph:null, timer:null}, asideEl = $('aside'), PD = 1300;
  function stageInner(){ var cs = getComputedStyle(boardEl); return {l:parseFloat(cs.paddingLeft), t:parseFloat(cs.paddingTop), w:boardEl.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight), h:boardEl.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom)}; }
  function setBox(el, r){ el.style.left = r.l+'px'; el.style.top = r.t+'px'; el.style.width = r.w+'px'; el.style.height = r.h+'px'; }
  function expandedBody(el){
    var inner = stageInner(), body = el.querySelector('.body'), Wt = inner.w-10, Ht = inner.h-10-88;
    var Z = Math.max(1, Math.min(Wt/el._bw0, Ht/el._bh0, 2.4));
    body.style.width = (Wt/Z)+'px'; body.style.height = (Ht/Z)+'px'; body.style.transform = 'scale('+Z+')';
  }
  function expand(){
    if(pres.mode!=='overview' || state.cur>LAST) return;
    var el = panels[state.cur-1], body = el.querySelector('.body');
    var r = {l:el.offsetLeft, t:el.offsetTop, w:el.offsetWidth, h:el.offsetHeight};
    el._bw0 = body.offsetWidth; el._bh0 = body.offsetHeight;
    body.style.width = el._bw0+'px'; body.style.height = el._bh0+'px'; body.style.transform = 'scale(1)';
    var ph = document.createElement('div'); ph.className = 'ph'+(el.classList.contains('span2')?' span2':el.classList.contains('span3')?' span3':''); boardEl.insertBefore(ph, el);
    el.classList.add('presenting'); setBox(el, r); boardEl.classList.add('presenting'); asideEl.classList.add('locked');
    pres.el = el; pres.ph = ph; pres.mode = 'expanding';
    void el.offsetWidth;
    setTimeout(function(){ setBox(el, stageInner()); el.classList.add('big','bighead'); expandedBody(el); }, 20); // setTimeout, not rAF: keeps working in a background tab
    clearTimeout(pres.timer); pres.timer = setTimeout(function(){ pres.mode = 'expanded'; announce(); }, PD+60);
  }
  function collapse(advance){
    if(pres.mode!=='expanded') return;
    var el = pres.el, ph = pres.ph, body = el.querySelector('.body');
    pres.mode = 'collapsing'; el.classList.add('leaving');
    var r = {l:ph.offsetLeft, t:ph.offsetTop, w:ph.offsetWidth, h:ph.offsetHeight}, EASE = 'cubic-bezier(.7,0,.25,1)';
    var WL = parseFloat(body.style.width)||body.offsetWidth, HL = parseFloat(body.style.height)||body.offsetHeight;
    var sEnd = Math.min(el._bw0/WL, el._bh0/HL), dx = Math.max(0,(el._bw0-WL*sEnd)/2), dy = Math.max(0,(el._bh0-HL*sEnd)/2);
    body.style.transition = 'transform '+PD+'ms '+EASE+', opacity 220ms ease';
    el.classList.remove('bighead'); setBox(el, r); boardEl.classList.remove('presenting');
    body.style.transform = 'translate('+dx+'px,'+dy+'px) scale('+sEnd+')';
    var FADE = Math.round(PD*0.62);
    setTimeout(function(){ body.style.opacity = '0'; }, FADE);
    setTimeout(function(){ body.style.transition = 'none'; el.classList.remove('big','leaving');
      body.style.width = el._bw0+'px'; body.style.height = el._bh0+'px'; body.style.transform = 'none';
      void body.offsetWidth; body.style.transition = 'opacity 260ms ease'; body.style.opacity = '1'; }, FADE+230);
    clearTimeout(pres.timer); pres.timer = setTimeout(function(){
      el.classList.remove('presenting','leaving'); el.style.left = el.style.top = el.style.width = el.style.height = '';
      body.style.width = body.style.height = body.style.transform = body.style.transition = body.style.opacity = '';
      if(ph.parentNode) ph.parentNode.removeChild(ph);
      asideEl.classList.remove('locked'); pres.el = null; pres.ph = null; pres.mode = 'overview';
      if(advance!==false && state.cur<LAST) state.cur++;
      render();
    }, Math.max(PD+80, FADE+510));
  }
  window.addEventListener('resize', function(){ if(pres.mode==='expanded' && pres.el){ var el = pres.el; el.style.transition = 'none'; setBox(el, stageInner()); expandedBody(el); void el.offsetWidth; el.style.transition = ''; } });

  // ---------- keys (inside an open box; see README) ----------
  function boxKey(e){
    var id = boxAt(state.cur).id, k = e.key, kl = k.toLowerCase(), num = (k>='1' && k<='9') ? +k : 0;
    if(id==='intro'){
      if(kl==='d'){ showDate(); return true; }
      if(k==='ArrowRight'){ stepIntroPart(1); return true; } if(k==='ArrowLeft'){ stepIntroPart(-1); return true; } }
    if(id==='ready'){
      if(num && num<=C.brainBreaks.length){ setBrainBreak(C.brainBreaks[num-1].id); return true; } if(k==='0'){ setBrainBreak(null); return true; } }
    if(id==='move'){
      if(num && num<=NP){ setPlace(num-1); return true; }
      if(kl==='w' || k===' '){ spin(); return true; }
      if(kl==='g'){ signal('go'); return true; } if(kl==='m'){ signal('move'); return true; } if(kl==='s'){ signal('stop'); return true; }
      if(kl==='i'){ gamePhase('intro'); return true; } if(kl==='p'){ gamePhase('play'); return true; } if(kl==='c'){ gamePhase('close'); return true; }
    }
    if(id==='wall' || id==='pep'){
      var n = id==='wall' ? C.words.length : C.letters.length, cur = id==='wall' ? state.word : state.letter, set = id==='wall' ? setWord : setLetter;
      if(num && num<=n){ set(num-1); return true; }
      if(k==='ArrowDown'||k==='ArrowRight'||k===' '){ set(cur+1); return true; } if(k==='ArrowUp'||k==='ArrowLeft'){ set(cur-1); return true; }
      if(kl==='s'){ sayCurrent(); return true; }
    }
    if(id==='read'){
      if(num && num<=3){ setLevel(num, 'board-key'); return true; }
      if(k==='ArrowRight'||k===' '||k==='PageDown'){ turn(1); return true; } if(k==='ArrowLeft'||k==='PageUp'){ turn(-1); return true; }
    }
    if(id==='comp'){
      if(num){ var k2 = state.seq.shuffle[num-1]; if(k2!==undefined) seqPlace(k2); return true; }
      if(k==='Backspace'){ seqUndo(); return true; } if(kl==='c'){ seqCheck(); return true; } if(kl==='x'){ seqNew(); return true; }
    }
    return false;
  }
  document.addEventListener('keydown', function(e){
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey) return;
    var k = e.key, kl = k.toLowerCase();
    if(k==='Enter'){ e.preventDefault(); if(!e.repeat) expand(); return; }
    if(kl==='b'){ e.preventDefault(); if(!e.repeat) collapse(); return; }
    if(kl==='n' && !e.repeat){ state.notes = !state.notes; render(); return; }
    if(kl==='l' && !e.shiftKey && !e.repeat){ setFlow(); return; }
    if(pres.mode==='expanded'){ if(!e.repeat && boxKey(e)) e.preventDefault(); return; }
    if(pres.mode!=='overview') return;
    if(k==='ArrowRight'||k===' '||k==='PageDown'){ e.preventDefault(); next(); }
    else if(k==='ArrowLeft'||k==='Backspace'||k==='PageUp'){ e.preventDefault(); back(); }
    else if(k>='1' && k<='9'){ jump(+k); }
    else if(kl==='r'){ reset(); }
    else if(kl==='f'){ try{ var d = document.documentElement; (d.requestFullscreen||d.webkitRequestFullscreen).call(d).catch(function(){}); }catch(err){} }
  });

  function confetti(){
    var cols = ['#2E86D1','#FFC20E','#E63946','#3FA35B','#7A4FBF','#1FA594'];
    for(var i=0;i<60;i++){ var d = document.createElement('i'); d.className = 'confetti'; d.style.left = (Math.random()*100)+'%'; d.style.background = cols[i%cols.length]; d.style.animationDuration = (4+Math.random()*4)+'s'; d.style.animationDelay = (Math.random()*2)+'s'; finale.appendChild(d); }
    setTimeout(function(){ $$('.confetti', finale).forEach(function(c){ c.remove(); }); }, 12000);
  }

  // ---------- fit the 1920×1080 stage to any screen ----------
  function fit(){ var vp = $('#viewport'), w = vp.clientWidth||innerWidth, h = vp.clientHeight||innerHeight; if(!w||!h) return;
    var s = Math.min(w/1920, h/1080), sw = Math.min(w/s, 2400), sh = Math.min(h/s, 1400), st = $('#stage');
    st.style.width = sw+'px'; st.style.height = sh+'px'; st.style.transform = 'translate('+((w-sw*s)/2)+'px,'+((h-sh*s)/2)+'px) scale('+s+')'; }
  addEventListener('resize', fit); addEventListener('load', fit);
  if(window.ResizeObserver) new ResizeObserver(fit).observe($('#viewport'));
  fit(); setTimeout(fit, 300);

  // ---------- control surface for the teacher portal ----------
  var API = { goto:jump, next:next, back:back, open:expand, close:function(){ collapse(false); },
    setAttendance:setAttendance, showDate:showDate, setIntroPart:setIntroPart, setBrainBreak:setBrainBreak,
    gamePhase:gamePhase, spin:spin, setPlace:setPlace, signal:signal,
    setWord:setWord, setLetter:setLetter, say:say, sayCurrent:sayCurrent, setFlow:setFlow,
    setLevel:setLevel, turn:turn, reset:reset, seqCheck:seqCheck, seqUndo:seqUndo, seqNew:seqNew,
    announce:function(){ announce(); }, getState:function(){ return JSON.parse(JSON.stringify(state)); } };
  window.board = API;
  addEventListener('message', function(e){ var d = e.data||{}; if(d.type==='wehelp' && typeof API[d.cmd]==='function' && d.cmd!=='getState') API[d.cmd].apply(null, d.args||[]); });
  // teacher portal link (same device, other tab); board-link.js adds Supabase realtime across devices
  if(chan){ chan.onmessage = function(e){ var d = e.data||{};
    if(d.type==='cmd' && typeof API[d.cmd]==='function' && d.cmd!=='getState') API[d.cmd].apply(null, d.args||[]);
    if(d.type==='hello') announce(); };
    setInterval(announce, 5000); }

  render();
})();
