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
  // Place photos are from the game guide v4 "Choose a Place" board. Spanish wording needs a check by the team.
  game: {
    title: 'Let’s Explore Puerto Rico', titleEs: '¡Exploremos Puerto Rico!',
    closeQ: 'Who helps here?', closeQEs: '¿Quién ayuda aquí?'
  },
  places: [
    { id: 'school', landmark: 'Escuela La Esperanza', city: 'San Juan', color: '#2E86D1', img: 'img/place-school.jpg',
      en: 'School', es: 'Escuela',
      goEn: 'Go to the school.', goEs: 'Ve a la escuela.',
      helper: 'teacher', helperEs: 'maestra',
      move: 'Open the book.', moveEs: 'Abre el libro.',
      how: 'Arms together, then open wide.', howEs: 'Junta los brazos y ábrelos.' },
    { id: 'mall', landmark: 'Plaza Las Américas', city: 'San Juan', color: '#E2559A', img: 'img/place-mall.jpg',
      en: 'Mall', es: 'Centro comercial',
      goEn: 'Go to the mall.', goEs: 'Ve al centro comercial.',
      helper: 'cashier', helperEs: 'cajero',
      move: 'Scan the groceries.', moveEs: 'Escanea la compra.',
      how: 'Hold the item. Twist side to side.', howEs: 'Sostén el artículo. Gira de lado a lado.' },
    { id: 'fort', landmark: 'El Morro', city: 'San Juan', color: '#3FA35B', img: 'img/place-fort.jpg',
      en: 'Fort', es: 'Fuerte',
      goEn: 'Go to the fort.', goEs: 'Ve al fuerte.',
      helper: 'park ranger', helperEs: 'guardaparques',
      move: 'Look out.', moveEs: 'Mira a lo lejos.',
      how: 'Hand over eyes. Turn left, then right.', howEs: 'Mano sobre los ojos. Gira a la izquierda y a la derecha.' },
    { id: 'firehouse', landmark: 'Parque de Bombas', city: 'Ponce', color: '#E63946', img: 'img/place-firehouse.jpg',
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

  // Box 7. Read together: "The Lost Phone / El teléfono perdido" (DREAMS bilingual reader, revFinal), one version per level.
  // Story pages only (book pages x-03 to x-14); `no` is the page number printed in the paper book.
  // Pictures were taken from the PDFs into img/reader/. Most are shared across levels; pages 06, 13 and 14 differ.
  // `seq` = for each card count, which story pages (index into pages) box 8 uses for picture sequencing, in story order.
  // The book's own retell is: phone missing → Lily asks for help → the cleaner returns the phone.
  book: { title: 'The Lost Phone', titleEs: 'El teléfono perdido', by: 'Lily tells the story with Pep and Bella.', byEs: 'Lily cuenta la historia con Pep y Bella.', cover: 'img/reader/cover.jpg' },
  bigWords: ['go', 'see', 'help', 'do', 'stop'],
  readers: {
    1: { label: 'Level 1', labelEs: 'Nivel 1', kind: 'Short sentences', kindEs: 'Oraciones cortas', seq: { 2: [1, 9], 3: [1, 2, 9], 5: [1, 2, 5, 8, 9] }, pages: [
      { no: '1-03', time: '12:00 p.m.', timeEs: '12:00 p.m.', img: 'img/reader/p03.jpg',
        en: 'It is Saturday in San Juan. Practice is over.',
        es: 'Es sábado en San Juan. Terminó la práctica.' },
      { no: '1-04', time: '12:01 p.m.', timeEs: '12:01 p.m.', img: 'img/reader/p04.jpg',
        en: 'I look in my bag. No phone! What do I do?',
        es: 'Miro en mi mochila. ¡No está mi teléfono! ¿Qué hago?' },
      { no: '1-05', time: '12:02 p.m.', timeEs: '12:02 p.m.', img: 'img/reader/p05.jpg',
        en: 'I need help. I go to my teacher.',
        es: 'Necesito ayuda. Voy a ver a mi maestra.' },
      { no: '1-06', time: '12:05 p.m.', timeEs: '12:05 p.m.', img: 'img/reader/p06-L1.jpg',
        en: '“Stop and think,” says my teacher. I stop. I remember the clinic.',
        es: '«Detente y piensa», dice mi maestra. Me detengo. Recuerdo la clínica.' },
      { no: '1-07', time: '12:07 p.m.', timeEs: '12:07 p.m.', img: 'img/reader/p07.jpg',
        en: 'Pep and Bella go with me. We go to the clinic.',
        es: 'Pep y Bella vienen conmigo. Vamos a la clínica.' },
      { no: '1-08', time: '12:20 p.m.', timeEs: '12:20 p.m.', img: 'img/reader/p08.jpg',
        en: 'I see the doctor. We look. No phone. We need help.',
        es: 'Veo a la doctora. Buscamos. No está el teléfono. Necesitamos ayuda.' },
      { no: '1-09', time: '12:30 p.m.', timeEs: '12:30 p.m.', img: 'img/reader/p09.jpg',
        en: 'We go down the street. I see a supermarket worker. What do we do?',
        es: 'Bajamos por la calle. Veo a un empleado del supermercado. ¿Qué hacemos?' },
      { no: '1-10', time: '12:33 p.m.', timeEs: '12:33 p.m.', img: 'img/reader/p10.jpg',
        en: '“Ask the cleaner,” says the worker. We go to the bus stop.',
        es: '«Pregúntale al trabajador de limpieza», dice el empleado. Vamos a la parada de autobús.' },
      { no: '1-11', time: '12:40 p.m.', timeEs: '12:40 p.m.', img: 'img/reader/p11.jpg',
        en: 'I see the community cleaner. “I found a phone!” says the cleaner.',
        es: 'Veo al trabajador de limpieza. «¡Encontré un teléfono!», dice.' },
      { no: '1-12', time: '12:43 p.m.', timeEs: '12:43 p.m.', img: 'img/reader/p12.jpg',
        en: 'I see my blue phone. The cleaner gives it to me. “Thank you!”',
        es: 'Veo mi teléfono azul. El trabajador me lo entrega. «¡Gracias!»' },
      { no: '1-13', time: 'Later', timeEs: 'Más tarde', img: 'img/reader/p13-L1.jpg',
        en: 'We stop. We go. We help. I can do it!',
        es: 'Nos detenemos. Vamos. Ayudamos. ¡Puedo hacerlo!' },
      { no: '1-14', time: '2:00 p.m.', timeEs: '2:00 p.m.', img: 'img/reader/p14.jpg',
        en: 'At home, I charge my phone. Twelve missed calls. All from Mom!',
        es: 'En casa, cargo mi teléfono. ¡Doce llamadas perdidas! ¡Todas de mamá!' } ] },
    2: { label: 'Level 2', labelEs: 'Nivel 2', kind: 'Longer sentences', kindEs: 'Oraciones más largas', seq: { 2: [1, 9], 3: [1, 2, 9], 5: [1, 2, 5, 8, 9] }, pages: [
      { no: '2-03', time: '12:00 p.m.', timeEs: '12:00 p.m.', img: 'img/reader/p03.jpg',
        en: 'It is Saturday in San Juan. Practice is over. I want to text Mom.',
        es: 'Es sábado en San Juan. Terminó la práctica. Quiero escribirle a mamá.' },
      { no: '2-04', time: '12:01 p.m.', timeEs: '12:01 p.m.', img: 'img/reader/p04.jpg',
        en: 'I look in my bag and my pocket. My phone is gone. What do I do?',
        es: 'Miro en mi mochila y en mi bolsillo. No encuentro mi teléfono. ¿Qué hago?' },
      { no: '2-05', time: '12:02 p.m.', timeEs: '12:02 p.m.', img: 'img/reader/p05.jpg',
        en: 'I need help. I go to my teacher.',
        es: 'Necesito ayuda. Voy a ver a mi maestra.' },
      { no: '2-06', time: '12:05 p.m.', timeEs: '12:05 p.m.', img: 'img/reader/p06-L2.jpg',
        en: 'My teacher calls my phone. It is off. “Stop and think. Where did you go today?”',
        es: 'Mi maestra llama a mi teléfono. Está apagado. «Detente y piensa. ¿Adónde fuiste hoy?»' },
      { no: '2-07', time: '12:07 p.m.', timeEs: '12:07 p.m.', img: 'img/reader/p07.jpg',
        en: 'First, the clinic. Next, the street. Last, school. Pep and Bella go back to the clinic with me. What do we do next?',
        es: 'Primero, la clínica. Luego, la calle. Por último, la escuela. Pep y Bella regresan conmigo a la clínica. ¿Qué hacemos ahora?' },
      { no: '2-08', time: '12:20 p.m.', timeEs: '12:20 p.m.', img: 'img/reader/p08.jpg',
        en: 'I see the doctor. She checks the desk. No phone. Where else can we look?',
        es: 'Veo a la doctora. Revisa el escritorio. No está el teléfono. ¿Dónde más podemos buscar?' },
      { no: '2-09', time: '12:30 p.m.', timeEs: '12:30 p.m.', img: 'img/reader/p09.jpg',
        en: 'We go down the street. We stop outside the supermarket. I see a worker.',
        es: 'Vamos por la calle. Nos detenemos frente al supermercado. Veo a un empleado.' },
      { no: '2-10', time: '12:33 p.m.', timeEs: '12:33 p.m.', img: 'img/reader/p10.jpg',
        en: '“I didn’t see your phone,” says the worker. “Ask the cleaner by the bus stop.”',
        es: '«No vi tu teléfono», dice el empleado. «Pregúntale al trabajador de limpieza junto a la parada de autobús».' },
      { no: '2-11', time: '12:40 p.m.', timeEs: '12:40 p.m.', img: 'img/reader/p11.jpg',
        en: 'I stop. I see the community cleaner. “I found a phone by the bus stop,” says the cleaner.',
        es: 'Me detengo y veo al trabajador de limpieza. «Encontré un teléfono junto a la parada de autobús», dice.' },
      { no: '2-12', time: '12:43 p.m.', timeEs: '12:43 p.m.', img: 'img/reader/p12.jpg',
        en: '“What does it look like?” “A blue case,” I tell the cleaner. The cleaner hands it to me. “Thank you!”',
        es: '«¿Cómo es?», pregunta. «Tiene una funda azul», le digo. Me entrega el teléfono. «¡Gracias!»' },
      { no: '2-13', time: 'Later', timeEs: 'Más tarde', img: 'img/reader/p13-L2.jpg',
        en: 'What can I do now? I can call Mom. First, I need to charge my phone.',
        es: '¿Qué puedo hacer ahora? Puedo llamar a mamá. Primero tengo que cargar mi teléfono.' },
      { no: '2-14', time: '2:00 p.m.', timeEs: '2:00 p.m.', img: 'img/reader/p14.jpg',
        en: 'At home, I charge my phone. Bzzz! Twelve missed calls. All from Mom!',
        es: 'En casa, cargo mi teléfono. ¡Bzzz! ¡Doce llamadas perdidas! ¡Todas de mamá!' } ] },
    3: { label: 'Level 3', labelEs: 'Nivel 3', kind: 'Story', kindEs: 'Cuento', seq: { 2: [1, 9], 3: [1, 2, 9], 5: [1, 2, 5, 8, 9] }, pages: [
      { no: '3-03', time: '12:00 p.m.', timeEs: '12:00 p.m.', img: 'img/reader/p03.jpg',
        en: 'It is Saturday in San Juan, and practice is over. I reach for my phone to text Mom.',
        es: 'Es sábado en San Juan y terminó la práctica. Busco mi teléfono para escribirle a mamá.' },
      { no: '3-04', time: '12:01 p.m.', timeEs: '12:01 p.m.', img: 'img/reader/p04.jpg',
        en: 'My pocket is empty. I unzip my bag and look inside. No phone. When did I last use it?',
        es: 'Mi bolsillo está vacío. Abro mi mochila y miro dentro. No está el teléfono. ¿Cuándo lo usé por última vez?' },
      { no: '3-05', time: '12:02 p.m.', timeEs: '12:02 p.m.', img: 'img/reader/p05.jpg',
        en: 'I need help. I go to my teacher while Pep and Bella check the bench.',
        es: 'Necesito ayuda. Voy a ver a mi maestra mientras Pep y Bella revisan el banco.' },
      { no: '3-06', time: '12:05 p.m.', timeEs: '12:05 p.m.', img: 'img/reader/p06-L3.jpg',
        en: 'My teacher calls my phone, but it is off. “Stop and think,” my teacher says. “Where did you go before practice?”',
        es: 'Mi maestra llama a mi teléfono, pero está apagado. «Detente y piensa», dice. «¿Adónde fuiste antes de la práctica?»' },
      { no: '3-07', time: '12:07 p.m.', timeEs: '12:07 p.m.', img: 'img/reader/p07.jpg',
        en: 'I picture my morning. First I went to the clinic. Next I walked down the street. Then I got to school. Pep and Bella come with me to retrace my steps.',
        es: 'Repaso mi mañana. Primero fui a la clínica. Luego caminé por la calle. Después llegué a la escuela. Pep y Bella vienen conmigo para recorrer de nuevo mis pasos.' },
      { no: '3-08', time: '12:20 p.m.', timeEs: '12:20 p.m.', img: 'img/reader/p08.jpg',
        en: 'At the clinic, we see the doctor. She checks the desk. “You had your phone in your hand when you left,” the doctor remembers.',
        es: 'En la clínica, vemos a la doctora. Revisa el escritorio. «Tenías el teléfono en la mano cuando saliste», recuerda.' },
      { no: '3-09', time: '12:30 p.m.', timeEs: '12:30 p.m.', img: 'img/reader/p09.jpg',
        en: 'If I had it when I left the clinic, where did I go next? Down the street. Outside the supermarket, I see a worker.',
        es: 'Si tenía el teléfono al salir de la clínica, ¿adónde fui después? Bajé por la calle. Frente al supermercado, veo a un empleado.' },
      { no: '3-10', time: '12:33 p.m.', timeEs: '12:33 p.m.', img: 'img/reader/p10.jpg',
        en: '“I didn’t see a phone,” the worker says. “But the community cleaner swept the sidewalk by the bus stop. Try there.”',
        es: '«No vi ningún teléfono», dice el empleado. «Pero el trabajador de limpieza barrió la acera junto a la parada de autobús. Pregúntale allí».' },
      { no: '3-11', time: '12:40 p.m.', timeEs: '12:40 p.m.', img: 'img/reader/p11.jpg',
        en: 'At the bus stop, we see the community cleaner. “I found a phone here this morning. What does yours look like?”',
        es: 'En la parada de autobús, vemos al trabajador de limpieza. «Encontré un teléfono aquí esta mañana. ¿Cómo es el tuyo?»' },
      { no: '3-12', time: '12:43 p.m.', timeEs: '12:43 p.m.', img: 'img/reader/p12.jpg',
        en: '“It has a blue case,” I tell the cleaner. “And it’s turned off.” He nods and hands me the phone. “That’s mine. Thank you for keeping it safe.”',
        es: '«Tiene una funda azul», le digo. «Y está apagado». Él asiente y me entrega el teléfono. «Es mío. Gracias por cuidarlo».' },
      { no: '3-13', time: 'Later', timeEs: 'Más tarde', img: 'img/reader/p14.jpg',
        en: 'What can I do now? I can let Mom know. At home, I charge my phone. Bzzz! Twelve missed calls. All from Mom. Uh-oh.',
        es: '¿Qué puedo hacer ahora? Puedo avisarle a mamá. En casa, cargo mi teléfono. ¡Bzzz! Doce llamadas perdidas. Todas de mamá. ¡Uy!' },
      { no: '3-14', time: 'One week later', timeEs: 'Una semana después', img: 'img/reader/p14-L3.jpg',
        en: 'A week later, I see a wallet outside the school office. This time, someone else needs help. What could I do to help the owner get it back?',
        es: 'Una semana después, veo una billetera frente a la oficina escolar. Esta vez, otra persona necesita ayuda. ¿Qué puedo hacer para que su dueño la recupere?' } ] }
  },

  // Box 8. How many pictures to put in order at each class level (toolkit: 2 at the lowest, up to 5 at the highest).
  // The cards come from the reader's `seq` for that count.
  sequenceCount: { 1: 2, 2: 3, 3: 5 },

  // Helper notes (N key). Never shown to students unless toggled.
  notes: {
    intro: ['Today · 0–4 min · Lizbeth', 'Ask “Who is here?” and mark each student on the iPad as they answer (the board shows only the count, never names). Then the calendar: “What day is today?” Fill in the date from the iPad and read it together: “Today is Tuesday.” Every response mode counts: speech, pointing, gesture, sign, AAC or Spanish. Talk to students as teenagers.'],
    today: ['Plan · 4–5 min · Lizbeth', 'Point to each part of the plan as you name it. Cari starts pulling students for the quick check.'],
    ready: ['Brain Break · 5–7 min · Lizbeth', 'Pick the break that fits the class right now (the iPad shows when each one helps). Show, say one short direction at a time, wait at least 5 seconds. Seated and standing are equal. Never require eye contact or full range of motion. Stop for pain, dizziness, shortness of breath or loss of balance.'],
    move:  ['Move together · 7–22 min · Lizbeth', 'Show the four places first. Then start the game: spin, “First, go to ___.” Do the move together, seated or standing. Hold up STOP: everyone freezes for 3 seconds. The classroom teacher marks each stop on the iPad. A new student spins each time. Close: point to each sign, “Who helps here?”, then “We did it! We help!”'],
    wall:  ['Word wall · Kristen', 'Go through the five words one at a time (↑/↓ or the iPad). Show the picture, press the speaker so everyone hears the English word, then the class says it. Whole-class responses.'],
    pep:   ['Letters · Kristen', 'Go through H, D, S, G one at a time (↑/↓ or the iPad). Show the letter and picture, press the speaker to hear the letter and its word, then the class says it. Whole-class responses.'],
    read:  ['Read together · Kristen & Cari', '“The Lost Phone” at the class level from the quick check. Shared and echo reading, two pages at a time; the page numbers match the paper books (1-03, 2-03, 3-03…). Point to the blue words (go, see, help, do, stop) as you read. The Spanish is under each line.'],
    comp:  ['Comprehension · Cari', 'Put the story pictures in order, first to last. The number of pictures follows the class level. Call students on the second-screen list first.']
  }
};
