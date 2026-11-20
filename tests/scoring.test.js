// Run: node --test tests/
// Every table below is copied from Toolkit v2.0, Part 4 "Test cases". The build passes when every row matches.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../site/js/scoring.js');

const START_CASES = [
  // a1..a5,          total, target, level, flags,                                          flagged items
  [[3, 2, 1, 0, 2],   8,  true,  2, ['sound_game'],                                         [3, 4]],
  [[0, 0, 1, 0, 0],   1,  false, 1, ['preteach_words', 'sound_game'],                       [1, 2, 3, 4, 5]],
  [[3, 3, 3, 3, 3],   15, true,  3, [],                                                     []],
  [[2, 1, 2, 2, 1],   8,  true,  2, ['preteach_words', 'needs_model'],                      [2, 5]],
  [[1, 1, 1, 1, 1],   5,  false, 1, ['preteach_words', 'sound_game', 'needs_model'],        [1, 2, 3, 4, 5]],
  [[2, 1, 1, 1, 1],   6,  false, 2, ['preteach_words', 'sound_game', 'needs_model'],        [2, 3, 4, 5]],
  [[2, 2, 1, 1, 1],   7,  false, 2, ['preteach_words', 'sound_game', 'needs_model'],        [3, 4, 5]],
  [[2, 2, 2, 2, 2],   10, true,  2, ['preteach_words'],                                     []],
  [[3, 2, 2, 2, 2],   11, true,  3, [],                                                     []],
];

for (const [a, tot, met, lvl, fl, items] of START_CASES) {
  test(`start scores ${a.join(',')}`, () => {
    assert.equal(S.total(a), tot, 'start_total');
    assert.equal(S.targetMet(S.total(a)), met, 'target_met');
    assert.equal(S.level(S.total(a)), lvl, 'level');
    assert.deepEqual(S.flags(a), fl, 'flags');
    assert.deepEqual(S.flaggedItems(a), items, 'flagged items');
    assert.equal(S.rescreenNeeded(a), items.length > 0, 'rescreen_needed');
  });
}

const END_CASES = [
  // start a1..a5,     second-screen scores (item: score),     end_total, end_level, growth
  [[3, 2, 1, 0, 2],    { 3: 2, 4: 2 },                          11, 3, 3],
  [[0, 0, 1, 0, 0],    { 1: 1, 2: 1, 3: 2, 4: 1, 5: 2 },        7,  2, 6],
  [[1, 1, 1, 1, 1],    { 1: 2, 2: 2 },                          7,  2, 2],   // others blank keep start score
  [[3, 3, 3, 3, 3],    {},                                      15, 3, 0],   // not flagged
];

for (const [a, r, end, endLvl, g] of END_CASES) {
  test(`second screen ${a.join(',')} → ${JSON.stringify(r)}`, () => {
    assert.equal(S.endTotal(a, r), end, 'end_total');
    assert.equal(S.level(S.endTotal(a, r)), endLvl, 'end_level');
    assert.equal(S.growth(a, r), g, 'growth');
  });
}

const CLASS_CASES = [
  [[1, 2, 2, 3], 2],
  [[1, 1, 2, 2], 1],      // tie → lower level
  [[3, 3, 1, 1, 2], 1],   // tie → lower level
];
for (const [levels, expected] of CLASS_CASES) {
  test(`class level for ${levels.join(',')}`, () => assert.equal(S.classLevel(levels), expected));
}

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

// ---- data-integrity rules (lesson plan §03 + toolkit) ----
test('missing items are never zero: total is blank until all 5 are scored', () => {
  assert.equal(S.total([3, 3, null, 3, 3]), null);
  assert.equal(S.level(S.total([3, 3, null, 3, 3])), null);
  assert.equal(S.targetMet(null), null);
  assert.deepEqual(S.missingItems({ a1: 2, a2: 0 }), [3, 4, 5]);
  assert.deepEqual(S.flaggedItems([0, 0, null, 0, 0]), []);   // no flags from an incomplete screen
});

test('a 0 is a real score (no response), not missing', () => {
  assert.equal(S.total([0, 0, 0, 0, 0]), 0);
  assert.equal(S.level(0), 1);
});

test('scores outside 0–3 are rejected', () => {
  assert.throws(() => S.total([4, 0, 0, 0, 0]), RangeError);
  assert.throws(() => S.endTotal([0, 0, 0, 0, 0], { 1: 5 }), RangeError);
});

test('level band edges', () => {
  assert.deepEqual([0, 5, 6, 10, 11, 15].map(S.level), [1, 1, 2, 2, 3, 3]);
});

test('second-screen scores on items that were not flagged are ignored', () => {
  // 3,2,1,0,2 flags items 3 and 4 only
  assert.equal(S.endTotal([3, 2, 1, 0, 2], { 1: 0, 2: 0, 3: 2, 4: 2 }), 11);
});

test('a lower second-screen score counts (honest reporting)', () => {
  assert.equal(S.growth([1, 1, 1, 1, 1], { 1: 0 }), -1);
});

test('bonus never changes the total', () => {
  assert.equal(S.student({ a1: 1, a2: 1, a3: 1, a4: 1, a5: 1, bonus: 3 }).start_total, 5);
});

test('class level ignores unscreened students; none screened → blank', () => {
  assert.equal(S.classLevel([null, 3, undefined]), 3);
  assert.equal(S.classLevel([]), null);
});

// ---- class summary, picker, CSV ----
const roster = [
  { student_no: 1, a1: 3, a2: 2, a3: 1, a4: 0, a5: 2, r3: 2, r4: 2, stop_yes: 3, stop_no: 1, response_mode: 'speech', engaged: true },
  { student_no: 2, a1: 0, a2: 0, a3: 1, a4: 0, a5: 0, zero_notes: { a1: 'distracted', a4: 'did not want to take part' }, stop_yes: 1, stop_no: 2, engaged: false, engagement_note: 'tired, said "later"' },
  { student_no: 3, a1: 3, a2: 3, a3: 3, a4: 3, a5: 3, bonus: 2, a1_missed: [] },
  { student_no: 4, a1: 2, a2: 2 },   // screen not finished
];

test('class summary', () => {
  const c = S.classSummary(roster);
  assert.equal(c.screened, 3);
  assert.equal(c.not_screened, 1);
  assert.equal(c.target_met, 2);
  assert.deepEqual(c.level_counts, { 1: 1, 2: 1, 3: 1 });
  assert.equal(c.class_level, 1);                // three-way tie → lowest
  assert.deepEqual(c.rescreen_list, [0, 1]);
  assert.equal(c.stop_percent, 57.1);            // 4 of 7
  assert.deepEqual(c.flag_counts, { preteach_words: 1, sound_game: 2, needs_model: 0 });
  assert.ok(!c.recommendations.some(r => r.flag === 'repeat_stop_go'));
  assert.equal(c.students[3].complete, false);
  assert.deepEqual(c.students[3].missing, [3, 4, 5]);
  assert.equal(c.students[0].rescreen_done, true);
  assert.equal(c.students[1].rescreen_done, false);
});

test('sequencing picker calls second-screen students first', () => {
  assert.deepEqual(S.pickerOrder([roster[2], roster[0], roster[3], roster[1]]), [1, 3, 0, 2]);
});

test('CSV: column order, no names, quoting', () => {
  const csv = S.toCSV(roster.map(r => ({ ...r, first_name: 'SHOULD_NOT_APPEAR' })), '2026-12-01');
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], 'student_no,session_date,a1,a2,a3,a4,a5,a1_missed,bonus,zero_notes,response_mode,engaged,engagement_note,start_total,target_met,start_level,r1,r2,r3,r4,r5,end_total,end_level,growth,stop_yes,stop_no');
  assert.equal(lines.length, 5);
  assert.ok(!csv.includes('SHOULD_NOT_APPEAR'));
  assert.equal(lines[1], '1,2026-12-01,3,2,1,0,2,,,,speech,yes,,8,yes,2,,,2,2,,11,3,3,3,1');
  assert.ok(lines[2].includes('"tired, said ""later"""'));
  assert.ok(lines[2].includes('item 1: distracted; item 4: did not want to take part'));
  assert.equal(S.csvFileName('2026-12-01'), 'DREAMS_WeHelpQuickCheck_Results_2026-12-01_v01.csv');
});
