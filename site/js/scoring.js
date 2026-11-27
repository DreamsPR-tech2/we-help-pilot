/* We Help! Quick Check scoring: the 9-point primary screen.
 * Source of truth: Kristen's scoring note to Madeline (Nov 2026), which replaces the 0–3 column of Toolkit v2.0.
 * Every rule lives here so the portal, board and report all agree.
 *
 * Works in the browser (window.WeHelpScoring) and in Node (require) for tests.
 *
 * Items (numbered as in the toolkit; record keys in brackets, `a` = first screen, `r` = second screen):
 *   Item 3 [a1] Receptive vocabulary   0–5  1 point per word shown correctly (help, do, see, go, stop)
 *   Item 4 [a2] Expressive vocabulary  0–1  1 = communicates at least 3 of the 5 words
 *   Item 5 [a3] Two-step direction     0–1  1 = both steps, in order
 *   Item 6 [a4] Target sound           0–1  1 = produces the target sound correctly
 *   Item 7 [a5] Anchor sentence        0–1  1 = communicates "We help." (both words, any mode)
 *   Item 8 [bonus] Bonus               not scored: Completed / Attempted / Not offered
 * Total = items 3–7 = 0 to 9. Levels: 0–3 → 1 (0 is also flagged for the teacher), 4–6 → 2, 7–9 → 3.
 *
 * Every item also stores a status: correct / attempted (Attempted-incorrect) / no_response / not_administered.
 * "Not administered" leaves the score blank (never a zero). If any core item is not administered, there is no
 * total and no automatic level: the teacher sets the level (level_override).
 * A score of null/undefined with no status means "not given yet", which is NOT a zero either.
 */
(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory();
  else root.WeHelpScoring = factory();
})(typeof self !== 'undefined' ? self : this, function(){
  'use strict';

  var ITEMS = [3, 4, 5, 6, 7];
  var KEY = { 3: 'a1', 4: 'a2', 5: 'a3', 6: 'a4', 7: 'a5' };
  var MAX = { 3: 5, 4: 1, 5: 1, 6: 1, 7: 1 };
  var MAX_TOTAL = 9;
  var TARGET = 5;          // ASSUMPTION: 50% of the total, rounded up, as Toolkit v2.0 did with 8 of 15. To confirm.
  var BIG5 = ['help', 'do', 'see', 'go', 'stop'];
  var RESPONSE_MODES = ['speech', 'pointing', 'gesture', 'sign', 'AAC', 'Spanish'];
  var SUPPORT = { independent: 'Independent', prompt: 'Prompt', model: 'Model' };   // I / P / M, as in the readers
  var STATUS = { correct: 'Correct', attempted: 'Attempted-incorrect', no_response: 'No response', not_administered: 'Not administered' };
  var BONUS = ['Completed', 'Attempted', 'Not offered'];

  var ITEM_INFO = {
    3: { area: 'Receptive vocabulary', max: 5 },
    4: { area: 'Expressive vocabulary', max: 1 },
    5: { area: 'Two-step direction', max: 1 },
    6: { area: 'Target sound', max: 1 },
    7: { area: 'Anchor sentence', max: 1 },
    8: { area: 'Bonus (not scored)', max: 0 }
  };

  // Class-level "what to do tomorrow" flags.
  var FLAGS = {
    preteach_words: 'Pre-teach the missing Big 5 words before the reader.',
    sound_game:     'Add a quick /h/ sound game before the reader.',
    needs_model:    'Understands but needs a model: partner echo, then fade support.',
    repeat_stop_go: 'Tomorrow: repeat the stop-and-go activity before adding a new executive skill.'
  };
  // Per-student flags for the teacher.
  var TEACHER_FLAGS = {
    zero_total: 'Total 0: starts at Level 1. Teacher to review.',
    set_level:  'An item was not administered: no automatic level. The teacher sets the starting level.'
  };

  function given(v){ return v !== null && v !== undefined && v !== ''; }
  function isStatus(s){ return Object.prototype.hasOwnProperty.call(STATUS, s); }
  function checkScore(n, v, label){
    if(v === null) return v;
    if(typeof v !== 'number' || v !== Math.floor(v) || v < 0 || v > MAX[n]) throw new RangeError((label || 'Item '+n)+' score must be 0–'+MAX[n]+' (got '+v+')');
    return v;
  }

  // ---------- one item: raw observation → score + status ----------
  // x: { status?, words?: [...] (item 3), count?: 0–5 (item 4), steps?: 0–2, in_order?: bool (item 5),
  //      sound?: bool (item 6), anchor?: 0–2 words (item 7) }
  // status 'no_response' → 0, 'not_administered' → blank. Otherwise the score comes from the raw data and the
  // status is Correct when the item earns a point, Attempted-incorrect when it earns none.
  function scoreItem(n, x){
    x = x || {};
    if(x.status === 'not_administered') return { score: null, status: 'not_administered' };
    if(x.status === 'no_response') return { score: 0, status: 'no_response' };
    var sc;
    if(n === 3){ sc = BIG5.filter(function(w){ return (x.words || []).indexOf(w) >= 0; }).length; }
    else if(n === 4){ if(!given(x.count)) return null; sc = +x.count >= 3 ? 1 : 0; }
    else if(n === 5){ if(!given(x.steps)) return null; sc = +x.steps === 2 && x.in_order !== false ? 1 : 0; }
    else if(n === 6){ if(typeof x.sound !== 'boolean') return null; sc = x.sound ? 1 : 0; }
    else if(n === 7){ if(!given(x.anchor)) return null; sc = +x.anchor === 2 ? 1 : 0; }
    else throw new RangeError('No item '+n);
    return { score: sc, status: sc > 0 ? 'correct' : 'attempted' };
  }

  // ---------- reading a record ----------
  // rec: { a1..a5, a1_status..a5_status, r1..r5, r1_status.., level_override, ... }  or an array of 5 scores (items 3–7).
  function itemOf(rec, n, p){
    p = p || 'a';
    var k = KEY[n].replace(/^a/, p), v, st;
    if(Array.isArray(rec)){ v = rec[ITEMS.indexOf(n)]; st = null; }
    else { v = rec ? rec[k] : null; st = rec ? rec[k+'_status'] : null; }
    v = given(v) ? +v : null;
    if(st !== null && st !== undefined && !isStatus(st)) throw new RangeError('Unknown status for item '+n+': '+st);
    if(st === 'not_administered') v = null;                    // never a zero
    else if(st === 'no_response') v = 0;
    else if(!st && v !== null) st = v > 0 ? 'correct' : 'attempted';   // a bare score (tests, old rows)
    checkScore(n, v, (p === 'r' ? 'Second-screen item ' : 'Item ')+n);
    return { n: n, score: v, status: st || null, done: !!st };
  }
  function itemsOf(rec, p){ return ITEMS.map(function(n){ return itemOf(rec, n, p); }); }

  // Items with nothing recorded yet (no status, no score).
  function missingItems(a){ return itemsOf(a).filter(function(i){ return !i.done; }).map(function(i){ return i.n; }); }
  function notAdministered(a){ return itemsOf(a).filter(function(i){ return i.status === 'not_administered'; }).map(function(i){ return i.n; }); }
  function isComplete(a){ return missingItems(a).length === 0; }

  // Total of items 3–7. Null until every item has a result, and null if any item was not administered.
  function total(a){
    var it = itemsOf(a);
    if(it.some(function(i){ return !i.done || i.status === 'not_administered'; })) return null;
    return it.reduce(function(s, i){ return s + i.score; }, 0);
  }
  // Sum of the items that were given, for display when an item was not administered.
  function partialTotal(a){ return itemsOf(a).reduce(function(s, i){ return s + (i.score || 0); }, 0); }
  function targetMet(t){ return t === null || t === undefined ? null : t >= TARGET; }
  // Level bands: 0–3 → 1, 4–6 → 2, 7–9 → 3.
  function level(t){ if(t === null || t === undefined) return null; if(t < 0 || t > MAX_TOTAL) throw new RangeError('Total out of range: '+t); return t <= 3 ? 1 : t <= 6 ? 2 : 3; }
  function overrideOf(rec){ var L = rec && !Array.isArray(rec) ? rec.level_override : null; L = given(L) ? +L : null; return L === 1 || L === 2 || L === 3 ? L : null; }
  // The level the student starts at: the teacher's override if there is one, else the automatic level.
  function startLevel(a){ var o = overrideOf(a); return o || level(total(a)); }

  // Second screen: for a Level 1 or 2 student, item 3 with 0–2 words and items 4–7 scored 0.
  // ASSUMPTION: carries over Toolkit v2.0's "items scored 0 or 1 on the 0–3 scale". Not-administered items are not flagged.
  function lowItem(i){ return i.score !== null && (i.n === 3 ? i.score <= 2 : i.score === 0); }
  // Students with a not-administered item have no total to compare against, so they get no second screen.
  function flaggedItems(a){
    var L = startLevel(a);
    if(total(a) === null || (L !== 1 && L !== 2)) return [];
    return itemsOf(a).filter(lowItem).map(function(i){ return i.n; });
  }
  function rescreenNeeded(a){ return flaggedItems(a).length > 0; }

  // end_total: start total with each re-screened flagged item replaced by its new score.
  // A flagged item with no new score keeps its start score; scores for items that were not flagged are ignored.
  function endTotal(a, r){
    var st = total(a); if(st === null) return null;
    var fl = flaggedItems(a);
    return itemsOf(a).reduce(function(sum, i){
      var v = i.score;
      if(fl.indexOf(i.n) >= 0){ var re = itemOf(r, i.n, Array.isArray(r) ? 'a' : 'r'); if(re.score !== null) v = re.score; }
      return sum + v; }, 0);
  }
  function growth(a, r){ var st = total(a), en = endTotal(a, r); return st === null || en === null ? null : en - st; }

  // Per-student "what to do tomorrow" flags (ids in FLAGS).
  function flags(a){
    var it = itemsOf(a), out = [], rec = Array.isArray(a) ? {} : (a || {});
    if(it[0].score !== null && it[0].score < 5) out.push('preteach_words');
    if(it[3].score === 0) out.push('sound_game');
    if(rec.a2_support === 'model' || rec.a5_support === 'model') out.push('needs_model');
    return out;
  }
  // Per-student teacher flags (ids in TEACHER_FLAGS).
  function teacherFlags(a){
    var out = [];
    if(total(a) === 0) out.push('zero_total');
    if(notAdministered(a).length && !overrideOf(a)) out.push('set_level');
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

  // Full result for one student record. A record that breaks the rules (e.g. old 0–3 scores still on a device)
  // comes back as not complete with `invalid` set, so one bad row never stops the portal.
  function student(rec){
    try{ return studentStrict(rec); }
    catch(e){
      if(!(e instanceof RangeError)) throw e;
      return { complete: false, invalid: e.message, missing: ITEMS.slice(), not_administered: [], items: [], start_total: null, partial_total: null,
        target_met: null, auto_level: null, level_override: null, start_level: null, needs_teacher_level: false, flags: [], teacher_flags: [],
        flagged_items: [], rescreen_needed: false, rescreen_done: false, end_total: null, end_level: null, growth: null, rescreened: false };
    }
  }
  function studentStrict(rec){
    var complete = isComplete(rec), st = total(rec), auto = level(st), ov = overrideOf(rec), L = ov || auto;
    var na = notAdministered(rec), fl = complete ? flaggedItems(rec) : [];
    var hasRe = fl.some(function(n){ return itemOf(rec, n, 'r').done; });
    var en = complete ? endTotal(rec, rec) : null;
    return {
      complete: complete,
      missing: missingItems(rec),
      not_administered: na,
      items: itemsOf(rec),
      start_total: st, partial_total: partialTotal(rec), target_met: targetMet(st),
      auto_level: auto, level_override: ov, start_level: complete ? L : null,
      needs_teacher_level: complete && na.length > 0 && !ov,
      flags: complete ? flags(rec) : [],
      teacher_flags: complete ? teacherFlags(rec) : [],
      flagged_items: fl, rescreen_needed: fl.length > 0,
      rescreen_done: fl.length > 0 && fl.every(function(n){ return itemOf(rec, n, 'r').done; }),
      end_total: en, end_level: hasRe && en !== null ? level(en) : (complete ? L : null), growth: growth(rec, rec), rescreened: hasRe
    };
  }

  // Whole-class summary. recs: array of student records (only complete screens count toward class numbers).
  function classSummary(recs){
    recs = recs || [];
    var res = recs.map(student), done = res.filter(function(r){ return r.complete; });
    var yes = 0, no = 0, flagCount = {preteach_words:0, sound_game:0, needs_model:0}, tflag = {zero_total:0, set_level:0};
    recs.forEach(function(r){ yes += +r.stop_yes || 0; no += +r.stop_no || 0; });
    done.forEach(function(r){ r.flags.forEach(function(f){ flagCount[f]++; }); r.teacher_flags.forEach(function(f){ tflag[f]++; }); });
    var pct = stopPercent(yes, no), cl = classLevel(done.map(function(r){ return r.start_level; }));
    var rescreenList = [];
    res.forEach(function(r, k){ if(r.complete && r.rescreen_needed) rescreenList.push(k); });
    var recos = Object.keys(flagCount).filter(function(f){ return flagCount[f] > 0; });
    stopFlags(pct).forEach(function(f){ recos.push(f); });
    var withTotal = done.filter(function(r){ return r.start_total !== null; });
    return {
      students: res,
      screened: done.length, not_screened: res.length - done.length,
      target_met: withTotal.filter(function(r){ return r.target_met; }).length, with_total: withTotal.length,
      level_counts: [1, 2, 3].reduce(function(o, L){ o[L] = done.filter(function(r){ return r.start_level === L; }).length; return o; }, {}),
      needs_teacher_level: done.filter(function(r){ return r.needs_teacher_level; }).length,
      class_level: cl,
      flag_counts: flagCount, teacher_flag_counts: tflag,
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
  // A not-administered item has a blank score and the status "Not administered".
  var CSV_COLUMNS = ['student_no', 'session_date',
    'item3_score', 'item3_status', 'item3_words_correct',
    'item4_score', 'item4_status', 'item4_words_count', 'item4_mode', 'item4_support',
    'item5_score', 'item5_status', 'item5_steps', 'item5_in_order', 'item5_assistance',
    'item6_score', 'item6_status',
    'item7_score', 'item7_status', 'item7_words', 'item7_mode', 'item7_support',
    'item8_bonus',
    'total', 'auto_level', 'level_override', 'level_override_reason', 'start_level', 'target_met', 'teacher_flags',
    'notes', 'response_mode', 'engaged', 'engagement_note',
    're_item3', 're_item4', 're_item5', 're_item6', 're_item7', 'end_total', 'end_level', 'growth', 'stop_yes', 'stop_no'];
  function csvCell(v){
    if(v === null || v === undefined) return '';
    if(typeof v === 'boolean') return v ? 'yes' : 'no';
    var s = String(v);
    return /[",\n\r]/.test(s) ? '"'+s.replace(/"/g, '""')+'"' : s;
  }
  function notesText(rec){
    var z = rec.zero_notes; if(!z) return '';
    if(typeof z === 'string') return z;
    return Object.keys(z).filter(function(k){ return z[k]; }).sort().map(function(k){
      var m = /^([ar])(\d)$/.exec(k), lbl = m ? (m[1] === 'r' ? '2nd screen item ' : 'item ')+ITEMS[+m[2]-1] : k;
      return lbl+': '+z[k]; }).join('; ');
  }
  function toCSV(recs, sessionDate){
    var lines = [CSV_COLUMNS.join(',')];
    (recs || []).forEach(function(rec){
      var r = student(rec), it = r.items, row = {
        student_no: rec.student_no, session_date: sessionDate || rec.session_date,
        item8_bonus: rec.bonus,
        total: r.start_total, auto_level: r.auto_level, level_override: r.level_override, level_override_reason: rec.level_override_reason,
        start_level: r.start_level, target_met: r.target_met, teacher_flags: r.invalid ? 'invalid_scores' : r.teacher_flags.join(';'),
        notes: notesText(rec), response_mode: rec.response_mode,
        engaged: typeof rec.engaged === 'boolean' ? rec.engaged : null, engagement_note: rec.engagement_note,
        end_total: r.rescreened ? r.end_total : null, end_level: r.rescreened ? r.end_level : null, growth: r.rescreened ? r.growth : null,
        stop_yes: rec.stop_yes, stop_no: rec.stop_no,
        item3_words_correct: it[0] && it[0].done && it[0].status !== 'not_administered' ? (rec.a1_words || []).join(';') : null,
        item4_words_count: rec.a2_count, item4_mode: rec.a2_mode, item4_support: SUPPORT[rec.a2_support] || rec.a2_support,
        item5_steps: rec.a3_steps, item5_in_order: typeof rec.a3_in_order === 'boolean' ? rec.a3_in_order : null, item5_assistance: SUPPORT[rec.a3_support] || rec.a3_support,
        item7_words: rec.a5_anchor, item7_mode: rec.a5_mode, item7_support: SUPPORT[rec.a5_support] || rec.a5_support
      };
      // Details recorded before the screener chose No response / Not administered are left out.
      var RAW = { 3: ['item3_words_correct'], 4: ['item4_words_count', 'item4_mode', 'item4_support'], 5: ['item5_steps', 'item5_in_order', 'item5_assistance'], 6: [], 7: ['item7_words', 'item7_mode', 'item7_support'] };
      it.forEach(function(i){ if(i.status !== 'correct' && i.status !== 'attempted') RAW[i.n].forEach(function(c){ row[c] = null; }); });
      it.forEach(function(i){ row['item'+i.n+'_score'] = i.score; row['item'+i.n+'_status'] = i.status ? STATUS[i.status] : null;
        row['re_item'+i.n] = r.flagged_items.indexOf(i.n) >= 0 ? itemOf(rec, i.n, 'r').score : null; });
      lines.push(CSV_COLUMNS.map(function(c){ return csvCell(row[c]); }).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }
  function csvFileName(sessionDate){ return 'DREAMS_WeHelpQuickCheck_Results_'+(sessionDate || '2026-12-01')+'_v02.csv'; }

  return {
    ITEMS: ITEMS, KEY: KEY, MAX: MAX, TARGET: TARGET, MAX_TOTAL: MAX_TOTAL, BIG5: BIG5, RESPONSE_MODES: RESPONSE_MODES,
    SUPPORT: SUPPORT, STATUS: STATUS, BONUS: BONUS, ITEM_INFO: ITEM_INFO, FLAGS: FLAGS, TEACHER_FLAGS: TEACHER_FLAGS, CSV_COLUMNS: CSV_COLUMNS,
    scoreItem: scoreItem, itemOf: itemOf, missingItems: missingItems, notAdministered: notAdministered, isComplete: isComplete,
    total: total, partialTotal: partialTotal, targetMet: targetMet, level: level, startLevel: startLevel,
    flags: flags, teacherFlags: teacherFlags,
    flaggedItems: flaggedItems, rescreenNeeded: rescreenNeeded, endTotal: endTotal, growth: growth,
    classLevel: classLevel, stopPercent: stopPercent, stopFlags: stopFlags,
    student: student, classSummary: classSummary, pickerOrder: pickerOrder,
    toCSV: toCSV, csvFileName: csvFileName
  };
});
