// Run: node --test tests/
// Rules from Kristen's 9-point scoring note (replaces the 0–3 column of Toolkit v2.0).
// Arrays are scores for items 3, 4, 5, 6, 7 in that order.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../site/js/scoring.js');

// ---- one item: what the screener records → score + status ----
test('item 3: 1 point per word shown correctly', () => {
  assert.deepEqual(S.scoreItem(3, { words: ['help', 'go', 'stop'] }), { score: 3, status: 'correct' });
  assert.deepEqual(S.scoreItem(3, { words: S.BIG5 }), { score: 5, status: 'correct' });
  assert.deepEqual(S.scoreItem(3, { words: [] }), { score: 0, status: 'attempted' });
  assert.deepEqual(S.scoreItem(3, { words: ['help', 'banana'] }), { score: 1, status: 'correct' });   // only the Big 5 count
});
test('item 4: 1 point for at least 3 of the 5 words', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(n => S.scoreItem(4, { count: n }).score), [0, 0, 0, 1, 1, 1]);
  assert.equal(S.scoreItem(4, { count: 2 }).status, 'attempted');
  assert.equal(S.scoreItem(4, {}), null);   // nothing recorded yet
});
test('item 5: 1 point only for both steps in order', () => {
  assert.equal(S.scoreItem(5, { steps: 2, in_order: true }).score, 1);
  assert.equal(S.scoreItem(5, { steps: 2, in_order: false }).score, 0);
  assert.equal(S.scoreItem(5, { steps: 1 }).score, 0);
  assert.equal(S.scoreItem(5, { steps: 0 }).score, 0);
});
test('item 6: correct sound', () => {
  assert.deepEqual(S.scoreItem(6, { sound: true }), { score: 1, status: 'correct' });
  assert.deepEqual(S.scoreItem(6, { sound: false }), { score: 0, status: 'attempted' });
});
test('item 7: both words of "We help."', () => {
  assert.equal(S.scoreItem(7, { anchor: 2 }).score, 1);
  assert.equal(S.scoreItem(7, { anchor: 1 }).score, 0);
  assert.equal(S.scoreItem(7, { anchor: 0 }).score, 0);
});
test('No response is 0; Not administered is blank, never 0', () => {
  for (const n of S.ITEMS) {
    assert.deepEqual(S.scoreItem(n, { status: 'no_response', words: S.BIG5, count: 5 }), { score: 0, status: 'no_response' });
    assert.deepEqual(S.scoreItem(n, { status: 'not_administered' }), { score: null, status: 'not_administered' });
  }
});

// ---- totals and levels ----
const START_CASES = [
  // items 3–7,       total, level, flags,                                       second-screen items
  [[5, 1, 1, 1, 1],   9, 3, [],                                                   []],
  [[3, 1, 1, 1, 1],   7, 3, ['preteach_words'],                                   []],
  [[5, 1, 0, 0, 0],   6, 2, ['sound_game'],                                       [5, 6, 7]],
  [[2, 1, 1, 0, 0],   4, 2, ['preteach_words', 'sound_game'],                     [3, 6, 7]],
  [[3, 0, 0, 0, 0],   3, 1, ['preteach_words', 'sound_game'],                     [4, 5, 6, 7]],
  [[1, 0, 0, 1, 0],   2, 1, ['preteach_words'],                                   [3, 4, 5, 7]],
  [[0, 0, 0, 0, 0],   0, 1, ['preteach_words', 'sound_game'],                     [3, 4, 5, 6, 7]],
];
for (const [a, tot, lvl, fl, items] of START_CASES) {
  test(`start scores ${a.join(',')}`, () => {
    assert.equal(S.total(a), tot, 'total');
    assert.equal(S.level(S.total(a)), lvl, 'level');
    assert.equal(S.startLevel(a), lvl, 'start level');
    assert.deepEqual(S.flags(a), fl, 'flags');
    assert.deepEqual(S.flaggedItems(a), items, 'second-screen items');
  });
}
test('level bands: 0–3 → 1, 4–6 → 2, 7–9 → 3', () => {
  assert.deepEqual([0, 1, 3, 4, 6, 7, 9].map(S.level), [1, 1, 1, 2, 2, 3, 3]);
  assert.throws(() => S.level(10), RangeError);
});
test('a total of 0 starts at Level 1 and is flagged for the teacher', () => {
  const r = S.student({ a1: 0, a2: 0, a3: 0, a4: 0, a5: 0 });
  assert.equal(r.start_total, 0);
  assert.equal(r.start_level, 1);
  assert.deepEqual(r.teacher_flags, ['zero_total']);
});
test('scores outside each item range are rejected', () => {
  assert.throws(() => S.total([6, 0, 0, 0, 0]), RangeError);
  assert.throws(() => S.total([5, 2, 0, 0, 0]), RangeError);
  assert.throws(() => S.total({ a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, a3_status: 'maybe' }), RangeError);
  assert.throws(() => S.endTotal([0, 0, 0, 0, 0], [0, 3, 0, 0, 0]), RangeError);
});

// ---- not administered and missing ----
const NA = { a1: 4, a1_status: 'correct', a2: 1, a2_status: 'correct', a3: null, a3_status: 'not_administered', a4: 1, a4_status: 'correct', a5: 1, a5_status: 'correct' };
test('a not-administered item stays blank: no total, no automatic level, teacher flag', () => {
  const r = S.student(NA);
  assert.equal(r.complete, true);
  assert.deepEqual(r.not_administered, [5]);
  assert.equal(r.items[2].score, null);
  assert.equal(r.start_total, null);
  assert.equal(r.partial_total, 7);
  assert.equal(r.auto_level, null);
  assert.equal(r.start_level, null);
  assert.equal(r.needs_teacher_level, true);
  assert.deepEqual(r.teacher_flags, ['set_level']);
  assert.deepEqual(r.flagged_items, []);
});
test('not administered wins over a stray score', () => {
  assert.equal(S.itemOf({ a3: 0, a3_status: 'not_administered' }, 5).score, null);
});
test('teacher override sets the level and clears the flag', () => {
  const r = S.student({ ...NA, level_override: 2, level_override_reason: 'Ran out of time' });
  assert.equal(r.start_level, 2);
  assert.equal(r.needs_teacher_level, false);
  assert.deepEqual(r.teacher_flags, []);
});
test('teacher override also works on a full screen', () => {
  assert.equal(S.student({ a1: 5, a2: 1, a3: 0, a4: 0, a5: 0, level_override: 3 }).start_level, 3);
  assert.equal(S.student({ a1: 5, a2: 1, a3: 0, a4: 0, a5: 0, level_override: 3 }).auto_level, 2);
});
test('items not recorded yet are never zero', () => {
  assert.equal(S.total([5, 1, null, 1, 1]), null);
  assert.deepEqual(S.missingItems({ a1: 2, a2: 0 }), [5, 6, 7]);
  assert.equal(S.student({ a1: 2, a2: 0 }).start_level, null);
  assert.deepEqual(S.flaggedItems([0, 0, null, 0, 0]), []);
});
test('No response counts as 0 even without a stored score', () => {
  assert.equal(S.total({ a1: 5, a2: 1, a3: 1, a4: 1, a5_status: 'no_response' }), 8);
});
test('bonus never changes the total', () => {
  assert.equal(S.student({ a1: 1, a2: 1, a3: 1, a4: 1, a5: 1, bonus: 'Completed' }).start_total, 5);
});

// ---- flags that use stored support ----
test('needs_model when items 4 or 7 needed a model', () => {
  assert.deepEqual(S.flags({ a1: 5, a2: 1, a3: 1, a4: 1, a5: 1, a5_support: 'model' }), ['needs_model']);
  assert.deepEqual(S.flags({ a1: 5, a2: 0, a3: 1, a4: 1, a5: 1, a2_support: 'model' }), ['needs_model']);
  assert.deepEqual(S.flags({ a1: 5, a2: 1, a3: 1, a4: 1, a5: 1, a2_support: 'prompt' }), []);
});

// ---- second screen ----
const END_CASES = [
  // start items 3–7,  second-screen scores (items 3–7),  end_total, end_level, growth
  [[5, 1, 0, 0, 0],    [null, null, 1, 1, 0],            8, 3, 2],
  [[0, 0, 0, 0, 0],    [3, 1, 0, 1, 1],                  6, 2, 6],
  [[2, 1, 1, 0, 0],    [5, null, null, null, null],      7, 3, 3],    // others blank keep start score
  [[5, 1, 1, 1, 1],    [],                               9, 3, 0],    // not flagged
];
for (const [a, r, end, endLvl, g] of END_CASES) {
  test(`second screen ${a.join(',')} → ${r.join(',')}`, () => {
    assert.equal(S.endTotal(a, r), end, 'end_total');
    assert.equal(S.level(S.endTotal(a, r)), endLvl, 'end_level');
    assert.equal(S.growth(a, r), g, 'growth');
  });
}
test('second-screen scores on items that were not flagged are ignored', () => {
  assert.equal(S.endTotal([5, 1, 0, 0, 0], [0, 0, 1, 1, 1]), 9);   // items 3 and 4 not flagged
  assert.equal(S.endTotal([5, 1, 0, 0, 0], [0, 0, 0, 0, 0]), 6);
});
test('a lower second-screen score counts (honest reporting)', () => {
  assert.equal(S.growth([2, 0, 0, 0, 0], [1, null, null, null, null]), -1);
});
test('second screen reads r-fields from a stored record', () => {
  const rec = { a1: 5, a2: 1, a3: 0, a4: 0, a5: 0, r3: 1, r3_status: 'correct', r4: null, r4_status: 'not_administered' };
  const r = S.student(rec);
  assert.deepEqual(r.flagged_items, [5, 6, 7]);
  assert.equal(r.end_total, 7);
  assert.equal(r.rescreen_done, false);   // item 7 not re-screened yet
});

// ---- class ----
const CLASS_CASES = [
  [[1, 2, 2, 3], 2],
  [[1, 1, 2, 2], 1],      // tie → lower level
  [[3, 3, 1, 1, 2], 1],   // tie → lower level
];
for (const [levels, expected] of CLASS_CASES) {
  test(`class level for ${levels.join(',')}`, () => assert.equal(S.classLevel(levels), expected));
}
test('class level ignores unscreened students; none screened → blank', () => {
  assert.equal(S.classLevel([null, 3, undefined]), 3);
  assert.equal(S.classLevel([]), null);
});

const STOP_CASES = [
  [6, 2, 75, false],
  [1, 3, 25, true],
  [0, 0, null, false],
];
for (const [yes, no, pct, flag] of STOP_CASES) {
  test(`stop check ${yes} yes / ${no} no`, () => {
    assert.equal(S.stopPercent(yes, no), pct);
    assert.deepEqual(S.stopFlags(S.stopPercent(yes, no)), flag ? ['repeat_stop_go'] : []);
  });
}

// ---- class summary, picker, CSV ----
const roster = [
  { student_no: 1, a1: 5, a1_status: 'correct', a1_words: S.BIG5, a2: 1, a2_status: 'correct', a2_count: 4, a2_mode: 'speech', a2_support: 'independent',
    a3: 0, a3_status: 'attempted', a3_steps: 1, a3_support: 'prompt', a4: 0, a4_status: 'attempted', a5: 0, a5_status: 'no_response',
    r3: 1, r3_status: 'correct', r4: 1, r4_status: 'correct', r5: 1, r5_status: 'correct', stop_yes: 3, stop_no: 1, response_mode: 'speech', engaged: true },
  { student_no: 2, a1: 0, a1_status: 'no_response', a2: 0, a2_status: 'no_response', a3: 0, a3_status: 'attempted', a4: 0, a4_status: 'attempted', a5: 0, a5_status: 'attempted',
    zero_notes: { a1: 'distracted', a4: 'did not want to take part' }, stop_yes: 1, stop_no: 2, engaged: false, engagement_note: 'tired, said "later"' },
  { student_no: 3, a1: 5, a2: 1, a3: 1, a4: 1, a5: 1, a5_anchor: 2, a5_mode: 'AAC', a5_support: 'model', bonus: 'Completed' },
  { student_no: 4, a1: 2, a2: 0 },   // screen not finished
  { ...NA, student_no: 5 },
];

test('class summary', () => {
  const c = S.classSummary(roster);
  assert.equal(c.screened, 4);
  assert.equal(c.not_screened, 1);
  assert.equal(c.with_total, 3);
  assert.equal(c.target_met, 2);                 // 6 and 9 meet 5+; 0 does not
  assert.deepEqual(c.level_counts, { 1: 1, 2: 1, 3: 1 });
  assert.equal(c.needs_teacher_level, 1);
  assert.equal(c.class_level, 1);                // three-way tie → lowest
  assert.deepEqual(c.rescreen_list, [0, 1]);
  assert.equal(c.stop_percent, 57.1);            // 4 of 7
  assert.deepEqual(c.flag_counts, { preteach_words: 2, sound_game: 2, needs_model: 1 });
  assert.deepEqual(c.teacher_flag_counts, { zero_total: 1, set_level: 1 });
  assert.equal(c.students[3].complete, false);
  assert.deepEqual(c.students[3].missing, [5, 6, 7]);
  assert.equal(c.students[0].rescreen_done, true);
  assert.equal(c.students[0].end_total, 9);
  assert.equal(c.students[1].rescreen_done, false);
});

test('sequencing picker calls second-screen students first', () => {
  assert.deepEqual(S.pickerOrder([roster[2], roster[0], roster[3], roster[1]]), [1, 3, 0, 2]);
});

test('CSV: column order, no names, statuses, blanks for not administered', () => {
  const csv = S.toCSV(roster.map(r => ({ ...r, first_name: 'SHOULD_NOT_APPEAR' })), '2026-12-01');
  const lines = csv.trim().split('\r\n');
  const head = lines[0].split(',');
  assert.equal(lines[0], S.CSV_COLUMNS.join(','));
  assert.equal(lines.length, 6);
  assert.ok(!csv.includes('SHOULD_NOT_APPEAR'));
  const row = i => { const cells = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c => c.replace(/,$/, '')); return Object.fromEntries(head.map((h, k) => [h, cells[k]])); };
  const r1 = row(1);
  assert.equal(r1.item3_score, '5'); assert.equal(r1.item3_words_correct, 'help;do;see;go;stop');
  assert.equal(r1.item4_words_count, '4'); assert.equal(r1.item4_support, 'Independent');
  assert.equal(r1.item5_steps, '1'); assert.equal(r1.item5_status, 'Attempted-incorrect'); assert.equal(r1.item5_assistance, 'Prompt');
  assert.equal(r1.item7_status, 'No response'); assert.equal(r1.item7_score, '0');
  assert.equal(r1.total, '6'); assert.equal(r1.start_level, '2');
  assert.equal(r1.re_item5, '1'); assert.equal(r1.end_total, '9'); assert.equal(r1.growth, '3');
  const r2 = row(2);
  assert.equal(r2.engagement_note, '"tired, said ""later"""');
  assert.equal(r2.notes, 'item 3: distracted; item 6: did not want to take part');
  assert.equal(r2.teacher_flags, 'zero_total');
  assert.equal(row(3).item8_bonus, 'Completed');
  const r5 = row(5);
  assert.equal(r5.item5_score, ''); assert.equal(r5.item5_status, 'Not administered');
  assert.equal(r5.total, ''); assert.equal(r5.start_level, ''); assert.equal(r5.teacher_flags, 'set_level');
  assert.equal(S.csvFileName('2026-12-01'), 'DREAMS_WeHelpQuickCheck_Results_2026-12-01_v02.csv');
});

test('old 0–3 scores on a device do not break the class summary', () => {
  const c = S.classSummary([{ a1: 3, a2: 2, a3: 1, a4: 0, a5: 3 }, { a1: 5, a2: 1, a3: 1, a4: 1, a5: 1 }]);
  assert.ok(c.students[0].invalid);
  assert.equal(c.students[0].complete, false);
  assert.equal(c.screened, 1);
  assert.ok(S.toCSV([{ student_no: 1, a1: 3, a2: 2 }]).startsWith('student_no,'));
});
