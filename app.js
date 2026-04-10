/* ============================================================
   TypeLab — Typing Speed Test Logic
   app.js
   ============================================================ */

/* ---------- Config ---------- */
const MODES = {
  '15':    { type: 'time',  duration: 15,  words: 60  },
  '30':    { type: 'time',  duration: 30,  words: 100 },
  '60':    { type: 'time',  duration: 60,  words: 180 },
  'words': { type: 'words', duration: null, words: 25  },
};

/* ---------- State ---------- */
let currentMode   = '15';
let words         = [];        // array of word strings
let letterSpans   = [];        // flat array of all letter <span> elements
let wordBoundaries = [];       // [{start, end}] index per word in letterSpans
let currentLetterIdx = 0;     // which letter the caret is on
let typedInput    = '';        // all typed characters so far
let started       = false;
let finished      = false;
let timerInterval = null;
let timeLeft      = 15;
let startTime     = null;
let totalTyped    = 0;         // all keystrokes (for accuracy)
let errorCount    = 0;
let correctCount  = 0;

/* ---------- DOM ---------- */
const wordsWrap     = document.getElementById('words-wrap');
const caret         = document.getElementById('caret');
const ghostInput    = document.getElementById('ghost-input');
const focusHint     = document.getElementById('focus-hint');
const typingArea    = document.getElementById('typing-area');
const timerVal      = document.getElementById('timer-val');
const timerUnit     = document.getElementById('timer-unit');
const timerDisplay  = document.getElementById('timer-display');
const liveStats     = document.getElementById('live-stats');
const liveWpm       = document.getElementById('live-wpm');
const liveAcc       = document.getElementById('live-acc');
const liveErrors    = document.getElementById('live-errors');
const progressFill  = document.getElementById('progress-fill');
const resultOverlay = document.getElementById('result-overlay');
const bestWpmEl     = document.getElementById('best-wpm');
const testsTakenEl  = document.getElementById('tests-taken');

/* ---------- Persistence ---------- */
function loadStats() {
  const best  = localStorage.getItem('typelab-best')  || '—';
  const tests = localStorage.getItem('typelab-tests') || '0';
  bestWpmEl.textContent   = best;
  testsTakenEl.textContent = tests;
}

function saveStats(wpm) {
  const prev  = parseInt(localStorage.getItem('typelab-best') || '0');
  const tests = parseInt(localStorage.getItem('typelab-tests') || '0');
  if (wpm > prev) localStorage.setItem('typelab-best', wpm);
  localStorage.setItem('typelab-tests', tests + 1);
  loadStats();
  return wpm > prev; // is new personal best?
}

/* ---------- Build Word Display ---------- */
function buildWords() {
  const cfg  = MODES[currentMode];
  words      = getRandomWords(cfg.words);
  letterSpans    = [];
  wordBoundaries = [];
  wordsWrap.innerHTML = '';

  words.forEach((word, wi) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    const start = letterSpans.length;

    // Letters
    word.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      wordEl.appendChild(span);
      letterSpans.push(span);
    });

    // Space after word (except last)
    if (wi < words.length - 1) {
      const spaceSpan = document.createElement('span');
      spaceSpan.className = 'letter space';
      spaceSpan.textContent = ' ';
      wordEl.appendChild(spaceSpan);
      letterSpans.push(spaceSpan);
    }

    wordBoundaries.push({ start, end: letterSpans.length - 1 });
    wordsWrap.appendChild(wordEl);
  });

  currentLetterIdx = 0;
  moveCaret();
}

/* ---------- Caret Positioning ---------- */
function moveCaret() {
  const target = letterSpans[currentLetterIdx];
  if (!target) {
    // End of text
    const last = letterSpans[letterSpans.length - 1];
    if (last) {
      const r   = last.getBoundingClientRect();
      const wr  = wordsWrap.getBoundingClientRect();
      caret.style.left = (r.right - wr.left) + 'px';
      caret.style.top  = (r.top - wr.top + wordsWrap.scrollTop) + 'px';
    }
    return;
  }
  const r  = target.getBoundingClientRect();
  const wr = wordsWrap.getBoundingClientRect();
  caret.style.left = (r.left - wr.left) + 'px';
  caret.style.top  = (r.top - wr.top + wordsWrap.scrollTop) + 'px';
}

/* ---------- Reset ---------- */
function resetTest() {
  clearInterval(timerInterval);
  started   = false;
  finished  = false;
  typedInput = '';
  totalTyped = 0;
  errorCount = 0;
  correctCount = 0;
  currentLetterIdx = 0;

  const cfg = MODES[currentMode];
  timeLeft  = cfg.duration || 0;

  // Timer display
  if (cfg.type === 'time') {
    timerVal.textContent  = cfg.duration;
    timerUnit.textContent = 'sec';
  } else {
    timerVal.textContent  = cfg.words;
    timerUnit.textContent = 'words';
  }

  timerDisplay.classList.remove('urgent');
  progressFill.style.width = '100%';
  progressFill.style.transition = 'none';

  liveStats.classList.add('hidden');
  liveWpm.textContent    = '0';
  liveAcc.textContent    = '100';
  liveErrors.textContent = '0';

  resultOverlay.classList.add('hidden');
  focusHint.classList.remove('hidden');
  typingArea.classList.remove('focused', 'typing');

  ghostInput.value = '';

  buildWords();
}

/* ---------- Start Test ---------- */
function startTest() {
  if (started) return;
  started   = true;
  startTime = Date.now();

  focusHint.classList.add('hidden');
  liveStats.classList.remove('hidden');
  typingArea.classList.add('typing');

  const cfg = MODES[currentMode];

  if (cfg.type === 'time') {
    timeLeft = cfg.duration;
    progressFill.style.transition = `width ${cfg.duration}s linear`;
    progressFill.style.width = '0%';

    timerInterval = setInterval(() => {
      timeLeft--;
      timerVal.textContent = timeLeft;
      if (timeLeft <= 5) timerDisplay.classList.add('urgent');
      updateLiveWpm();
      if (timeLeft <= 0) endTest();
    }, 1000);
  }
}

/* ---------- Handle Input ---------- */
function handleInput(e) {
  if (finished) return;

  const key = e.data; // null for backspace via 'input' event

  // We use keydown for backspace, input for characters
}

function handleKeydown(e) {
  if (finished) return;

  // Ignore modifier-only keys
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (!started && e.key.length === 1) startTest();
  if (!started) return;

  if (e.key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
    return;
  }

  if (e.key.length !== 1) return; // ignore Shift, Tab, etc.

  const expected = letterSpans[currentLetterIdx];
  if (!expected) return; // past end of text

  const typedChar   = e.key;
  const correctChar = expected.textContent;

  totalTyped++;

  if (typedChar === correctChar) {
    expected.classList.add('correct');
    expected.classList.remove('incorrect');
    correctCount++;
  } else {
    expected.classList.add('incorrect');
    expected.classList.remove('correct');
    if (correctChar === ' ') expected.classList.add('space-incorrect');
    errorCount++;
  }

  currentLetterIdx++;
  moveCaret();
  updateLiveWpm();
  updateLiveAccuracy();

  // Words mode: check if all words typed
  const cfg = MODES[currentMode];
  if (cfg.type === 'words' && currentLetterIdx >= letterSpans.length) {
    endTest();
  }

  // Update word counter in words mode
  if (cfg.type === 'words') {
    const wordsTyped = countWordsTyped();
    timerVal.textContent = cfg.words - wordsTyped;
  }
}

function handleBackspace() {
  if (currentLetterIdx === 0) return;

  currentLetterIdx--;
  const span = letterSpans[currentLetterIdx];
  span.classList.remove('correct', 'incorrect', 'space-incorrect');
  totalTyped = Math.max(0, totalTyped - 1);
  if (span.classList.contains('incorrect')) errorCount = Math.max(0, errorCount - 1);

  moveCaret();
  updateLiveAccuracy();
}

/* ---------- WPM Calculation ---------- */
function calcWpm() {
  const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
  if (elapsed === 0) return 0;
  // Standard: 5 chars = 1 word
  const charsCorrect = letterSpans.filter(s => s.classList.contains('correct')).length;
  return Math.round((charsCorrect / 5) / elapsed);
}

function updateLiveWpm() {
  liveWpm.textContent = calcWpm();
}

function updateLiveAccuracy() {
  const acc = totalTyped === 0
    ? 100
    : Math.round(((totalTyped - errorCount) / totalTyped) * 100);
  liveAcc.textContent    = Math.max(0, acc);
  liveErrors.textContent = errorCount;
}

function countWordsTyped() {
  let count = 0;
  wordBoundaries.forEach(({ start, end }) => {
    const allCorrect = letterSpans
      .slice(start, end + 1)
      .filter(s => !s.classList.contains('space'))
      .every(s => s.classList.contains('correct'));
    if (allCorrect) count++;
  });
  return count;
}

/* ---------- End Test ---------- */
function endTest() {
  if (finished) return;
  finished = true;
  clearInterval(timerInterval);
  typingArea.classList.remove('typing');

  const wpm     = calcWpm();
  const correct = letterSpans.filter(s => s.classList.contains('correct')).length;
  const errors  = letterSpans.filter(s => s.classList.contains('incorrect')).length;
  const acc     = totalTyped === 0 ? 100 : Math.round(((totalTyped - errorCount) / totalTyped) * 100);
  const chars   = correct + errors;
  const isPB    = saveStats(wpm);
  const cfg     = MODES[currentMode];

  // Populate result card
  document.getElementById('result-wpm').textContent  = wpm;
  document.getElementById('rstat-acc').textContent   = Math.max(0, acc) + '%';
  document.getElementById('rstat-correct').textContent = correct;
  document.getElementById('rstat-errors').textContent  = errors;
  document.getElementById('rstat-chars').textContent   = chars;
  document.getElementById('result-mode-tag').textContent =
    cfg.type === 'time' ? cfg.duration + ' seconds' : cfg.words + ' words';

  const pbBadge = document.getElementById('pb-badge');
  isPB ? pbBadge.classList.remove('hidden') : pbBadge.classList.add('hidden');

  resultOverlay.classList.remove('hidden');
}

/* ---------- Focus Management ---------- */
function focusInput() {
  ghostInput.focus();
  typingArea.classList.add('focused');
}

/* ---------- Event Listeners ---------- */
// Click anywhere on typing area to focus
typingArea.addEventListener('click', focusInput);
wordsWrap.addEventListener('click', focusInput);

// Focus / blur
ghostInput.addEventListener('focus', () => typingArea.classList.add('focused'));
ghostInput.addEventListener('blur',  () => typingArea.classList.remove('focused'));

// Key input
ghostInput.addEventListener('keydown', handleKeydown);

// Prevent paste
ghostInput.addEventListener('paste', e => e.preventDefault());

// Global keypress to auto-focus
document.addEventListener('keydown', e => {
  if (
    !finished &&
    !e.ctrlKey && !e.metaKey && !e.altKey &&
    document.activeElement !== ghostInput
  ) {
    ghostInput.focus();
  }
});

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    resetTest();
    focusInput();
  });
});

// Restart button
document.getElementById('restart-btn').addEventListener('click', () => {
  resetTest();
  setTimeout(focusInput, 50);
});

// Change mode button (from result screen)
document.getElementById('change-mode-btn').addEventListener('click', () => {
  resultOverlay.classList.add('hidden');
  resetTest();
});

// Reposition caret on resize
window.addEventListener('resize', moveCaret);

/* ---------- Init ---------- */
loadStats();
resetTest();
