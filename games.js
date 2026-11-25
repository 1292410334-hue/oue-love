/* ===== 小游戏中心 · 菜单 + 趣味小游戏合集 ===== */
(() => {
  'use strict';

  const SAVE_KEY = 'love-games-v1';
  const S = (() => {
    const empty = { guessBest: 99, puzzleBest: 0, speedBest: 0, fortuneDraws: 0 };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(empty, JSON.parse(raw));
    } catch {}
    return empty;
  })();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };

  function rhythmBest() {
    try { return JSON.parse(localStorage.getItem('love-quest-v1') || '{}').rhythmBest || 0; } catch { return 0; }
  }

  const games = [
    { id: 'memory', icon: '🃏', name: '记忆翻牌', desc: '找出 8 对相同图案', best: () => '经典' },
    { id: 'trivia', icon: '💬', name: '默契问答', desc: '看看你有多了解我们', best: () => '5 题' },
    { id: 'rhythm', icon: '♥', name: '心跳同步', desc: '跟着节奏点击爱心', best: () => (rhythmBest() ? `最佳 ${rhythmBest()}` : '未挑战') },
    { id: 'guess', icon: '🔢', name: '猜心意', desc: '猜出我心里的数字', best: () => (S.guessBest < 99 ? `最少 ${S.guessBest} 次` : '未挑战') },
    { id: 'puzzle', icon: '🧩', name: '爱情拼图', desc: '3×3 滑块还原我们的画', best: () => (S.puzzleBest ? `最少 ${S.puzzleBest} 步` : '未挑战') },
    { id: 'speed', icon: '⚡', name: '心动速选', desc: '10 秒选出所有爱心', best: () => (S.speedBest ? `最佳 ${S.speedBest}` : '未挑战') },
    { id: 'fortune', icon: '🎋', name: '情话签', desc: '抽一支专属情话签', best: () => `已抽 ${S.fortuneDraws} 次` }
  ];

  function openMenu() {
    openModal({
      badge: '🎮', eyebrow: 'GAME CENTER', title: '我们的游戏厅',
      body: `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:14px">玩小游戏也能涨恋爱经验哦 ♥</p>
        <div class="game-center-grid">
          ${games.map(g => `<button class="gc-card" data-game="${g.id}">
            <span class="gc-icon">${g.icon}</span>
            <span class="gc-name">${g.name}</span>
            <span class="gc-desc">${g.desc}</span>
            <span class="gc-best">${g.best()}</span>
          </button>`).join('')}
        </div>`
    });
    document.querySelectorAll('.gc-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.game;
        closeModal();
        setTimeout(() => launch(id), 120);
      });
    });
  }

  function launch(id) {
    if (id === 'memory') return window.Quest.startMemoryGame();
    if (id === 'trivia') return window.Quest.startTriviaGame();
    if (id === 'rhythm') return window.Quest.startRhythmGame();
    if (id === 'guess') return startGuess();
    if (id === 'puzzle') return startPuzzle();
    if (id === 'speed') return startSpeed();
    if (id === 'fortune') return startFortune();
  }

  // ---------- 猜心意 ----------
  function startGuess() {
    const answer = 1 + Math.floor(Math.random() * 99);
    let tries = 0, last = 0;
    openModal({
      badge: '🔢', eyebrow: 'MINI GAME', title: '猜心意',
      body: `<div class="game-ui">
        <p class="game-ui-title">我心里想了一个 1~99 的数字，猜猜看？</p>
        <div class="guess-display" id="guess-display">?</div>
        <div class="guess-input-row">
          <input type="number" id="guess-input" min="1" max="99" placeholder="输入数字" inputmode="numeric">
          <button class="pixel-btn" id="guess-submit">猜一猜</button>
        </div>
        <p class="game-status" id="guess-status">提示：每次猜完会告诉你大了还是小了</p>
      </div>`
    });
    const input = document.getElementById('guess-input');
    const status = document.getElementById('guess-status');
    const display = document.getElementById('guess-display');
    const submit = document.getElementById('guess-submit');
    function guess() {
      const n = Number(input.value);
      if (!n || n < 1 || n > 99) { status.textContent = '请输入 1~99 之间的数字哦'; return; }
      tries++; last = n;
      display.textContent = n;
      input.value = ''; input.focus();
      if (n === answer) {
        const isBest = tries < S.guessBest;
        if (isBest) { S.guessBest = tries; save(); }
        status.textContent = `🎉 猜中了！答案是 ${answer}，用了 ${tries} 次${isBest ? ' · 新纪录！' : ''}`;
        window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 40, { size: 8, power: 4, up: 2, shape: 'heart' });
        playTone(1047, 0.2);
        submit.disabled = true;
      } else {
        status.textContent = n < answer ? `📈 ${n} 太小了，再大一点（第 ${tries} 次）` : `📉 ${n} 太大了，再小一点（第 ${tries} 次）`;
        playTone(n < answer ? 600 : 400, 0.08);
      }
    }
    submit.addEventListener('click', guess);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') guess(); });
    input.focus();
  }

  // ---------- 爱情拼图（3×3 滑块） ----------
  function startPuzzle() {
    const tiles = [0,1,2,3,4,5,6,7,8];
    // 可行走乱序：从完成态随机移动 80 步
    let blank = 8;
    for (let i = 0; i < 80; i++) {
      const neighbors = [];
      const row = Math.floor(blank / 3), col = blank % 3;
      if (row > 0) neighbors.push(blank - 3);
      if (row < 2) neighbors.push(blank + 3);
      if (col > 0) neighbors.push(blank - 1);
      if (col < 2) neighbors.push(blank + 1);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
      blank = pick;
    }
    let moves = 0;
    const glyphs = ['♥','✦','☾','✿','♡','❀','★','✧','♥'];
    const colors = ['#ff5c8a','#a78bfa','#ffd166','#5eead4','#ff8fab','#a78bfa','#ffd166','#5eead4','#ff5c8a'];

    openModal({
      badge: '🧩', eyebrow: 'MINI GAME', title: '爱情拼图',
      body: `<div class="game-ui">
        <p class="game-ui-title">点击空格旁边的方块，把爱心拼图还原吧</p>
        <div class="puzzle-grid" id="puzzle-grid"></div>
        <p class="game-status" id="puzzle-status">步数：0</p>
      </div>`
    });
    const grid = document.getElementById('puzzle-grid');
    const status = document.getElementById('puzzle-status');
    function render() {
      grid.innerHTML = tiles.map((t, i) => t === 8
        ? `<button class="puzzle-tile blank" data-index="${i}"></button>`
        : `<button class="puzzle-tile" data-index="${i}" style="--tile-color:${colors[t]}">${glyphs[t]}</button>`
      ).join('');
      grid.querySelectorAll('.puzzle-tile:not(.blank)').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.index);
          const row = Math.floor(i / 3), col = i % 3;
          const br = Math.floor(blank / 3), bc = blank % 3;
          if (Math.abs(row - br) + Math.abs(col - bc) !== 1) { playTone(300, 0.06); return; }
          [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]];
          blank = i; moves++;
          status.textContent = `步数：${moves}`;
          playTone(700, 0.06);
          render();
          if (tiles.every((t, idx) => t === idx)) {
            const isBest = !S.puzzleBest || moves < S.puzzleBest;
            if (isBest) { S.puzzleBest = moves; save(); }
            status.textContent = `🎉 拼好了！用了 ${moves} 步${isBest ? ' · 新纪录！' : ''}`;
            window.Quest.heartRain(50);
            playTone(1047, 0.2);
          }
        });
      });
    }
    render();
  }

  // ---------- 心动速选 ----------
  function startSpeed() {
    openModal({
      badge: '⚡', eyebrow: 'MINI GAME', title: '心动速选',
      body: `<div class="game-ui">
        <p class="game-ui-title">10 秒内，点出所有出现的 ♥，不要点到 ☾！</p>
        <div class="speed-info"><span>得分 <strong id="speed-score">0</strong></span><span>剩余 <strong id="speed-time">10</strong>s</span></div>
        <div class="speed-grid" id="speed-grid"></div>
        <p class="game-status" id="speed-status"><button class="pixel-btn" id="speed-start">开始挑战</button></p>
      </div>`
    });
    const grid = document.getElementById('speed-grid');
    const scoreEl = document.getElementById('speed-score');
    const timeEl = document.getElementById('speed-time');
    const status = document.getElementById('speed-status');
    let score = 0, time = 10, timer = null, target = null;

    function spawn() {
      grid.innerHTML = '';
      const count = 9;
      const heartIndex = Math.floor(Math.random() * count);
      for (let i = 0; i < count; i++) {
        const btn = document.createElement('button');
        btn.className = 'speed-cell';
        btn.textContent = i === heartIndex ? '♥' : '☾';
        btn.dataset.heart = i === heartIndex ? '1' : '0';
        btn.addEventListener('click', () => {
          if (!timer) return;
          if (btn.dataset.heart === '1') {
            score += 10; scoreEl.textContent = score;
            playTone(880, 0.06);
            const rect = btn.getBoundingClientRect();
            window.Quest.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 8, { size: 5, power: 2, color: '#ff5c8a', shape: 'heart' });
          } else {
            score = Math.max(0, score - 5); scoreEl.textContent = score;
            playTone(300, 0.08);
          }
          spawn();
        });
        grid.appendChild(btn);
      }
    }

    function beginGame() {
      score = 0; time = 10; scoreEl.textContent = '0'; timeEl.textContent = '10';
      status.textContent = '点击 ♥ 得分，点到 ☾ 扣分！';
      spawn();
      clearInterval(timer);
      timer = setInterval(() => {
        time--; timeEl.textContent = time;
        if (time <= 0) {
          clearInterval(timer); timer = null;
          grid.innerHTML = '';
          const isBest = score > S.speedBest;
          if (isBest) { S.speedBest = score; save(); }
          status.textContent = `🎉 时间到！得分 ${score}${isBest ? ' · 新纪录！' : ` · 最佳 ${S.speedBest}`}`;
          status.innerHTML += ' <button class="pixel-btn" id="speed-again">再玩一次</button>';
          document.getElementById('speed-again').addEventListener('click', beginGame);
          if (isBest) window.Quest.heartRain(40);
        }
      }, 1000);
    }
    document.getElementById('speed-start').addEventListener('click', beginGame);
  }

  // ---------- 情话签 ----------
  function startFortune() {
    const fortunes = [
      { icon: '♥', title: '上上签', text: '今天崇新会毫无疑问地想你，而且是很多很多次。' },
      { icon: '✦', title: '大吉', text: '你们会在一个普通的日子里，制造出不普通的回忆。' },
      { icon: '☾', title: '吉', text: '今晚的梦里，有个人正在偷偷见你。' },
      { icon: '✿', title: '大吉', text: '适合说一句"我爱你"，尤其是对艺萌说。' },
      { icon: '★', title: '上上签', text: '未来的日子，会比今天更喜欢你一点。' },
      { icon: '✧', title: '吉', text: '今天宜：撒娇、拥抱、在一起。' },
      { icon: '♡', title: '上上签', text: '你今天的好运来自一个叫崇新的人，请查收。' }
    ];
    const f = fortunes[Math.floor(Math.random() * fortunes.length)];
    S.fortuneDraws++; save();
    window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 30, { size: 8, power: 4, up: 2 });
    playTone(784); setTimeout(() => playTone(1047), 150);
    openModal({
      badge: f.icon, eyebrow: 'LOVE FORTUNE', title: `情话签 · ${f.title}`,
      body: `<div class="fortune-card">
          <div class="fortune-stick">${f.icon}</div>
          <p class="quote">${f.text}</p>
        </div>
        <p style="text-align:center;color:var(--muted);font-size:0.75rem">已抽 ${S.fortuneDraws} 支 · 每次都是专属你们的签 ♥</p>`
    });
  }

  window.GameCenter = { openMenu, launch, startGuess, startPuzzle, startSpeed, startFortune };
})();
