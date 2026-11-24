const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);
let daysTogether = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000));

function updateCounter() {
  const diff = Math.max(0, Date.now() - startDate.getTime());
  const days = Math.floor(diff / 86400000);
  daysTogether = days;
  $('#days').textContent = days;
  $('#hours').textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, '0');
  $('#minutes').textContent = String(Math.floor(diff / 60000) % 60).padStart(2, '0');
  $('#seconds').textContent = String(Math.floor(diff / 1000) % 60).padStart(2, '0');
  $('#stat-days').textContent = days;
}
updateCounter();
setInterval(updateCounter, 1000);
FX.animateNumber($('#days'), daysTogether, 1600);
FX.animateNumber($('#stat-days'), daysTogether, 1600);

$('#name-a').textContent = CONFIG.nameA;
$('#name-b').textContent = CONFIG.nameB;
$('#stat-lines').textContent = CONFIG.loveLines.length;

let lineIndex = 0;
let charIndex = 0;
let erasing = false;
const typeTarget = $('#typewriter');
function typeStep() {
  const text = CONFIG.typewriter[lineIndex] || '';
  if (!erasing) {
    typeTarget.textContent = text.slice(0, ++charIndex);
    if (charIndex === text.length) { erasing = true; return setTimeout(typeStep, 2300); }
  } else {
    typeTarget.textContent = text.slice(0, --charIndex);
    if (charIndex === 0) { erasing = false; lineIndex = (lineIndex + 1) % CONFIG.typewriter.length; }
  }
  setTimeout(typeStep, erasing ? 35 : 95);
}
if (CONFIG.typewriter.length) typeStep();

let loveCount = 0;
$('#love-btn').addEventListener('click', () => {
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
  playChime(523.25);
});

$('#timeline').innerHTML = CONFIG.timeline.map((item, index) => `
  <article class="timeline-item reveal" style="transition-delay:${index * 70}ms">
    <div class="timeline-node">${item.emoji}</div>
    <div><p class="timeline-date">${item.date}</p><h3>${item.title}</h3><p>${item.text}</p></div>
  </article>`).join('');

const letterCard = $('#letter-card');
const letterContent = $('#letter-content');
$('#letter-body').textContent = CONFIG.letter || '';
letterCard.addEventListener('click', () => {
  letterCard.hidden = true;
  letterContent.hidden = false;
  const rect = letterContent.getBoundingClientRect();
  FX.burst(rect.left + rect.width / 2, rect.top + 60, { count: 40, power: 5, colors: ['#ff5c8a', '#a78bfa', '#ffffff'] });
});
$('#letter-close').addEventListener('click', () => {
  letterContent.hidden = true;
  letterCard.hidden = false;
});

const galleryGrid = $('#gallery-grid');
$('#gallery-count').textContent = String(CONFIG.photos.length).padStart(2, '0') + ' FRAMES';
galleryGrid.innerHTML = CONFIG.photos.map((photo, index) => `
  <figure class="gallery-card reveal" data-index="${index}" role="button" tabindex="0" style="transition-delay:${(index % 3) * 80}ms">
    <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
    <figcaption>${photo.caption}</figcaption>
  </figure>`).join('');
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

$('#places').innerHTML = (CONFIG.places || []).map((place, index) => `
  <div class="place reveal" style="transition-delay:${index * 90}ms">
    <div class="place-dot"></div><h4>${place.name}</h4><span>${place.sub}</span>
  </div>`).join('');

function updateMilestones() {
  const badges = CONFIG.badges || [];
  $('#badges').innerHTML = badges.map((badge) => {
    const unlocked = daysTogether >= badge.days;
    return `<div class="badge ${unlocked ? 'unlocked' : ''}"><span class="badge-icon">${unlocked ? badge.icon : '◌'}</span>${badge.name}${unlocked ? '' : ` · ${badge.days}天`}</div>`;
  }).join('');
  const next = badges.find((badge) => daysTogether < badge.days);
  $('#milestone-next').textContent = next ? `下一站：${next.name} · 还有 ${next.days - daysTogether} 天` : '所有徽章已解锁 ♥';
  const currentBase = [...badges].reverse().find((badge) => badge.days <= daysTogether);
  const nextBadge = next;
  let percent;
  if (!currentBase) percent = (daysTogether / (nextBadge ? nextBadge.days : 100)) * 100;
  else if (!nextBadge) percent = 100;
  else percent = ((daysTogether - currentBase.days) / (nextBadge.days - currentBase.days)) * 100;
  $('#milestone-fill').style.width = Math.min(100, Math.max(0, percent)) + '%';
}
updateMilestones();
setInterval(updateMilestones, 60000);

const noButton = $('#no-btn');
const noTexts = CONFIG.secretNo || ['再想想？'];
let noClickCount = 0;
function moveNoButton() {
  const x = 20 + Math.random() * Math.max(20, window.innerWidth - 180);
  const y = 120 + Math.random() * Math.max(20, window.innerHeight - 300);
  noButton.style.position = 'fixed';
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.zIndex = 120;
  noButton.textContent = noTexts[noClickCount % noTexts.length];
  noClickCount++;
}
noButton.addEventListener('mouseenter', moveNoButton);
noButton.addEventListener('click', moveNoButton);
noButton.addEventListener('touchstart', moveNoButton, { passive: true });
$('#yes-btn').addEventListener('click', () => {
  $('#secret-answer').textContent = CONFIG.secretYes;
  playChime(659.25);
});

const STORAGE_KEY = 'our-love-notes';
const noteInput = $('#note-input');
const noteList = $('#note-list');
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveNotes(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { alert('浏览器存储不可用，留言无法保存。'); }
}
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderNotes() {
  const notes = loadNotes();
  noteList.innerHTML = notes.length ? notes.map((note, index) => `
    <div class="note-card"><button data-index="${index}" aria-label="删除留言">✕</button><p>${escapeHtml(note.text)}</p><small>${note.time}</small></div>`).join('')
    : '<p style="text-align:center;color:var(--muted);font-size:0.85rem">还没有留言，写下第一句吧 ♡</p>';
}
noteInput.addEventListener('input', () => { $('#note-count').textContent = `${noteInput.value.length} / 200`; });
$('#note-submit').addEventListener('click', () => {
  const text = noteInput.value.trim();
  if (!text) { noteInput.focus(); return; }
  const notes = loadNotes();
  notes.unshift({ text, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
  saveNotes(notes);
  noteInput.value = '';
  $('#note-count').textContent = '0 / 200';
  renderNotes();
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
let lightTheme = localStorage.getItem(THEME_KEY) === 'light';
function applyTheme() {
  document.body.classList.toggle('light', lightTheme);
  themeToggle.textContent = lightTheme ? '🌙' : '☀️';
}
applyTheme();
themeToggle.addEventListener('click', () => {
  lightTheme = !lightTheme;
  localStorage.setItem(THEME_KEY, lightTheme ? 'light' : 'dark');
  applyTheme();
});

$('#back-to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

let audioContext;
function playChime(frequency = 440) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, offset, duration) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      const start = audioContext.currentTime + offset;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };
    playNote(frequency, 0, 0.35);
    playNote(frequency * 1.26, 0.12, 0.35);
    playNote(frequency * 1.5, 0.24, 0.5);
  } catch { /* 音频不可用时静音 */ }
}

const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
let musicTimer = null;
let musicStep = 0;
$('#music-btn').addEventListener('click', (event) => {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
    event.currentTarget.innerHTML = '♫ 播放我们的旋律';
    return;
  }
  event.currentTarget.innerHTML = '♫ 停止播放 ■';
  const playMelodyNote = () => {
    playChime(melody[musicStep % melody.length]);
    musicStep++;
  };
  playMelodyNote();
  musicTimer = setInterval(playMelodyNote, 900);
});

FX.initReveal();
FX.initScroll();
FX.bindGlobalClicks();

window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 1500));
setTimeout(() => $('#loader').classList.add('done'), 3500);