/* Quick Check items, from Toolkit v2.0 "Questions and rubric".
 * Item 1 follows the scale agreed in the meeting. Items 2–5 and the bonus are drafts for Kristen & Cari to confirm:
 * edit the text here and the screener picks it up. `mat` = which picture cards the student card mat shows.
 */
window.WEHELP_ITEMS = [
  { n: 1, key: 'a1', area: 'Receptive vocabulary', draft: false,
    show: 'All 5 Big 5 cards in a row', say: '“Point to HELP… STOP… SEE… GO… DO.”',
    rubric: ['No response, or none correct', '1–2 correct', '3–4 correct', '5 correct'],
    mat: ['help', 'do', 'see', 'go', 'stop'] },
  { n: 2, key: 'a2', area: 'Expressive vocabulary', draft: true,
    show: 'Picture of a student walking (or the go action)', say: '“What is she doing?”',
    rubric: ['No response', 'Gives the word only after a model', 'Gives “go” alone', 'Gives a phrase alone (“We go”)'],
    mat: ['walking'] },
  { n: 3, key: 'a3', area: '2-step direction', draft: true,
    show: 'Help and stop cards, with the First/Next cards', say: '“First touch HELP. Next, give me STOP.”',
    rubric: ['No response', 'One step', 'Both steps, out of order or after a repeat', 'Both steps, in order, the first time'],
    mat: ['help', 'stop'] },
  { n: 4, key: 'a4', area: 'Target sound', draft: true,
    show: 'Help and see cards', say: '“Which one starts with /h/?”',
    rubric: ['No response', 'Chooses, but not the right card', 'Correct after the sound is repeated', 'Correct the first time'],
    mat: ['help', 'see'] },
  { n: 5, key: 'a5', area: 'Anchor sentence', draft: true,
    show: '“We help.” anchor card', say: '“Your turn: say our sentence.”',
    rubric: ['No response', 'Echoes after a model', 'Gives part of it alone (“help”)', 'Gives “We help!” alone'],
    mat: ['anchor'] },
  { n: 'bonus', key: 'bonus', area: 'Sentence frame (bonus)', draft: true, optional: true,
    show: 'Teacher picture. Only if the student is clearly ready', say: '“I see a ___.”',
    rubric: ['No response', 'Gives one word', 'Completes the frame after a model', 'Gives the full frame alone'],
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
