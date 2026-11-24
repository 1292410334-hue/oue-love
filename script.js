const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);

function updateCounter() {
  const diff = Math.max(0, Date.now() - startDate.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;
  $('#days').textContent = days;
  $('#hours').textContent = String(hours).padStart(2, '0');
  $('#minutes').textContent = String(minutes).padStart(2, '0');
  $('#seconds').textContent = String(seconds).padStart(2, '0');
}
updateCounter();
setInterval(updateCounter, 1000);

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
      return setTimeout(typeStep, 2200);
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

function burstHearts(amount = 16) {
  const layer = $('#floating-hearts');
  for (let i = 0; i < amount; i++) {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = ['💕', '💗', '💖', '🌸', '✨'][Math.floor(Math.random() * 5)];
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.animationDuration = `${3 + Math.random() * 2.5}s`;
    heart.style.fontSize = `${1 + Math.random()}rem`;
    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 6000);
  }
}

$('#love-btn').addEventListener('click', () => {
  const lines = CONFIG.loveLines;
  const message = $('#love-message');
  let next;
  do { next = lines[Math.floor(Math.random() * lines.length)]; } while (lines.length > 1 && next === message.textContent);
  message.textContent = next;
  message.classList.remove('pop');
  void message.offsetWidth;
  message.classList.add('pop');
  burstHearts();
});

$('#timeline').innerHTML = CONFIG.timeline.map(item => `
  <article class="timeline-item">
    <div class="timeline-emoji">${item.emoji}</div>
    <div>
      <p class="timeline-date">${item.date}</p>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>
  </article>`).join('');

const galleryGrid = $('#gallery-grid');
galleryGrid.innerHTML = CONFIG.photos.map((photo, index) => `
  <div class="gallery-card" data-index="${index}" role="button" tabindex="0" aria-label="查看 ${photo.caption}">
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

galleryGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.gallery-card');
  if (card) { showPhoto(Number(card.dataset.index)); lightbox.hidden = false; }
});
galleryGrid.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const card = event.target.closest('.gallery-card');
  if (card) { showPhoto(Number(card.dataset.index)); lightbox.hidden = false; }
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

function renderNotes() {
  const notes = loadNotes();
  noteList.innerHTML = notes.length ? notes.map((note, index) => `
    <div class="note-card">
      <button data-index="${index}" aria-label="删除留言">✕</button>
      <p>${escapeHtml(note.text)}</p>
      <small>${note.time}</small>
    </div>`).join('') : '<p style="text-align:center;color:var(--muted)">还没有留言，写下第一句吧～</p>';
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

noteInput.addEventListener('input', () => {
  $('#note-count').textContent = `${noteInput.value.length} / 200`;
});

$('#note-submit').addEventListener('click', () => {
  const text = noteInput.value.trim();
  if (!text) { noteInput.focus(); return; }
  const notes = loadNotes();
  notes.unshift({
    text,
    time: new Date().toLocaleString('zh-CN', { hour12: false })
  });
  saveNotes(notes);
  noteInput.value = '';
  $('#note-count').textContent = '0 / 200';
  renderNotes();
  burstHearts(10);
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
