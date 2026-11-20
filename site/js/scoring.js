/* We Help! Quick Check scoring.
 * Source of truth: DREAMS We Help! Quick Check Toolkit v2.0 (Nov 18, 2026), Part 4 "Scoring rules" and
 * "Flags and recommendation". Every rule lives here so the portal, board and report all agree.
 *
 * Works in the browser (window.WeHelpScoring) and in Node (require) for tests.
 *
 * Scores: each item is 0, 1, 2 or 3. `null`/`undefined` means "not given yet", which is NOT a zero.
 * A 0 means the student gave no response (the screener adds a note saying why).
 */
(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory();
  else root.WeHelpScoring = factory();
})(typeof self !== 'undefined' ? self : this, function(){
  'use strict';

  var ITEMS = [1, 2, 3, 4, 5];
  var TARGET = 8;          // 50% of 15
  var MAX_TOTAL = 15;
  var BIG5 = ['help', 'do', 'see', 'go', 'stop'];
  var RESPONSE_MODES = ['speech', 'pointing', 'gesture', 'sign', 'AAC', 'Spanish'];

  var ITEM_INFO = {
    1: { area: 'Receptive vocabulary' },
    2: { area: 'Expressive vocabulary' },
    3: { area: '2-step direction' },
    4: { area: 'Target sound' },
    5: { area: 'Anchor sentence' },
    bonus: { area: 'Sentence frame (bonus)' }
  };

  var FLAGS = {
    preteach_words: 'Pre-teach the missing Big 5 words before the reader.',
    sound_game:     'Add a quick /h/ sound game before the reader.',
    needs_model:    'Understands but needs a model: partner echo, then fade support.',
    repeat_stop_go: 'Tomorrow: repeat the stop-and-go activity before adding a new executive skill.'
  };

  function isScore(v){ return v === 0 || v === 1 || v === 2 || v === 3; }
  function given(v){ return v !== null && v !== undefined && v !== ''; }

  // a: {a1..a5} or [a1..a5]. Returns [a1..a5] with null for anything not given.
  function scoresOf(a){
    var out = ITEMS.map(function(i){ var v = Array.isArray(a) ? a[i-1] : a && a['a'+i]; return given(v) ? +v : null; });
    out.forEach(function(v, k){ if(v !== null && !isScore(v)) throw new RangeError('Item '+(k+1)+' score must be 0, 1, 2 or 3 (got '+v+')'); });
    return out;
  }
  function rescoresOf(r){
    if(!r) return [null, null, null, null, null];
    return ITEMS.map(function(i){ var v = Array.isArray(r) ? r[i-1] : r['r'+i] !== undefined ? r['r'+i] : r[i];
      if(!given(v)) return null; v = +v; if(!isScore(v)) throw new RangeError('Second-screen item '+i+' must be 0, 1, 2 or 3 (got '+v+')'); return v; });
  }

  // Returns the list of item numbers (1–5) that have no score yet.
  function missingItems(a){ var s = scoresOf(a), out = []; s.forEach(function(v, k){ if(v === null) out.push(k+1); }); return out; }
  function isComplete(a){ return missingItems(a).length === 0; }

  // start_total = a1 + … + a5. Null until all 5 are scored (missing data never becomes zero).
  function total(a){ var s = scoresOf(a); if(s.indexOf(null) >= 0) return null; return s.reduce(function(x, y){ return x + y; }, 0); }
  function targetMet(t){ return t === null || t === undefined ? null : t >= TARGET; }
  // Level bands: 0–5 → 1, 6–10 → 2, 11–15 → 3.
  function level(t){ if(t === null || t === undefined) return null; if(t < 0 || t > MAX_TOTAL) throw new RangeError('Total out of range: '+t); return t <= 5 ? 1 : t <= 10 ? 2 : 3; }

  // Items scored 0 or 1, for a student at Level 1 or 2. Level 3 students have none.
  function flaggedItems(a){
    var s = scoresOf(a), L = level(total(a));
    if(L !== 1 && L !== 2) return [];
    return ITEMS.filter(function(i){ return s[i-1] === 0 || s[i-1] === 1; });
  }
  function rescreenNeeded(a){ return flaggedItems(a).length > 0; }

  // end_total: start total with each re-screened flagged item replaced by its new score.
  // A flagged item with no new score keeps its start score; scores for items that were not flagged are ignored.
  function endTotal(a, r){
    var s = scoresOf(a), rs = rescoresOf(r), fl = flaggedItems(a);
    if(s.indexOf(null) >= 0) return null;
    return ITEMS.reduce(function(sum, i){ var v = s[i-1]; if(fl.indexOf(i) >= 0 && rs[i-1] !== null) v = rs[i-1]; return sum + v; }, 0);
  }
  function growth(a, r){ var st = total(a), en = endTotal(a, r); return st === null || en === null ? null : en - st; }

  // Per-student flags (ids in FLAGS).
  function flags(a){
    var s = scoresOf(a), out = [];
    if(s[0] !== null && s[0] <= 2) out.push('preteach_words');
    if(s[3] !== null && s[3] <= 1) out.push('sound_game');
    if(s[1] === 1 || s[4] === 1) out.push('needs_model');
    return out;
  }

  // Class level: the level held by the most screened students; on a tie, the lowest tied level.
  function classLevel(levels){
    var n = {1:0, 2:0, 3:0}, any = false;
    (levels || []).forEach(function(L){ if(L === 1 || L === 2 || L === 3){ n[L]++; any = true; } });
    if(!any) return null;
    var best = 1; [2, 3].forEach(function(L){ if(n[L] > n[best]) best = L; });
    return best;
  }

  // stop_percent = yes / (yes + no) across all watched students, 0–100. Null if nothing was observed.
  function stopPercent(yes, no){ yes = +yes || 0; no = +no || 0; return yes + no === 0 ? null : Math.round(yes / (yes + no) * 1000) / 10; }
  function stopFlags(pct){ return pct !== null && pct !== undefined && pct < 50 ? ['repeat_stop_go'] : []; }

  // Full result for one student record.
  // rec: { a1..a5, r1..r5, bonus, a1_missed, zero_notes, response_mode, engaged, engagement_note, stop_yes, stop_no, ... }
  function student(rec){
    var st = total(rec), L = level(st), fl = flaggedItems(rec), en = endTotal(rec, rec), hasRe = fl.some(function(i){ return given(rec['r'+i]); });
    return {
      complete: st !== null,
      missing: missingItems(rec),
      start_total: st, target_met: targetMet(st), start_level: L,
      flags: st === null ? [] : flags(rec),
      flagged_items: fl, rescreen_needed: fl.length > 0,
      rescreen_done: fl.length > 0 && fl.every(function(i){ return given(rec['r'+i]); }),
      end_total: en, end_level: level(en), growth: growth(rec, rec), rescreened: hasRe
    };
  }

  // Whole-class summary. recs: array of student records (only complete screens count toward class numbers).
  function classSummary(recs){
    recs = recs || [];
    var res = recs.map(student), done = res.filter(function(r){ return r.complete; });
    var yes = 0, no = 0, flagCount = {preteach_words:0, sound_game:0, needs_model:0};
    recs.forEach(function(r){ yes += +r.stop_yes || 0; no += +r.stop_no || 0; });
    done.forEach(function(r){ r.flags.forEach(function(f){ flagCount[f]++; }); });
    var pct = stopPercent(yes, no), cl = classLevel(done.map(function(r){ return r.start_level; }));
    var rescreenList = [];
    res.forEach(function(r, k){ if(r.complete && r.rescreen_needed) rescreenList.push(k); });
    var recos = Object.keys(flagCount).filter(function(f){ return flagCount[f] > 0; });
    stopFlags(pct).forEach(function(f){ recos.push(f); });
    return {
      students: res,
      screened: done.length, not_screened: res.length - done.length,
      target_met: done.filter(function(r){ return r.target_met; }).length,
      level_counts: [1, 2, 3].reduce(function(o, L){ o[L] = done.filter(function(r){ return r.start_level === L; }).length; return o; }, {}),
      class_level: cl,
      flag_counts: flagCount,
      rescreen_list: rescreenList,       // indexes into recs
      stop_yes: yes, stop_no: no, stop_percent: pct,
      recommendations: recos.map(function(f){ return { flag: f, text: FLAGS[f], students: f === 'repeat_stop_go' ? null : flagCount[f] }; })
    };
  }

  // Order for the sequencing student picker: second-screen students first (not random), then everyone else.
  function pickerOrder(recs){
    var res = (recs || []).map(student), first = [], rest = [];
    res.forEach(function(r, k){ (r.complete && r.rescreen_needed ? first : rest).push(k); });
    return first.concat(rest);
  }

  // ---------- CSV export (no names) ----------
  var CSV_COLUMNS = ['student_no','session_date','a1','a2','a3','a4','a5','a1_missed','bonus','zero_notes','response_mode','engaged','engagement_note','start_total','target_met','start_level','r1','r2','r3','r4','r5','end_total','end_level','growth','stop_yes','stop_no'];
  function csvCell(v){
    if(v === null || v === undefined) return '';
    if(typeof v === 'boolean') return v ? 'yes' : 'no';
    var s = String(v);
    return /[",\n\r]/.test(s) ? '"'+s.replace(/"/g, '""')+'"' : s;
  }
  function zeroNotesText(rec){
    var z = rec.zero_notes; if(!z) return '';
    if(typeof z === 'string') return z;
    return Object.keys(z).filter(function(k){ return z[k]; }).sort().map(function(k){ return 'item '+String(k).replace(/^a/, '')+': '+z[k]; }).join('; ');
  }
  function toCSV(recs, sessionDate){
    var lines = [CSV_COLUMNS.join(',')];
    (recs || []).forEach(function(rec){
      var r = student(rec), row = {
        student_no: rec.student_no, session_date: sessionDate || rec.session_date,
        a1: rec.a1, a2: rec.a2, a3: rec.a3, a4: rec.a4, a5: rec.a5,
        a1_missed: Array.isArray(rec.a1_missed) ? rec.a1_missed.join(';') : rec.a1_missed,
        bonus: rec.bonus, zero_notes: zeroNotesText(rec), response_mode: rec.response_mode,
        engaged: typeof rec.engaged === 'boolean' ? rec.engaged : null, engagement_note: rec.engagement_note,
        start_total: r.start_total, target_met: r.target_met, start_level: r.start_level,
        r1: r.flagged_items.indexOf(1) >= 0 ? rec.r1 : null, r2: r.flagged_items.indexOf(2) >= 0 ? rec.r2 : null,
        r3: r.flagged_items.indexOf(3) >= 0 ? rec.r3 : null, r4: r.flagged_items.indexOf(4) >= 0 ? rec.r4 : null,
        r5: r.flagged_items.indexOf(5) >= 0 ? rec.r5 : null,
        end_total: r.end_total, end_level: r.end_level, growth: r.growth,
        stop_yes: rec.stop_yes, stop_no: rec.stop_no
      };
      lines.push(CSV_COLUMNS.map(function(c){ return csvCell(row[c]); }).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }
  function csvFileName(sessionDate){ return 'DREAMS_WeHelpQuickCheck_Results_'+(sessionDate || '2026-12-01')+'_v01.csv'; }

  return {
    ITEMS: ITEMS, TARGET: TARGET, MAX_TOTAL: MAX_TOTAL, BIG5: BIG5, RESPONSE_MODES: RESPONSE_MODES, ITEM_INFO: ITEM_INFO, FLAGS: FLAGS, CSV_COLUMNS: CSV_COLUMNS,
    isScore: isScore, missingItems: missingItems, isComplete: isComplete,
    total: total, targetMet: targetMet, level: level, flags: flags,
    flaggedItems: flaggedItems, rescreenNeeded: rescreenNeeded, endTotal: endTotal, growth: growth,
    classLevel: classLevel, stopPercent: stopPercent, stopFlags: stopFlags,
    student: student, classSummary: classSummary, pickerOrder: pickerOrder,
    toCSV: toCSV, csvFileName: csvFileName
  };
});
