const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);
const daysTogether = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000));

const zoneNames = {
  neon: 'LOVE灯牌', calendar: '墙上日历', clock: '挂钟', window: '窗户', map: '足迹地图',
  photo: '照片墙', bookshelf: '书架', tv: '电视', arcade: '街机', sofa: '情侣沙发',
  diary: '茶几日记', coffee: '两杯咖啡', plant: '盆栽', cat: '小猫', radio: '音响',
  fridge: '冰箱', door: '门', trivia: '默契问答'
};

// ===== 开场 =====
$('#intro-day').textContent = String(daysTogether).padStart(4, '0');
$('#day-counter').textContent = String(daysTogether).padStart(4, '0');
$('#start-btn').addEventListener('click', () => {
  $('#intro').classList.add('hide');
  $('#game-shell').hidden = false;
  window.dispatchEvent(new Event('resize'));
  playTone(523);
  setTimeout(() => playTone(784), 120);
});
$('#intro-replay').addEventListener('click', () => {
  $('#intro').classList.remove('hide');
});

// ===== 彩蛋进度 =====
const foundKey = 'pixel-house-found-v2';
let found = new Set();
try { found = new Set(JSON.parse(localStorage.getItem(foundKey) || '[]')); } catch {}
function updateFoundCount() {
  $('#found-count').textContent = `✦ 已发现 ${found.size} / ${Object.keys(zoneNames).length} 个彩蛋`;
}
updateFoundCount();
function markFound(id) {
  if (!found.has(id)) {
    found.add(id);
    try { localStorage.setItem(foundKey, JSON.stringify([...found])); } catch {}
    updateFoundCount();
  }
}

// ===== 音效 =====
function playTone(freq, duration = 0.12, type = 'square') {
  try {
    const ctx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch {}
}
function playFoundJingle() {
  playTone(523); setTimeout(() => playTone(659), 90); setTimeout(() => playTone(784), 180);
}

// ===== 弹窗 =====
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

// ===== 小游戏 1：情侣记忆翻牌 =====
function startMemoryGame() {
  const symbols = ['♥', '✦', '☾', '✿', '♡', '✧', '☀', '❀'];
  const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let locked = false;

  openModal({
    badge: '▣', eyebrow: 'MINI GAME', title: '记忆翻牌',
    body: `<div class="game-ui">
      <p class="game-ui-title">翻开卡片，找出 8 对相同的图案</p>
      <div class="memory-grid" id="memory-grid"></div>
      <p class="game-status" id="game-status">步数：0 · 配对：0 / 8</p>
    </div>`
  });

  const grid = $('#memory-grid');
  const status = $('#game-status');
  grid.innerHTML = deck.map((symbol, index) => `<button class="memory-card" data-index="${index}" data-symbol="${symbol}">?</button>`).join('');

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.memory-card');
    if (!card || locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    playTone(600, 0.08);
    flipped.push(card);
    if (flipped.length === 2) {
      moves++;
      locked = true;
      const [first, second] = flipped;
      if (first.dataset.symbol === second.dataset.symbol) {
        setTimeout(() => {
          first.classList.add('matched');
          second.classList.add('matched');
          matched++;
          status.textContent = `步数：${moves} · 配对：${matched} / 8`;
          flipped = [];
          locked = false;
          playTone(880);
          if (matched === 8) {
            status.textContent = `🎉 全部配对！用了 ${moves} 步 · ${escapeHtml(CONFIG.arcadeReward)}`;
            setTimeout(() => playTone(1047), 200);
          }
        }, 400);
      } else {
        setTimeout(() => {
          first.classList.remove('flipped');
          second.classList.remove('flipped');
          first.textContent = '?';
          second.textContent = '?';
          flipped = [];
          locked = false;
        }, 700);
      }
    }
  });
}

// ===== 小游戏 2：情侣默契问答 =====
const triviaQuestions = [
  { q: '我们在一起的日子是哪一天？', options: ['2025年7月8日', '2025年8月7日', '2024年7月8日'], answer: 0 },
  { q: '下面哪个是艺萌最喜欢听到的称呼？', options: ['小朋友', '艺萌', '宝贝'], answer: 1 },
  { q: '我们的小屋叫什么名字？', options: ['爱情公寓', '像素小屋', '小花园'], answer: 1 },
  { q: '这个网站是谁做的？', options: ['崇新', '艺萌', '猫猫'], answer: 0 },
  { q: '我们在一起多少天时会解锁「我爱你」徽章？', options: ['365天', '520天', '1000天'], answer: 1 }
];
let triviaIndex = 0;
let triviaScore = 0;

function startTriviaGame() {
  triviaIndex = 0;
  triviaScore = 0;
  openModal({
    badge: '?', eyebrow: 'MINI GAME', title: '情侣默契问答',
    body: `<div class="game-ui" id="trivia-ui"></div>`
  });
  renderTrivia();
}
function renderTrivia() {
  const ui = $('#trivia-ui');
  if (triviaIndex >= triviaQuestions.length) {
    ui.innerHTML = `<p class="game-ui-title">问答结束！</p>
      <p class="trivia-question">你的默契分：${triviaScore} / ${triviaQuestions.length}</p>
      <p>${triviaScore >= 4 ? '太棒了！你真的很了解我们的故事 ♥' : '再多看看我们的小屋，答案都藏在里面哦。'}</p>
      <button class="pixel-btn" id="trivia-restart">再玩一次</button>`;
    $('#trivia-restart').addEventListener('click', () => { triviaIndex = 0; triviaScore = 0; renderTrivia(); });
    return;
  }
  const item = triviaQuestions[triviaIndex];
  ui.innerHTML = `<p class="game-ui-title">第 ${triviaIndex + 1} / ${triviaQuestions.length} 题</p>
    <p class="trivia-question">${escapeHtml(item.q)}</p>
    <div class="trivia-options">${item.options.map((option, index) => `<button class="trivia-option" data-index="${index}">${String.fromCharCode(65 + index)}. ${escapeHtml(option)}</button>`).join('')}</div>`;
  ui.querySelectorAll('.trivia-option').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = Number(button.dataset.index);
      const correct = selected === item.answer;
      button.classList.add(correct ? 'correct' : 'wrong');
      if (correct) { triviaScore++; playTone(880); }
      else playTone(300);
      setTimeout(() => { triviaIndex++; renderTrivia(); }, 600);
    });
  });
}

// ===== 18 个彩蛋 =====
const handlers = {
  neon() {
    openModal({ badge: '♥', title: 'LOVE 灯牌',
      body: `<p class="quote">${CONFIG.nameA} ♥ ${CONFIG.nameB}</p>
        <p>这盏灯一直亮着，就像我对你的喜欢，从来没灭过。</p>
        <div class="stat-line"><span>我们已经一起走过</span><strong>${daysTogether} 天</strong></div>` });
  },
  calendar() {
    openModal({ badge: '◈', title: '墙上日历',
      body: `<p>日历上，7 月 8 日被红笔圈了起来。</p>
        <p class="quote">2025.07.08 · 故事的开始</p>
        <p style="color:var(--muted)">以后的每一年，这一天都值得庆祝。</p>` });
  },
  clock() {
    const hours = Math.floor((Date.now() - startDate.getTime()) / 3600000);
    openModal({ badge: '◷', title: '墙上的挂钟',
      body: `<p>这个时钟，记录着我们在一起的每一秒。</p>
        <div class="stat-line"><span>在一起</span><strong>${daysTogether} 天</strong></div>
        <div class="stat-line"><span>一共</span><strong>${hours.toLocaleString()} 小时</strong></div>
        <div class="stat-line"><span>起点</span><strong>2025.07.08</strong></div>
        <p style="margin-top:12px;color:var(--pink-soft)">时间还在走，我们还在继续。</p>` });
  },
  window() {
    openModal({ badge: '☾', title: '窗外的夜色',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.windowNotes || []))}</p>
        <p>窗外的星星一闪一闪，像是在替谁数着我们在一起的日子。</p>
        <div class="stat-line"><span>我们已经一起走过</span><strong>${daysTogether} 天</strong></div>` });
  },
  map() {
    openModal({ badge: '✧', title: '墙上的地图',
      body: `<p>地图上的每个标记，都是我们一起走过的地方。</p>
        ${(CONFIG.places || []).map(place => `<div class="story-item"><span>${escapeHtml(place.sub)}</span><h4>${escapeHtml(place.name)}</h4></div>`).join('')}
        <p style="color:var(--muted);font-size:0.75rem">还有好多地方，等着我们一起去。</p>` });
  },
  photo() {
    openModal({ badge: '▣', title: '照片墙',
      body: `<p>墙上的每一张照片，都想好好收藏。</p>
        <div class="photo-strip">${(CONFIG.photos || []).map(photo => `<figure><img src="${photo.src}" alt="${escapeHtml(photo.caption)}"><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`).join('')}</div>` });
  },
  bookshelf() {
    openModal({ badge: '✉', title: '书架上的情书',
      body: `<p class="quote">${escapeHtml(CONFIG.letter || '').replace(/\n/g, '<br>')}</p>` });
  },
  tv() {
    openModal({ badge: '▣', title: '电视里的照片',
      body: `<p>电视屏幕上循环播放着我们的照片存档。</p>
        <div class="photo-strip">${(CONFIG.photos || []).map(photo => `<figure><img src="${photo.src}" alt="${escapeHtml(photo.caption)}"><figcaption>${escapeHtml(photo.caption)}</figcaption></figure>`).join('')}</div>
        <p style="margin-top:14px;color:var(--muted);font-size:0.75rem">把照片放进 images 文件夹，再改 config.js 就能换成我们的回忆。</p>` });
  },
  arcade: startMemoryGame,
  trivia: startTriviaGame,
  sofa() {
    openModal({ badge: '♥', title: '沙发上的情话',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.loveLines || []))}</p>
        <p style="color:var(--muted)">沙发上还放着两枚情侣抱枕和一条爱心毯子——就像我们窝在一起看电影的夜晚。</p>
        <p style="color:var(--muted);font-size:0.75rem">再坐一会儿？沙发上的情话还有很多句。</p>` });
  },
  diary() {
    openModal({ badge: '◈', title: '茶几上的日记本',
      body: `<p>翻开日记，第一页写着我们的故事。</p>
        ${(CONFIG.timeline || []).map(item => `<div class="story-item"><span>${escapeHtml(item.date)}</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.text)}</p></div>`).join('')}` });
  },
  coffee() {
    openModal({ badge: '☕', title: '两杯咖啡',
      body: `<p>茶几上放着两杯咖啡，一杯是你的，一杯是我的。</p>
        <p class="quote">想和你一起吃很多顿早餐，喝很多杯咖啡，过很多个平平淡淡的日子。</p>
        <p style="color:var(--muted);font-size:0.75rem">旁边的碟子里还有两块小饼干，留给最爱吃甜的那个人。</p>` });
  },
  plant() {
    const key = 'pixel-house-notes-v2';
    let notes = [];
    try { notes = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    function renderNoteList() {
      $('#note-area').innerHTML = notes.length ? notes.map((note, index) => `
        <div class="note-item"><button data-index="${index}" aria-label="删除">✕</button><p>${escapeHtml(note.text)}</p><small>${note.time}</small></div>`).join('')
        : '<p style="color:var(--muted);font-size:0.75rem">还没有留言，写下第一句吧。</p>';
    }
    openModal({ badge: '✎', title: '盆栽旁的留言',
      body: `<p>把这盆植物当作我们的留言板吧。</p>
        <textarea id="note-input" maxlength="200" placeholder="写下想对 Ta 说的话……"></textarea>
        <div style="text-align:right;margin:10px 0 18px"><button class="pixel-btn" id="note-add">贴上去 ✦</button></div>
        <div id="note-area"></div>` });
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
  cat() {
    openModal({ badge: '♡', title: '小猫咪的秘密',
      body: `<p>${escapeHtml(randomLine(CONFIG.catLines || []))}</p>
        <p style="color:var(--muted)">它伸了个懒腰，从猫窝里走出来，走到猫碗边喝了口水——看起来很满意你摸了摸它。</p>` });
  },
  radio() {
    const customKey = 'pixel-house-custom-songs';
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem(customKey) || '[]'); } catch {}
    const allSongs = [...(CONFIG.playlist || []), ...custom];
    const currentSong = (allSongs[musicStep % allSongs.length]) || allSongs[0];

    openModal({
      badge: '♫', eyebrow: 'NETEASE CLOUD MUSIC', title: '我们的音乐盒',
      body: `<div class="music-box">
        <p style="color:var(--muted);font-size:0.78rem">点一首歌，让网易云陪我们一起待在这个小屋里 ♪</p>
        <div id="music-player"></div>
        <div class="music-list" id="music-list">
          ${allSongs.map((song, index) => `<button class="music-item ${index === (musicStep % allSongs.length) ? 'active' : ''}" data-index="${index}"><span class="music-num">${String(index + 1).padStart(2, '0')}</span><span class="music-name">${escapeHtml(song.name)}</span><span class="music-artist">${escapeHtml(song.artist || '')}</span>${song.custom ? '<span class="music-del" data-del="'+(index - (CONFIG.playlist || []).length)+'" title="删除">✕</span>' : ''}</button>`).join('')}
        </div>
        <div class="music-add">
          <input id="song-link" type="text" placeholder="粘贴网易云歌曲分享链接，添加我们喜欢的歌…">
          <button class="pixel-btn" id="song-add">添加 ♫</button>
        </div>
        <p class="music-tip">在网易云 App 里点「分享 → 复制链接」，粘贴到这里就能加歌。</p>
      </div>`
    });

    function loadPlayer(song) {
      const player = $('#music-player');
      if (!player || !song) return;
      player.innerHTML = `<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width="100%" height="110" src="https://music.163.com/outchain/player?type=2&id=${encodeURIComponent(song.id)}&auto=1&height=86"></iframe>`;
    }
    loadPlayer(currentSong);

    $('#music-list').addEventListener('click', (event) => {
      const del = event.target.closest('[data-del]');
      if (del) {
        event.stopPropagation();
        custom.splice(Number(del.dataset.del), 1);
        try { localStorage.setItem(customKey, JSON.stringify(custom)); } catch {}
        handlers.radio();
        return;
      }
      const item = event.target.closest('.music-item');
      if (!item) return;
      musicStep = Number(item.dataset.index);
      loadPlayer(allSongs[musicStep]);
      $('#music-list').querySelectorAll('.music-item').forEach((node, index) => node.classList.toggle('active', index === musicStep));
      playTone(784);
    });

    $('#song-add').addEventListener('click', () => {
      const input = $('#song-link');
      const link = input.value.trim();
      if (!link) { input.focus(); return; }
      // 从分享链接里解析歌曲 ID
      let idMatch = link.match(/[?&#/]id=(\d+)/) || link.match(/\b(\d{5,})\b/);
      // 处理短链接：尝试从 /song/ 路径解析
      if (!idMatch) idMatch = link.match(/\/song\/(\d+)/);
      if (!idMatch) {
        input.value = '';
        input.placeholder = '没找到歌曲 ID，请粘贴完整的网易云分享链接';
        return;
      }
      const id = idMatch[1];
      const nameMatch = link.match(/(?:歌名|song|title)[=:：\s]+([^\s&#]+)/i);
      custom.push({ id, name: nameMatch ? nameMatch[1] : `我的收藏 ${custom.length + 1}`, artist: '网易云', custom: true });
      try { localStorage.setItem(customKey, JSON.stringify(custom)); } catch {}
      playTone(880);
      handlers.radio();
    });
  },
  fridge() {
    openModal({ badge: '✎', title: '冰箱上的便签',
      body: `<p>冰箱上贴着几张歪歪扭扭的便签，都是生活里的小提醒。</p>
        ${(CONFIG.fridgeNotes || []).map(note => `<div class="story-item"><p>${escapeHtml(note)}</p></div>`).join('')}
        <p style="color:var(--muted);font-size:0.75rem">还有一颗心形冰箱贴，是某次逛超市时顺手买的。</p>` });
  },
  door() {
    const badges = CONFIG.badges || [];
    const unlocked = badges.filter(b => daysTogether >= b.days).length;
    openModal({ badge: '✦', title: '门后面的未来',
      body: `<p class="quote">${escapeHtml((CONFIG.doorNote || '').replace(/\n/g, '<br>'))}</p>
        <p>我们已经解锁了 <span class="highlight">${unlocked} / ${badges.length}</span> 个纪念徽章：</p>
        <div class="badge-grid">${badges.map(b => `<span class="badge ${daysTogether >= b.days ? 'unlocked' : ''}">${daysTogether >= b.days ? b.icon : '◌'} ${b.name}</span>`).join('')}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, daysTogether / 10)}%"></div></div>
        <p style="color:var(--muted);font-size:0.75rem">下一个目标：520 天，还有 ${Math.max(0, 520 - daysTogether)} 天。</p>` });
  }
};

function interact(id) {
  markFound(id);
  if (handlers[id]) handlers[id]();
  else openModal({ title: zoneNames[id] || '彩蛋', body: '<p>这里的故事，以后慢慢补上。</p>' });
}
function tryInteract() {
  if (!$('#intro').classList.contains('hide')) return;
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
  if (!$('#intro').classList.contains('hide')) return;
  const zone = PIXEL.getZone();
  const toast = $('#zone-toast');
  if (zone) {
    if (lastZoneId !== zone.id) playTone(880, 0.05, 'sine');
    lastZoneId = zone.id;
    $('#toast-text').textContent = `${zone.label} · ${zone.hint}`;
    toast.classList.add('show');
  } else { lastZoneId = null; toast.classList.remove('show'); }
}, 120);

window.addEventListener('keydown', (event) => {
  if (!$('#intro').classList.contains('hide')) {
    if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); $('#start-btn').click(); }
    return;
  }
  if (event.code === 'Space' || event.code === 'Enter') {
    if (!modal.hidden) return;
    event.preventDefault();
    tryInteract();
  }
  if (event.code === 'Escape') closeModal();
});

$('#interact-btn').addEventListener('click', tryInteract);
window.addEventListener('zone-interact', (event) => {
  if (!$('#intro').classList.contains('hide')) return;
  interact(event.detail);
});

document.querySelectorAll('.dpad-btn').forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => { event.preventDefault(); button.classList.add('pressed'); PIXEL.setKey(key, true); };
  const release = (event) => { event.preventDefault(); button.classList.remove('pressed'); PIXEL.setKey(key, false); };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
});