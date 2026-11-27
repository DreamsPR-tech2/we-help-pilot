/* Quick Check items 3–8 (the 9-point primary screen; scoring rules are in scoring.js).
 * Show/say wording comes from Toolkit v2.0. Items 4–8 wording is still marked draft for Kristen & Cari to confirm:
 * edit the text here and the screener picks it up. `mat` = which picture cards the student card mat shows.
 * `input` = what the screener records:
 *   words  tap each word the student showed correctly (score = number correct)
 *   count  how many of the 5 words the student communicated, plus response mode and support
 *   steps  steps completed (0, 1, 2) and whether in order, plus assistance level
 *   sound  correct or incorrect
 *   anchor both words / one word / none, plus response mode and support
 *   bonus  Completed / Attempted / Not offered (never scored)
 * Every scored item also has "No response" and "Not administered" buttons.
 */
window.WEHELP_ITEMS = [
  { n: 3, key: 'a1', area: 'Receptive vocabulary', draft: false, input: 'words',
    show: 'All 5 Big 5 cards in a row', say: '“Point to HELP… STOP… SEE… GO… DO.”',
    rule: '1 point per word shown correctly (0–5).',
    mat: ['help', 'do', 'see', 'go', 'stop'] },
  { n: 4, key: 'a2', area: 'Expressive vocabulary', draft: true, input: 'count',
    show: 'The Big 5 cards, one at a time', say: '“What is this word?”',
    rule: '1 point if the student names, signs or otherwise communicates at least 3 of the 5 words.',
    mat: ['help', 'do', 'see', 'go', 'stop'] },
  { n: 5, key: 'a3', area: 'Two-step direction', draft: true, input: 'steps',
    show: 'Help and stop cards, with the First/Next cards', say: '“First touch HELP. Next, give me STOP.”',
    rule: '1 point if the student completes both steps, in order.',
    mat: ['help', 'stop'] },
  { n: 6, key: 'a4', area: 'Target sound', draft: true, input: 'sound',
    show: 'Help card', say: '“Say /h/… help.”',
    rule: '1 point if the student produces the target sound correctly.',
    mat: ['help'] },
  { n: 7, key: 'a5', area: 'Anchor sentence', draft: true, input: 'anchor',
    show: '“We help.” anchor card', say: '“Your turn: say our sentence.”',
    rule: '1 point if the student communicates “We help.” (both words, any mode).',
    mat: ['anchor'] },
  { n: 8, key: 'bonus', area: 'Bonus (not scored)', draft: true, optional: true, input: 'bonus',
    show: 'Teacher picture. Only if the student is clearly ready', say: '“I see a ___.”',
    rule: 'No points. Never added to the total.',
    mat: ['teacher'] }
];

// Card mat pictures. `img: null` draws a simple pictogram placeholder (no words: students must not see labels).
window.WEHELP_CARDS = {
  help:    { img: null, color: '#2E86D1', glyph: '<path d="M14 40c6 2 14 2 20-2l8-6c2-2 0-5-3-4l-9 5"/><path d="M8 34l8-8c3-3 7-3 10 0l4 3h-8"/><circle cx="30" cy="12" r="4"/><path d="M30 17v7"/>' },
  do:      { img: null, color: '#E63946', glyph: '<path d="M10 38l12-12M22 26l6 6M28 32l12-12M18 18l12 12"/><circle cx="34" cy="14" r="6"/>' },
  see:     { img: null, color: '#3FA35B', glyph: '<path d="M4 24s8-12 20-12 20 12 20 12-8 12-20 12S4 24 4 24z"/><circle cx="24" cy="24" r="6"/>' },
  go:      { img: null, color: '#7A4FBF', glyph: '<path d="M6 24h30M26 12l12 12-12 12"/>' },
  stop:    { img: null, color: '#E63946', glyph: '<path d="M17 4h14l10 10v14L31 38H17L7 28V14z"/><path d="M18 21h12"/>' },
  walking: { img: null, color: '#F28C28', glyph: '<circle cx="26" cy="8" r="4"/><path d="M24 14l-4 12 6 6v10M20 26l-6 14M24 16l8 6M22 18l-8 4"/>' },
  anchor:  { img: null, color: '#E2559A', glyph: '<circle cx="16" cy="16" r="5"/><circle cx="32" cy="16" r="5"/><path d="M8 40c0-8 4-14 8-14s8 6 8 14M24 40c0-8 4-14 8-14s8 6 8 14"/>' },
  teacher: { img: null, color: '#1FA594', glyph: '<circle cx="18" cy="12" r="5"/><path d="M8 42V26c0-4 4-7 10-7s10 3 10 7v16"/><rect x="30" y="8" width="14" height="12" rx="1"/><path d="M26 26l6-6"/>' }
};
