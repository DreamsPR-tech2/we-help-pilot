/* We Help! board content.
 * Everything the board shows lives here, so real media can be dropped in without touching the board code.
 * Any `img: null` draws a labelled placeholder tile. To add real art, put the file in site/img/ and set
 * `img: 'img/your-file.png'`.
 *
 * Language rule (everywhere): English in bold, the Spanish equivalent right below it in italics.
 * Give every student-facing string an `en` and an `es` so the board can follow it.
 */
window.WEHELP = {
  unit: { eyebrow: 'Unit 3 · Community Helpers', title: 'We Help!', titleEs: '¡Ayudamos!', anchor: 'We help.', anchorEs: 'Ayudamos.' },
  site: 'Escuela La Esperanza',

  // Box order on the board and in the sidebar. `span` is how many grid columns the box takes (4 per row, 3 rows).
  boxes: [
    { id: 'intro', n: 1, title: 'Today',         es: 'Hoy',               span: 2, color: 'c9' },
    { id: 'today', n: 2, title: 'Plan',          es: 'Plan',              span: 1, color: 'c2' },
    { id: 'ready', n: 3, title: 'Brain Break',   es: 'Pausa activa',      span: 1, color: 'c3' },
    { id: 'move',  n: 4, title: 'Move together', es: 'Nos movemos',       span: 2, color: 'c8' },
    { id: 'wall',  n: 5, title: 'Word wall',     es: 'Muro de palabras',  span: 1, color: 'c4' },
    { id: 'pep',   n: 6, title: 'Letters',       es: 'Letras',            span: 1, color: 'c1' },
    { id: 'read',  n: 7, title: 'Read together', es: 'Leemos juntos',     span: 2, color: 'c5' },
    { id: 'comp',  n: 8, title: 'Comprehension', es: 'Comprensión',       span: 2, color: 'c7' }
  ],

  // Box 1. Today: attendance, then the calendar. Weekdays are written out in full.
  attendance: { en: 'Who is here?', es: '¿Quién está aquí?' },
  weekdays: [
    { en: 'Sunday', es: 'domingo' }, { en: 'Monday', es: 'lunes' }, { en: 'Tuesday', es: 'martes' },
    { en: 'Wednesday', es: 'miércoles' }, { en: 'Thursday', es: 'jueves' }, { en: 'Friday', es: 'viernes' },
    { en: 'Saturday', es: 'sábado' }
  ],

  // Box 2. Plan rows (boxes 3–8).
  plan: [
    { box: 'ready', icon: 'breath' },
    { box: 'move',  icon: 'move' },
    { box: 'wall',  icon: 'words' },
    { box: 'pep',   icon: 'letters' },
    { box: 'read',  icon: 'book' },
    { box: 'comp',  icon: 'order' }
  ],

  // Box 3. Brain Break. The teacher picks one from the iPad, based on how the class is doing.
  // `when` is a hint shown on the iPad only.
  brainBreaks: [
    { id: 'fivefinger', en: 'Five-Finger Breathing', es: 'Respiración de cinco dedos', img: 'img/bb-five-finger.jpg',
      when: 'To settle and focus before a task', time: '5 breaths', timeEs: '5 respiraciones' },
    { id: 'calm',       en: 'Calm Breathing',        es: 'Respiración tranquila',      img: 'img/bb-calm.jpg',
      when: 'When the class is excited or upset', time: '4 rounds', timeEs: '4 rondas' },
    { id: 'notice',     en: 'Notice 3-2-1',          es: 'Observa 3-2-1',              img: 'img/bb-notice.jpg',
      when: 'When attention is scattered', time: '1 minute', timeEs: '1 minuto' },
    { id: 'march',      en: 'March in Place',        es: 'Marcha en el lugar',         img: 'img/bb-march.jpg',
      when: 'When energy is low', time: '1 minute', timeEs: '1 minuto' }
  ],
  brainBreakGuide: 'img/bb-guide.jpg',

  // Box 4. "Let's Explore Puerto Rico: Go, Move and Stop" (Dec 1 game guide v4). Spin, go to the sign, do the move, freeze on STOP.
  // img: null until the place art arrives. Spanish wording needs a check by the team.
  game: {
    title: 'Let’s Explore Puerto Rico', titleEs: '¡Exploremos Puerto Rico!',
    closeQ: 'Who helps here?', closeQEs: '¿Quién ayuda aquí?'
  },
  places: [
    { id: 'school', landmark: 'Escuela La Esperanza', city: 'San Juan', color: '#2E86D1', img: null,
      en: 'School', es: 'Escuela',
      goEn: 'Go to the school.', goEs: 'Ve a la escuela.',
      helper: 'teacher', helperEs: 'maestra',
      move: 'Open the book.', moveEs: 'Abre el libro.',
      how: 'Arms together, then open wide.', howEs: 'Junta los brazos y ábrelos.' },
    { id: 'mall', landmark: 'Plaza Las Américas', city: 'San Juan', color: '#E2559A', img: null,
      en: 'Mall', es: 'Centro comercial',
      goEn: 'Go to the mall.', goEs: 'Ve al centro comercial.',
      helper: 'cashier', helperEs: 'cajero',
      move: 'Scan the groceries.', moveEs: 'Escanea la compra.',
      how: 'Hold the item. Twist side to side.', howEs: 'Sostén el artículo. Gira de lado a lado.' },
    { id: 'fort', landmark: 'El Morro', city: 'San Juan', color: '#3FA35B', img: null,
      en: 'Fort', es: 'Fuerte',
      goEn: 'Go to the fort.', goEs: 'Ve al fuerte.',
      helper: 'park ranger', helperEs: 'guardaparques',
      move: 'Look out.', moveEs: 'Mira a lo lejos.',
      how: 'Hand over eyes. Turn left, then right.', howEs: 'Mano sobre los ojos. Gira a la izquierda y a la derecha.' },
    { id: 'firehouse', landmark: 'Parque de Bombas', city: 'Ponce', color: '#E63946', img: null,
      en: 'Firehouse', es: 'Estación de bomberos',
      goEn: 'Go to the firehouse.', goEs: 'Ve a la estación de bomberos.',
      helper: 'firefighter', helperEs: 'bombero',
      move: 'Pick up and carry.', moveEs: 'Levanta y carga.',
      how: 'Reach down, then lift up. Seated: lean forward.', howEs: 'Baja las manos y levanta. Sentado: inclínate hacia adelante.' }
  ],
  // The three game cues, in order
  cues: [
    { id: 'go',   en: 'GO',   es: '¡Ve!' },
    { id: 'move', en: 'MOVE', es: '¡Muévete!' },
    { id: 'stop', en: 'STOP', es: '¡Para!' }
  ],

  // Box 6. Letters.
  letters: [
    { L: 'H', word: 'help', es: 'ayuda', color: '#2E86D1', img: null },
    { L: 'D', word: 'do',   es: 'hacer', color: '#E63946', img: null },
    { L: 'S', word: 'see',  es: 'ver',   color: '#3FA35B', img: null },
    { L: 'G', word: 'go',   es: 'ir',    color: '#7A4FBF', img: null }
  ],
  // Box 5. Word wall: the five unit words, one at a time. The speaker button says the English word aloud.
  words: [
    { en: 'help', es: 'ayuda', img: null },
    { en: 'do',   es: 'hacer', img: null },
    { en: 'see',  es: 'ver',   img: null },
    { en: 'go',   es: 'ir',    img: null },
    { en: 'stop', es: 'parar', img: null }
  ],

  // Box 7. One leveled reader per level. Page text is placeholder until Kristen's large-print files arrive.
  readers: {
    1: { label: 'Level 1', labelEs: 'Nivel 1', kind: 'Single words',    kindEs: 'Palabras',        pages: [
      { text: 'help', img: null }, { text: 'see', img: null }, { text: 'go', img: null },
      { text: 'do', img: null }, { text: 'stop', img: null }, { text: 'We help!', img: null } ] },
    2: { label: 'Level 2', labelEs: 'Nivel 2', kind: 'Short sentences', kindEs: 'Oraciones cortas', pages: [
      { text: 'We go.', img: null }, { text: 'We see the teacher.', img: null }, { text: 'We help.', img: null },
      { text: 'We stop.', img: null }, { text: 'We do it!', img: null }, { text: 'We help!', img: null } ] },
    3: { label: 'Level 3', labelEs: 'Nivel 3', kind: 'Story',           kindEs: 'Cuento',          pages: [
      { text: 'We go to school. We see our teacher.', img: null },
      { text: 'Our teacher helps us read. We help too.', img: null },
      { text: 'We go to the store. We help carry the bags.', img: null },
      { text: 'The police officer says, “Stop!” We stop and look.', img: null },
      { text: 'We go home. We help put things away.', img: null },
      { text: 'Everyone helps. We help!', img: null } ] }
  },

  // Box 8. How many pictures to put in order at each class level (toolkit: 2 at the lowest, up to 5 at the highest).
  sequenceCount: { 1: 2, 2: 3, 3: 5 },

  // Helper notes (N key). Never shown to students unless toggled.
  notes: {
    intro: ['Today · 0–4 min · Lizbeth', 'Ask “Who is here?” and mark each student on the iPad as they answer (the board shows only the count, never names). Then the calendar: “What day is today?” Fill in the date from the iPad and read it together: “Today is Tuesday.” Every response mode counts: speech, pointing, gesture, sign, AAC or Spanish. Talk to students as teenagers.'],
    today: ['Plan · 4–5 min · Lizbeth', 'Point to each part of the plan as you name it. Cari starts pulling students for the quick check.'],
    ready: ['Brain Break · 5–7 min · Lizbeth', 'Pick the break that fits the class right now (the iPad shows when each one helps). Show, say one short direction at a time, wait at least 5 seconds. Seated and standing are equal. Never require eye contact or full range of motion. Stop for pain, dizziness, shortness of breath or loss of balance.'],
    move:  ['Move together · 7–22 min · Lizbeth', 'Show the four places first. Then start the game: spin, “First, go to ___.” Do the move together, seated or standing. Hold up STOP: everyone freezes for 3 seconds. The classroom teacher marks each stop on the iPad. A new student spins each time. Close: point to each sign, “Who helps here?”, then “We did it! We help!”'],
    wall:  ['Word wall · Kristen', 'Go through the five words one at a time (↑/↓ or the iPad). Show the picture, press the speaker so everyone hears the English word, then the class says it. Whole-class responses.'],
    pep:   ['Letters · Kristen', 'Go through H, D, S, G one at a time (↑/↓ or the iPad). Show the letter and picture, press the speaker to hear the letter and its word, then the class says it. Whole-class responses.'],
    read:  ['Read together · Kristen & Cari', 'Shared and echo reading at the class level from the quick check. Level 1: single words. Level 2: short sentences. Level 3: story.'],
    comp:  ['Comprehension · Cari', 'Put the story pictures in order, first to last. The number of pictures follows the class level. Call students on the second-screen list first.']
  }
};
