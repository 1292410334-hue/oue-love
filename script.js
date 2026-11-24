const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);
const daysTogether = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000));

const zoneNames = {
  tv: '电视', window: '窗户', clock: '挂钟', map: '墙上地图', photo: '照片墙',
  bookshelf: '书架', cat: '小猫', sofa: '沙发', diary: '茶几日记', plant: '盆栽',
  radio: '音响', door: '门'
};

const foundKey = 'pixel-house-found';
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem(foundKey) || '[]')); } catch {}

function renderLegend() {
  $('#legend-items').innerHTML = Object.entries(zoneNames).map(([id, name]) => `
    <span class="legend-item ${found.has(id) ? 'found' : ''}"><span class="mark">${found.has(id) ? '✦' : '◌'}</span>${name}</span>`).join('');
  $('#found-count').textContent = `✦ 已发现 ${found.size} / ${Object.keys(zoneNames).length} 个彩蛋`;
}
renderLegend();

function markFound(id) {
  if (!found.has(id)) {
    found.add(id);
    try { localStorage.setItem(foundKey, JSON.stringify([...found])); } catch {}
    renderLegend();
  }
}

function playTone(freq, duration = 0.12, type = 'square') {
  try {
    const ctx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}
function playFoundJingle() {
  playTone(523);
  setTimeout(() => playTone(659), 90);
  setTimeout(() => playTone(784), 180);
}

const modal = $('#modal');
function openModal({ badge = '✦', eyebrow = 'SECRET FOUND', title, body }) {
  $('#modal-badge').textContent = badge;
  $('#modal-eyebrow').textContent = eyebrow;
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  modal.hidden = false;
  playFoundJingle();
}
function closeModal() { modal.hidden = true; }
modal.addEventListener('click', (event) => {
  if (event.target.hasAttribute('data-close')) closeModal();
});

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function randomLine(list) { return list[Math.floor(Math.random() * list.length)]; }

let musicTimer = null;
let musicStep = 0;
const melody = [523, 659, 784, 659, 587, 698, 880, 698];

const handlers = {
  tv() {
    const photos = CONFIG.photos || [];
    openModal({
      badge: '▣', title: '电视里的照片',
      body: `<p>电视屏幕上循环播放着我们的照片存档。</p>
        <div class="photo-strip">${photos.map(photo => `<figure><img src="${photo.src}" alt="${escapeHtml(photo.caption)}"><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`).join('')}</div>
        <p style="margin-top:14px;color:var(--muted);font-size:0.75rem">把照片放进 images 文件夹，再改 config.js 就能换成我们的回忆。</p>`
    });
  },
  window() {
    openModal({
      badge: '☾', title: '窗外的夜色',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.windowNotes || []))}</p>
        <p>窗外的星星一闪一闪，像是在替谁数着我们在一起的日子。</p>
        <div class="stat-line"><span>我们已经一起走过</span><strong>${daysTogether} 天</strong></div>`
    });
  },
  clock() {
    const hours = Math.floor((Date.now() - startDate.getTime()) / 3600000);
    openModal({
      badge: '◷', title: '墙上的挂钟',
      body: `<p>这个时钟，记录着我们在一起的每一秒。</p>
        <div class="stat-line"><span>在一起</span><strong>${daysTogether} 天</strong></div>
        <div class="stat-line"><span>一共</span><strong>${hours.toLocaleString()} 小时</strong></div>
        <div class="stat-line"><span>起点</span><strong>2025.07.08</strong></div>
        <p style="margin-top:12px;color:var(--pink-soft)">时间还在走，我们还在继续。</p>`
    });
  },
  map() {
    const places = CONFIG.places || [];
    openModal({
      badge: '✧', title: '墙上的地图',
      body: `<p>地图上的每个标记，都是我们一起走过的地方。</p>
        ${places.map(place => `<div class="story-item"><span>${escapeHtml(place.sub)}</span><h4>${escapeHtml(place.name)}</h4></div>`).join('')}
        <p style="color:var(--muted);font-size:0.75rem">还有好多地方，等着我们一起去。</p>`
    });
  },
  photo() {
    const photos = CONFIG.photos || [];
    openModal({
      badge: '▣', title: '照片墙',
      body: `<p>墙上的每一张照片，都想好好收藏。</p>
        <div class="photo-strip">${photos.map(photo => `<figure><img src="${photo.src}" alt="${escapeHtml(photo.caption)}"><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`).join('')}</div>`
    });
  },
  bookshelf() {
    openModal({
      badge: '✉', title: '书架上的情书',
      body: `<p class="quote">${escapeHtml(CONFIG.letter || '').replace(/\n/g, '<br>')}</p>`
    });
  },
  cat() {
    openModal({
      badge: '♡', title: '小猫咪的秘密',
      body: `<p>${escapeHtml(randomLine(CONFIG.catLines || []))}</p>
        <p style="color:var(--muted)">（它摇了摇尾巴，好像很满意你摸了摸它。）</p>`
    });
  },
  sofa() {
    openModal({
      badge: '♥', title: '沙发上的情话',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.loveLines || []))}</p>
        <p style="color:var(--muted);font-size:0.75rem">再坐一会儿？沙发上的情话还有很多句。</p>`
    });
  },
  diary() {
    openModal({
      badge: '◈', title: '茶几上的日记本',
      body: `<p>翻开日记，第一页写着我们的故事。</p>
        ${(CONFIG.timeline || []).map(item => `<div class="story-item"><span>${escapeHtml(item.date)}</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join('')}`
    });
  },
  plant() {
    const key = 'pixel-house-notes';
    let notes = [];
    try { notes = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    function renderNoteList() {
      $('#note-area').innerHTML = notes.length ? notes.map((note, index) => `
        <div class="note-item"><button data-index="${index}" aria-label="删除">✕</button><p>${escapeHtml(note.text)}</p><small>${note.time}</small></div>`).join('')
        : '<p style="color:var(--muted);font-size:0.75rem">还没有留言，写下第一句吧。</p>';
    }
    openModal({
      badge: '✎', title: '盆栽旁的留言',
      body: `<p>把这盆植物当作我们的留言板吧。</p>
        <textarea id="note-input" maxlength="200" placeholder="写下想对 Ta 说的话……"></textarea>
        <div style="text-align:right;margin:10px 0 18px"><button class="pixel-btn" id="note-add">贴上去 ✦</button></div>
        <div id="note-area"></div>`
    });
    renderNoteList();
    $('#note-add').addEventListener('click', () => {
      const input = $('#note-input');
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      notes.unshift({ text, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
      try { localStorage.setItem(key, JSON.stringify(notes)); } catch {}
      input.value = '';
      renderNoteList();
      playTone(880);
    });
    $('#note-area').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-index]');
      if (!button) return;
      notes.splice(Number(button.dataset.index), 1);
      try { localStorage.setItem(key, JSON.stringify(notes)); } catch {}
      renderNoteList();
    });
  },
  radio() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
      openModal({ badge: '♫', title: '音响已关闭', body: '<p>音乐停下了，但心里的旋律还在。</p>' });
      return;
    }
    openModal({ badge: '♫', title: '我们的旋律', body: '<p>8-bit 小旋律正在播放中～ 再点一次音响可以停止。</p>' });
    const playNote = () => {
      playTone(melody[musicStep % melody.length], 0.3, 'square');
      musicStep++;
    };
    playNote();
    musicTimer = setInterval(playNote, 420);
  },
  door() {
    const badges = CONFIG.badges || [];
    const unlocked = badges.filter(b => daysTogether >= b.days).length;
    openModal({
      badge: '✦', title: '门后面的未来',
      body: `<p class="quote">${escapeHtml((CONFIG.doorNote || '').replace(/\n/g, '<br>'))}</p>
        <p>我们已经解锁了 <span class="highlight">${unlocked} / ${badges.length}</span> 个纪念徽章：</p>
        <div class="badge-grid">${badges.map(b => `<span class="badge ${daysTogether >= b.days ? 'unlocked' : ''}">${daysTogether >= b.days ? b.icon : '◌'} ${b.name}</span>`).join('')}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, daysTogether / 10)}%"></div></div>
        <p style="color:var(--muted);font-size:0.75rem">下一个目标：520 天，还有 ${Math.max(0, 520 - daysTogether)} 天。</p>`
    });
  }
};

function interact(id) {
  markFound(id);
  if (handlers[id]) handlers[id]();
  else openModal({ title: zoneNames[id] || '彩蛋', body: '<p>这里的故事，以后慢慢补上。</p>' });
}

function tryInteract() {
  const zone = PIXEL.getZone();
  if (zone) interact(zone.id);
  else {
    const toast = $('#zone-toast');
    $('#toast-text').textContent = '走近发光的物品再按互动哦';
    toast.classList.add('show');
    clearTimeout(tryInteract.timer);
    tryInteract.timer = setTimeout(() => toast.classList.remove('show'), 1600);
  }
}

let lastZoneId = null;
setInterval(() => {
  const zone = PIXEL.getZone();
  const toast = $('#zone-toast');
  if (zone) {
    if (lastZoneId !== zone.id) playTone(880, 0.05, 'sine');
    lastZoneId = zone.id;
    $('#toast-text').textContent = `${zone.label} · ${zone.hint}`;
    toast.classList.add('show');
  } else {
    lastZoneId = null;
    toast.classList.remove('show');
  }
}, 120);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'Enter') {
    if (!modal.hidden) return;
    event.preventDefault();
    tryInteract();
  }
  if (event.code === 'Escape') closeModal();
});

$('#interact-btn').addEventListener('click', tryInteract);
window.addEventListener('zone-interact', (event) => interact(event.detail));

document.querySelectorAll('.dpad-btn').forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    button.classList.add('pressed');
    PIXEL.setKey(key, true);
  };
  const release = (event) => {
    event.preventDefault();
    button.classList.remove('pressed');
    PIXEL.setKey(key, false);
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
});

function updateDayCounter() {
  $('#day-counter').textContent = String(daysTogether).padStart(4, '0');
}
updateDayCounter();