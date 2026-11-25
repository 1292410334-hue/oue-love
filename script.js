const $ = (selector) => document.querySelector(selector);
const startDate = new Date(...CONFIG.startDate);
function computeDays() {
  return Math.max(0, Math.floor((Date.now() - startDate.getTime()) / 86400000));
}
let daysTogether = computeDays();
function refreshDays() {
  const latest = computeDays();
  if (latest !== daysTogether) {
    daysTogether = latest;
    window.dispatchEvent(new CustomEvent('days-change', { detail: latest }));
  }
  const text = String(daysTogether).padStart(4, '0');
  const introDay = $('#intro-day');
  const dayCounter = $('#day-counter');
  if (introDay) introDay.textContent = text;
  if (dayCounter) dayCounter.textContent = text;
}
setInterval(refreshDays, 30000);

const zoneNames = {
  // 客厅
  neon: 'LOVE灯牌', calendar: '墙上日历', clock: '挂钟', window: '窗户', map: '足迹地图',
  photo: '照片墙', bookshelf: '书架', tv: '电视', arcade: '街机', sofa: '情侣沙发',
  diary: '茶几日记', coffee: '两杯咖啡', plant: '盆栽', cat: '小猫', radio: '音响',
  trivia: '默契问答',
  // 卧室
  bed: '我们的床', pillowtalk: '情侣抱枕', nightstand: '床头柜', wardrobe: '衣柜',
  bedwindow: '卧室窗户', dreamcatcher: '捕梦网', 'photo-lamp': '照片灯', slippers: '情侣拖鞋',
  // 厨房
  stove: '灶台', cabinet: '橱柜', dining: '餐桌', menu: '今日菜单', 'coffee-machine': '咖啡机',
  recipe: '食谱架', apron: '情侣围裙',
  // 卫生间
  mirror: '镜子', sink: '洗手台', bathtub: '浴缸', rubberduck: '小黄鸭', towels: '情侣毛巾',
  'plant-bath': '绿植', 'notes-bath': '浴室便签'
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

window.addEventListener('room-change', (event) => {
  const names = { living: '客厅 · LIVING ROOM', bedroom: '卧室 · BEDROOM', kitchen: '厨房 · KITCHEN', bathroom: '卫生间 · BATHROOM' };
  $('#room-name').textContent = names[event.detail] || '小屋';
  const toast = $('#zone-toast');
  $('#toast-text').textContent = `欢迎来到${names[event.detail].split(' · ')[0]} ♡`;
  toast.classList.add('show');
  clearTimeout(window.roomToastTimer);
  window.roomToastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
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
            if (window.Quest) setTimeout(() => window.Quest.notify('arcade-win'), 400);
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
  // ===== 房间门 =====
  'door-bedroom'() { PIXEL.setRoom('bedroom'); },
  'door-kitchen'() { PIXEL.setRoom('kitchen'); },
  'door-bathroom'() { PIXEL.setRoom('bathroom'); },
  'door-living'() { PIXEL.setRoom('living'); },
  'door-living-k'() { PIXEL.setRoom('living'); },
  'door-living-b'() { PIXEL.setRoom('living'); },

  // ===== 卧室彩蛋 =====
  bed() {
    openModal({ badge: '☾', title: '我们的床',
      body: `<p class="quote">一天里最放松的时刻，是和你一起躺下聊天的那些夜晚。</p>
        <p>聊今天发生的小事，聊以后想去的地方，聊着聊着就睡着了。</p>
        <p style="color:var(--muted);font-size:0.75rem">被子上有淡淡的洗衣液香味，枕头是我们一起挑的。</p>` });
  },
  pillowtalk() {
    openModal({ badge: '♥', title: '枕边悄悄话',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.loveLines || []))}</p>
        <p style="color:var(--muted)">抱着这个枕头的时候，就像你在身边一样。</p>` });
  },
  nightstand() {
    openModal({ badge: '◷', title: '床头柜',
      body: `<p>床头柜上放着一盏小台灯和一个闹钟。</p>
        <p class="quote">晚安不是结束，是为了明天醒来还能继续和你说早安。</p>
        <div class="stat-line"><span>今晚的睡前故事</span><strong>由崇新主讲 ♥</strong></div>` });
  },
  wardrobe() {
    openModal({ badge: '◈', title: '衣柜',
      body: `<p>衣柜里挂着我们的衣服，左边是你的，右边是我的。</p>
        <p class="quote">最喜欢的事情之一，就是和你一起挑今天穿什么。</p>
        <p style="color:var(--muted);font-size:0.75rem">有时候还会穿情侣装出门，被别人看到也不害羞。</p>` });
  },
  bedwindow() {
    openModal({ badge: '✧', title: '卧室的星空',
      body: `<p class="quote">${escapeHtml(randomLine(CONFIG.windowNotes || []))}</p>
        <p>睡前看一眼窗外，星星都在替我们说晚安。</p>` });
  },
  dreamcatcher() {
    openModal({ badge: '✦', title: '捕梦网',
      body: `<p>挂在这里的捕梦网，听说能抓住好梦、挡走噩梦。</p>
        <p class="quote">愿你每晚都有好梦，梦里也有我。</p>` });
  },
  'photo-lamp'() {
    if (window.PhotoGallery) window.PhotoGallery.openGallery();
    else openModal({ badge: '▣', title: '照片灯串', body: '<p>照片灯串正在准备中…</p>' });
  },
  slippers() {
    openModal({ badge: '♡', title: '情侣拖鞋',
      body: `<p>门口摆着两双拖鞋，一大一小，刚好是一对。</p>
        <p class="quote">回家的时候看到它们，就知道这个家里有人在等你。</p>` });
  },

  // ===== 厨房彩蛋 =====
  stove() {
    openModal({ badge: '♨', title: '灶台',
      body: `<p>厨房的灶台，是我们一起研究新菜的地方。</p>
        <p class="quote">不管是成功还是失败，和你一起做的饭都特别香。</p>
        <p style="color:var(--muted);font-size:0.75rem">下次想做什么菜？告诉你一声，我负责洗碗。</p>` });
  },
  cabinet() {
    openModal({ badge: '◈', title: '橱柜',
      body: `<p>橱柜里有我们的碗和杯子，都是一起挑的。</p>
        <p style="color:var(--muted)">左边放你爱吃的零食，右边放我爱喝的茶。中间那一格，留给惊喜。</p>` });
  },
  dining() {
    openModal({ badge: '♥', title: '我们的餐桌',
      body: `<p>一张小餐桌，两把椅子，够我们坐一辈子。</p>
        <p class="quote">想和你一起吃很多顿饭，把每一天都过得有滋有味。</p>` });
  },
  menu() {
    openModal({ badge: '✎', title: '今日菜单',
      body: `<p>今天的菜单由你决定——</p>
        <div class="stat-line"><span>主食</span><strong>你爱吃的</strong></div>
        <div class="stat-line"><span>配菜</span><strong>我做的</strong></div>
        <div class="stat-line"><span>甜点</span><strong>一起分享</strong></div>
        <p style="color:var(--pink-soft);margin-top:10px">想吃什么，点「盆栽」留言告诉我 ♥</p>` });
  },
  'coffee-machine'() {
    openModal({ badge: '☕', title: '咖啡机',
      body: `<p>每天早上为你煮一杯咖啡，是我最开心的小事之一。</p>
        <p class="quote">加多少糖、多少奶，我都记得。</p>` });
  },
  recipe() {
    openModal({ badge: '◈', title: '食谱架',
      body: `<p>食谱架上放着我们收藏的菜谱，还有很多写满笔记的便签。</p>
        <p class="quote">我们的拿手菜：一起研究出来的「爱的味道」。</p>
        <p style="color:var(--muted);font-size:0.75rem">以后学会了新菜，就在这里加一笔。</p>` });
  },
  apron() {
    openModal({ badge: '♡', title: '情侣围裙',
      body: `<p>两条围裙挂在一起，一条写着「主厨」，一条写着「洗碗的」。</p>
        <p class="quote">厨房是我们的小舞台，柴米油盐也可以很浪漫。</p>` });
  },

  // ===== 卫生间彩蛋 =====
  mirror() {
    openModal({ badge: '✧', title: '镜子',
      body: `<p class="quote">镜子里的我们，一起变老，也一起变更好。</p>
        <p style="color:var(--muted)">每天早上对着它整理发型，然后出门奔赴彼此。</p>` });
  },
  sink() {
    openModal({ badge: '◌', title: '洗手台',
      body: `<p>洗手台上并排放着两个杯子、两支牙刷。</p>
        <p class="quote">早起一起刷牙的样子，是我最喜欢的日常。</p>` });
  },
  bathtub() {
    openModal({ badge: '♨', title: '浴缸',
      body: `<p>泡泡满了，热水刚好，音乐也刚好。</p>
        <p class="quote">和你一起泡澡、聊天、发呆，时间会变得很慢很慢。</p>` });
  },
  rubberduck() {
    openModal({ badge: '🦆', title: '小黄鸭',
      body: `<p>这是我们浴缸里的「吉祥物」。</p>
        <p style="color:var(--muted)">它看起来很淡定，好像在说：你俩的故事，我全都见证过。</p>` });
  },
  towels() {
    openModal({ badge: '♥', title: '情侣毛巾',
      body: `<p>两条毛巾挂在一起，一条粉色，一条薄荷绿。</p>
        <p class="quote">连毛巾都要成双成对，这就是我们的小心思。</p>` });
  },
  'plant-bath'() {
    openModal({ badge: '✿', title: '浴室里的绿植',
      body: `<p>小小的绿植在浴室里也活得很好，就像我们的感情。</p>
        <p style="color:var(--muted)">不需要太多阳光，一点点陪伴就够。</p>` });
  },
  'notes-bath'() {
    openModal({ badge: '✎', title: '浴室便签',
      body: `<p class="quote">一些只在这里才会看到的小秘密：</p>
        <p style="margin-top:12px">「今天也想你了。」<br>「记得买草莓牛奶。」<br>「晚安，明天见。」</p>` });
  },
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
    if (window.PhotoGallery) window.PhotoGallery.openGallery();
    else openModal({ badge: '▣', title: '照片墙', body: '<p>照片墙正在准备中…</p>' });
  },
  bookshelf() {
    openModal({ badge: '✉', title: '书架上的情书',
      body: `<p class="quote">${escapeHtml(CONFIG.letter || '').replace(/\n/g, '<br>')}</p>` });
  },
  tv() {
    if (window.PhotoGallery) window.PhotoGallery.openGallery();
    else openModal({ badge: '▣', title: '电视里的照片', body: '<p>照片存档正在准备中…</p>' });
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
    const tracks = [
      { name: "有点甜 · 治愈版", notes: [523,587,659,784,659,587,523,587,659,659,784,880,784,659,587,523] },
      { name: "小酒窝 · 温柔版", notes: [440,523,587,659,587,523,440,392,440,523,587,523,440,392,349,392] },
      { name: "爱很简单 · 慢版", notes: [349,440,523,587,523,440,392,349,392,440,523,659,587,523,440,349] },
      { name: "星空小夜曲", notes: [523,659,784,1047,784,659,587,698,880,698,587,523,587,659,784,659] }
    ];
    const trackIndex = musicStep % tracks.length;
    const track = tracks[trackIndex];
    const playing = Boolean(musicTimer);
    openModal({
      badge: '♫', eyebrow: 'MUSIC BOX', title: '我们的音乐盒',
      body: `<div class="music-box">
        <p style="color:var(--muted);font-size:0.78rem">用小屋里的播放器听一段温柔的旋律 ♪</p>
        <div class="now-playing"><span class="vinyl ${playing ? 'spinning' : ''}">♫</span><div><strong>${track.name}</strong><small>${playing ? '正在播放' : '点击播放'}</small></div></div>
        <div class="music-list">
          ${tracks.map((item, index) => `<button class="music-item ${index === trackIndex ? 'active' : ''}" data-track="${index}"><span class="music-num">${String(index+1).padStart(2,'0')}</span><span class="music-name">${item.name}</span></button>`).join('')}
        </div>
        <div class="music-controls">
          <button class="pixel-btn" id="music-toggle">${playing ? '■ 停止' : '▶ 播放'}</button>
        </div>
        <p class="music-tip">这些旋律是用浏览器现场合成的，不需要联网，一定能播出来 ♡</p>
        <p class="music-tip" style="margin-top:6px">想听网易云里的完整版？<a href="https://music.163.com" target="_blank" rel="noopener" style="color:var(--pink-soft)">去网易云听 →</a></p>
      </div>`
    });

    function stopMusic() {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    }
    function playMusic() {
      stopMusic();
      let index = 0;
      const playNext = () => {
        playTone(track.notes[index % track.notes.length], 0.42, 'sine');
        if (index % 4 === 0) playTone(Math.round(track.notes[index % track.notes.length] / 2), 0.5, 'triangle');
        index++;
      };
      playNext();
      musicTimer = setInterval(playNext, 480);
    }
    $('#music-toggle').addEventListener('click', () => {
      if (musicTimer) { stopMusic(); $('#music-toggle').textContent = '▶ 播放'; const vinyl = document.querySelector('.vinyl'); if (vinyl) vinyl.classList.remove('spinning'); }
      else { playMusic(); $('#music-toggle').textContent = '■ 停止'; const vinyl = document.querySelector('.vinyl'); if (vinyl) vinyl.classList.add('spinning'); }
    });
    $('#music-list').addEventListener('click', (event) => {
      const item = event.target.closest('[data-track]');
      if (!item) return;
      musicStep = Number(item.dataset.track);
      handlers.radio();
    });
  },  fridge() {
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
  if (window.Quest) window.Quest.notify(id);
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
