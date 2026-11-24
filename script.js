const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);
const initialDays = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000));
let firstCounterRender = true;

function updateCounter() {
  const diff = Math.max(0, Date.now() - startDate.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;
  if (firstCounterRender) {
    Effects.animateNumber($('#days'), days, 1800);
    Effects.animateNumber($('#hours'), hours, 1800);
    firstCounterRender = false;
  }
  $('#minutes').textContent = String(minutes).padStart(2, '0');
  $('#seconds').textContent = String(seconds).padStart(2, '0');
}
function resumeCounter() {
  const diff = Math.max(0, Date.now() - startDate.getTime());
  $('#days').textContent = Math.floor(diff / 86400000);
  $('#hours').textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, '0');
  $('#minutes').textContent = String(Math.floor(diff / 60000) % 60).padStart(2, '0');
  $('#seconds').textContent = String(Math.floor(diff / 1000) % 60).padStart(2, '0');
}
updateCounter();
setTimeout(resumeCounter, 1900);
setInterval(resumeCounter, 1000);

$('#name-a').textContent = CONFIG.nameA;
$('#name-b').textContent = CONFIG.nameB;

let lineIndex = 0;
let charIndex = 0;
let erasing = false;
const typeTarget = $('#typewriter');

function typeStep() {
  const text = CONFIG.typewriter[lineIndex] || '';
  if (!erasing) {
    typeTarget.textContent = text.slice(0, ++charIndex);
    if (charIndex === text.length) {
      erasing = true;
      return setTimeout(typeStep, 2400);
    }
  } else {
    typeTarget.textContent = text.slice(0, --charIndex);
    if (charIndex === 0) {
      erasing = false;
      lineIndex = (lineIndex + 1) % CONFIG.typewriter.length;
    }
  }
  setTimeout(typeStep, erasing ? 40 : 110);
}
if (CONFIG.typewriter.length) typeStep();

function burstFromElement(element, amount = 70) {
  const rect = element.getBoundingClientRect();
  Effects.burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2, amount);
}

let loveCount = 0;
$('#love-btn').addEventListener('click', (event) => {
  const lines = CONFIG.loveLines;
  const message = $('#love-message');
  let next;
  do { next = lines[Math.floor(Math.random() * lines.length)]; } while (lines.length > 1 && next === message.textContent);
  message.textContent = next;
  message.classList.remove('pop');
  void message.offsetWidth;
  message.classList.add('pop');
  loveCount++;
  $('#love-count').textContent = loveCount;
  burstFromElement(event.currentTarget, 80);
  playChime();
});

$('#timeline').innerHTML = CONFIG.timeline.map((item, index) => `
  <article class="timeline-item reveal" style="transition-delay:${index * 60}ms">
    <div class="timeline-emoji">${item.emoji}</div>
    <div>
      <p class="timeline-date">${item.date}</p>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  </article>`).join('');

const letterBody = $('#letter-body');
letterBody.textContent = CONFIG.letter || '';
$('#envelope').addEventListener('click', (event) => {
  const envelope = $('#envelope');
  envelope.classList.toggle('open');
  $('#letter-paper').hidden = !envelope.classList.contains('open');
  if (envelope.classList.contains('open')) {
    burstFromElement(event.currentTarget, 55);
    playChime(523.25);
  }
});
$('#letter-close').addEventListener('click', () => {
  $('#envelope').classList.remove('open');
  $('#letter-paper').hidden = true;
});

const galleryGrid = $('#gallery-grid');
galleryGrid.innerHTML = CONFIG.photos.map((photo, index) => `
  <div class="gallery-card reveal" data-index="${index}" role="button" tabindex="0" aria-label="查看 ${photo.caption}" style="transition-delay:${(index % 3) * 90}ms">
    <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
    <span>${photo.caption}</span>
  </div>`).join('');

const lightbox = $('#lightbox');
const lightboxImg = $('#lightbox-img');
const lightboxCaption = $('#lightbox-caption');
let photoIndex = 0;

function showPhoto(index) {
  photoIndex = (index + CONFIG.photos.length) % CONFIG.photos.length;
  lightboxImg.src = CONFIG.photos[photoIndex].src;
  lightboxCaption.textContent = CONFIG.photos[photoIndex].caption;
}
function openPhoto(index) { showPhoto(index); lightbox.hidden = false; }

galleryGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.gallery-card');
  if (card) openPhoto(Number(card.dataset.index));
});
galleryGrid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const card = event.target.closest('.gallery-card');
  if (card) openPhoto(Number(card.dataset.index));
});
$('#lightbox-close').addEventListener('click', () => { lightbox.hidden = true; });
$('#lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
$('#lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.hidden = true; });
document.addEventListener('keydown', (event) => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') lightbox.hidden = true;
  if (event.key === 'ArrowLeft') showPhoto(photoIndex - 1);
  if (event.key === 'ArrowRight') showPhoto(photoIndex + 1);
});

const noButton = $('#no-btn');
const noTexts = CONFIG.secretNo || ['再想想？'];
let noClickCount = 0;

function moveNoButton() {
  const x = 20 + Math.random() * Math.max(20, window.innerWidth - 200);
  const y = 120 + Math.random() * Math.max(20, window.innerHeight - 320);
  noButton.style.position = 'fixed';
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.zIndex = 70;
  noButton.textContent = noTexts[noClickCount % noTexts.length];
  noClickCount++;
}
noButton.addEventListener('mouseenter', moveNoButton);
noButton.addEventListener('click', moveNoButton);
noButton.addEventListener('touchstart', moveNoButton, { passive: true });

function shootFireworks(element) {
  const layer = $('#secret-fireworks');
  const rect = element.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  for (let i = 0; i < 60; i++) {
    const spark = document.createElement('span');
    spark.className = 'firework-spark';
    spark.textContent = ['♥', '✦', '✧', '💕', '✨'][Math.floor(Math.random() * 5)];
    const angle = (i / 60) * Math.PI * 2;
    const radius = 80 + Math.random() * 130;
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    spark.style.setProperty('--dx', `${Math.cos(angle) * radius}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * radius}px`);
    spark.style.animationDelay = `${Math.random() * 0.2}s`;
    layer.appendChild(spark);
    setTimeout(() => spark.remove(), 1800);
  }
}

$('#yes-btn').addEventListener('click', (event) => {
  $('#secret-answer').textContent = CONFIG.secretYes;
  shootFireworks(event.currentTarget);
  burstFromElement(event.currentTarget, 100);
  playChime(659.25);
});

const STORAGE_KEY = 'our-love-notes';
const noteInput = $('#note-input');
const noteList = $('#note-list');

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveNotes(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
  catch { alert('浏览器存储不可用，留言无法保存。'); }
}
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderNotes() {
  const notes = loadNotes();
  noteList.innerHTML = notes.length ? notes.map((note, index) => `
    <div class="note-card">
      <button data-index="${index}" aria-label="删除留言">✕</button>
      <p>${escapeHtml(note.text)}</p>
      <small>${note.time}</small>
    </div>`).join('') : '<p style="text-align:center;color:var(--muted)">还没有留言，写下第一句吧～</p>';
}
noteInput.addEventListener('input', () => {
  $('#note-count').textContent = `${noteInput.value.length} / 200`;
});
$('#note-submit').addEventListener('click', (event) => {
  const text = noteInput.value.trim();
  if (!text) { noteInput.focus(); return; }
  const notes = loadNotes();
  notes.unshift({ text, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
  saveNotes(notes);
  noteInput.value = '';
  $('#note-count').textContent = '0 / 200';
  renderNotes();
  burstFromElement(event.currentTarget, 45);
});
noteList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-index]');
  if (!button) return;
  const notes = loadNotes();
  notes.splice(Number(button.dataset.index), 1);
  saveNotes(notes);
  renderNotes();
});
renderNotes();

const THEME_KEY = 'our-love-theme';
const themeToggle = $('#theme-toggle');
if (localStorage.getItem(THEME_KEY) === 'night') {
  document.body.classList.add('night');
  themeToggle.textContent = '☀️';
}
themeToggle.addEventListener('click', () => {
  const night = document.body.classList.toggle('night');
  themeToggle.textContent = night ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, night ? 'night' : 'day');
});

$('#back-to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

let audioContext;
function playChime(frequency = 440) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.46);
  } catch { /* 音频不可用就静音 */ }
}

Effects.initParticleBackground();
Effects.initCursorTrail();
Effects.initScrollProgress();
Effects.initReveal();

window.addEventListener('load', () => {
  setTimeout(() => $('#loader').classList.add('done'), 1800);
});
setTimeout(() => $('#loader').classList.add('done'), 4000);
