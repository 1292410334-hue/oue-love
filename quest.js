/* ===== 恋爱冒险系统 · 主线任务 / 惊喜 / 粒子 / 小游戏 ===== */
(() => {
  'use strict';

  const SAVE_KEY = 'love-quest-v1';
  const S = (() => {
    const empty = { hearts: {}, checkins: [], giftCount: 0, rhythmBest: 0, letterOpened: false };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(empty, JSON.parse(raw));
    } catch {}
    return empty;
  })();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };

  // ---------- 任务链 ----------
  const QUESTS = [
    {
      id: 'q1', name: '初见之心', target: 'neon',
      note: '去客厅，看看墙上的 LOVE 灯牌',
      title: '第一颗心 · 初见',
      story: `<p class="quote">那一天，故事从一个"你好"开始。</p>
        <p>2025 年 7 月 8 日，我们从"我"和"你"，变成了"我们"。那时候谁也没想到，这个小小的起点，会长成现在这个家。</p>
        <p style="color:var(--pink-soft)">第一颗心已点亮 · 初见，是我最好的运气 ♥</p>`
    },
    {
      id: 'q2', name: '陪伴之心', target: 'cat',
      note: '去客厅，摸摸睡着的小猫',
      title: '第二颗心 · 陪伴',
      story: `<p class="quote">喜欢你的人很多，但家里有一只猫、一个你，就够了。</p>
        <p>它总在我们身边打盹，你在旁边笑着看它。那一刻我突然觉得，所谓的岁月静好，大概就是这样的画面。</p>
        <p style="color:var(--pink-soft)">第二颗心已点亮 · 有你在的地方，我就想停下来 ♥</p>`
    },
    {
      id: 'q3', name: '烟火之心', target: 'fridge',
      note: '去厨房，看看冰箱上的便签',
      title: '第三颗心 · 烟火',
      story: `<p class="quote">想和你一起，把柴米油盐过成诗。</p>
        <p>冰箱上的便签写了又换，换了新的又舍不得扔旧的。每一张歪歪扭扭的字，都是我们认真生活的证据。</p>
        <p style="color:var(--pink-soft)">第三颗心已点亮 · 想和你吃很多很多顿饭 ♥</p>`
    },
    {
      id: 'q4', name: '晚安之心', target: 'bedwindow',
      note: '去卧室，看看窗外的星空',
      title: '第四颗心 · 晚安',
      story: `<p class="quote">晚安不是结束，是为了明天醒来还能继续和你说早安。</p>
        <p>睡前那段聊天时光，是我一天里最放松的时候。再普通的一天，只要临睡前和你说上几句话，就变得值得。</p>
        <p style="color:var(--pink-soft)">第四颗心已点亮 · 愿你每晚好梦，梦里有我 ♥</p>`
    },
    {
      id: 'q5', name: '默契之心', target: 'arcade-win',
      note: '回客厅，去街机上玩一局记忆翻牌',
      title: '第五颗心 · 默契',
      story: `<p class="quote">最好的默契，是你懂我的奇奇怪怪，我陪你一起可可爱爱。</p>
        <p>从第一次约会到现在，我们一起经历了太多"第一次"。每一次都因为有你在旁边，变成了值得纪念的事。</p>
        <p style="color:var(--pink-soft)">第五颗心已点亮 · 五颗心都集齐了，去拆开终极惊喜吧 ♥</p>`
    }
  ];

  const activeQuest = () => QUESTS.find(q => !S.hearts[q.id]) || null;
  const heartCount = () => QUESTS.filter(q => S.hearts[q.id]).length;

  // ---------- 经验与等级 ----------
  function getExp() {
    let foundCount = 0;
    try { foundCount = JSON.parse(localStorage.getItem('pixel-house-found-v2') || '[]').length; } catch {}
    return foundCount * 10 + heartCount() * 50 + S.checkins.length * 20 + S.giftCount * 5 + S.rhythmBest;
  }
  function getLevel() {
    const exp = getExp();
    const level = Math.floor(exp / 120) + 1;
    const titles = ['心动新手', '甜蜜恋人', '默契搭档', '灵魂伴侣', '一生挚爱'];
    return { level, exp, title: titles[Math.min(titles.length - 1, Math.floor((level - 1) / 2))] };
  }

  // ---------- 粒子特效 ----------
  const particleCanvas = document.createElement('canvas');
  particleCanvas.id = 'particle-canvas';
  document.body.appendChild(particleCanvas);
  const pctx = particleCanvas.getContext('2d');
  let particles = [];
  const SHAPES = ['heart', 'star', 'spark'];
  const COLORS = ['#ff5c8a', '#ff8fab', '#ffd166', '#a78bfa', '#5eead4', '#ffffff'];

  function resizeParticles() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
  resizeParticles();
  window.addEventListener('resize', resizeParticles);

  function shapePath(ctx, shape, size) {
    ctx.beginPath();
    if (shape === 'heart') {
      ctx.moveTo(0, size * 0.35);
      ctx.bezierCurveTo(0, size * 0.1, -size * 0.5, -size * 0.15, -size * 0.5, size * 0.12);
      ctx.bezierCurveTo(-size * 0.5, size * 0.42, 0, size * 0.6, 0, size * 0.85);
      ctx.bezierCurveTo(0, size * 0.6, size * 0.5, size * 0.42, size * 0.5, size * 0.12);
      ctx.bezierCurveTo(size * 0.5, -size * 0.15, 0, size * 0.1, 0, size * 0.35);
    } else if (shape === 'star') {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? size * 0.25 : size * 0.55;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(0, -size); ctx.lineTo(size * 0.25, 0);
      ctx.lineTo(0, size); ctx.lineTo(-size * 0.25, 0); ctx.closePath();
    }
  }

  function burst(x, y, count = 14, options = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (options.power || 2.5) * (0.5 + Math.random());
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (options.up || 1.5),
        life: 1,
        decay: 0.008 + Math.random() * 0.01,
        size: (options.size || 6) * (0.6 + Math.random() * 0.8),
        color: options.color || COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: options.shape || SHAPES[Math.floor(Math.random() * SHAPES.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      });
    }
    if (particles.length > 700) particles = particles.slice(-700);
  }

  function heartRain(count = 60) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: -20 - Math.random() * particleCanvas.height * 0.6,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1 + Math.random() * 2.5,
        life: 1, decay: 0.0018 + Math.random() * 0.0015,
        size: 6 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() < 0.7 ? 'heart' : 'star',
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.12
      });
    }
  }

  function animateParticles() {
    pctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(p => p.life > 0 && p.y < particleCanvas.height + 40);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      p.vy += p.shape === 'heart' ? 0.045 : 0.02;
      p.vx *= 0.995;
      p.life -= p.decay;
      p.rotation += p.spin;
      pctx.save();
      pctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      pctx.translate(p.x, p.y);
      pctx.rotate(p.rotation);
      pctx.fillStyle = p.color;
      shapePath(pctx, p.shape, p.size);
      pctx.fill();
      pctx.restore();
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // 全局按钮点击小粒子
  document.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('button');
    if (!button || button.classList.contains('no-particle')) return;
    const rect = button.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 6, { size: 4, power: 1.8, up: 0.5 });
  });

  // ---------- HUD ----------
  let hud = null;
  function buildHUD() {
    if (hud) return;
    hud = document.createElement('div');
    hud.className = 'quest-hud';
    hud.innerHTML = `
      <div class="hud-hearts" id="hud-hearts"></div>
      <div class="hud-quest" id="hud-quest"></div>
      <div class="hud-actions">
        <button class="hud-btn gift-btn" id="hud-gift" title="惊喜盲盒">🎁 <span>盲盒</span></button>
        <button class="hud-btn love-btn" id="hud-love" title="发射爱心">💗 <span>爱心</span></button>
        <button class="hud-btn checkin-btn" id="hud-checkin" title="每日签到">📅 <span>签到</span></button>
        <button class="hud-btn game-btn" id="hud-game" title="心跳同步小游戏">🎮 <span>心跳</span></button>
      </div>
      <button class="hud-level" id="hud-level" title="我们的恋爱等级"></button>`;
    const shell = document.getElementById('game-shell');
    shell.insertBefore(hud, shell.querySelector('.game-meta'));

    document.getElementById('hud-gift').addEventListener('click', openGiftBox);
    document.getElementById('hud-love').addEventListener('click', () => {
      const rect = document.getElementById('hud-love').getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24, { size: 8, power: 4, up: 2.5, color: '#ff5c8a', shape: 'heart' });
      heartRain(20);
      playTone(880, 0.1); setTimeout(() => playTone(1047, 0.12), 100);
      showToast('💗 爱心已送达，记得查收哦');
    });
    document.getElementById('hud-checkin').addEventListener('click', dailyCheckin);
    document.getElementById('hud-game').addEventListener('click', startRhythmGame);
    document.getElementById('hud-level').addEventListener('click', () => {
      const lv = getLevel();
      openModal({
        badge: '★', eyebrow: 'LOVE LEVEL', title: '我们的恋爱等级',
        body: `<p class="quote">Lv.${lv.level} · ${lv.title}</p>
          <p>经验值 ${lv.exp} · 来自发现彩蛋、完成任务、每日签到和一起玩游戏 ♥</p>
          <div class="progress-bar"><div class="progress-fill" style="width:${(lv.exp % 120) / 120 * 100}%"></div></div>
          <p style="color:var(--muted);font-size:0.75rem">再获得 ${120 - lv.exp % 120} 点经验，就能升级啦</p>`
      });
    });
    paintHUD();
  }

  function paintHUD() {
    if (!hud) return;
    const heartsEl = document.getElementById('hud-hearts');
    heartsEl.innerHTML = QUESTS.map(q => `<span class="hud-heart ${S.hearts[q.id] ? 'on' : ''}" title="${q.name}">${S.hearts[q.id] ? '♥' : '♡'}</span>`).join('');
    const questEl = document.getElementById('hud-quest');
    const active = activeQuest();
    questEl.innerHTML = active
      ? `<span class="quest-label">主线任务</span><strong>${active.name}</strong><span class="quest-note">${active.note}</span>`
      : `<span class="quest-label">主线完成</span><strong>五颗心已集齐 ♥</strong><span class="quest-note">去拆开终极惊喜吧</span>`;
    const lv = getLevel();
    document.getElementById('hud-level').textContent = `Lv.${lv.level} ${lv.title}`;
    if (!active && !S.letterOpened) {
      if (!document.getElementById('hud-letter')) {
        const btn = document.createElement('button');
        btn.id = 'hud-letter';
        btn.className = 'hud-btn letter-btn';
        btn.textContent = '💌 终极惊喜';
        document.getElementById('hud-gift').before(btn);
        btn.addEventListener('click', openFinalLetter);
      }
    } else {
      const btn = document.getElementById('hud-letter');
      if (btn) btn.remove();
    }
  }

  function showToast(text) {
    if (typeof showQuestToast === 'function') return showQuestToast(text);
    const toast = document.getElementById('zone-toast');
    if (!toast) return;
    document.getElementById('toast-text').textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  // ---------- 任务推进 ----------
  function notify(id) {
    const quest = activeQuest();
    if (!quest) return;
    const matched = quest.target === id || (id === 'arcade-win' && quest.target === 'arcade-win');
    if (!matched) return;
    S.hearts[quest.id] = true;
    save();
    paintHUD();
    const centerX = window.innerWidth / 2, centerY = window.innerHeight / 2;
    burst(centerX, centerY, 60, { size: 9, power: 6, up: 3 });
    setTimeout(() => heartRain(30), 200);
    openModal({
      badge: '♥', eyebrow: 'HEART UNLOCKED', title: quest.title,
      body: quest.story + `<p style="color:var(--gold);font-size:0.8rem;margin-top:14px">已点亮 ${heartCount()} / 5 颗心</p>`
    });
    playTone(523); setTimeout(() => playTone(659), 120); setTimeout(() => playTone(784), 240); setTimeout(() => playTone(1047), 360);
  }

  // ---------- 惊喜盲盒 ----------
  const SURPRISES = [
    { icon: '💌', title: '一句悄悄话', text: () => `“${randomLine(CONFIG.loveLines || [])}”` },
    { icon: '🌧️', title: '爱心暴雨', text: () => '接住这场为你下的爱心雨吧 ♥', action: () => heartRain(100) },
    { icon: '✨', title: '今日夸夸', text: () => `“${randomLine(CONFIG.loveLines || [])}”` },
    { icon: '🎵', title: '音乐盒推荐', text: () => '送你一首歌，点开音乐盒，选一首送给此刻的我们 ♪', action: () => { const close = document.querySelector('[data-close]'); if (close) close.click(); if (typeof interact === 'function') interact('radio'); } },
    { icon: '🗺️', title: '未来预告', text: () => `“${randomLine(CONFIG.fridgeNotes || [])}”` },
    { icon: '🍓', title: '一份小馋猫', text: () => '我请你吃草莓蛋糕，奶油要多的那种——先记在账上 ♥' },
    { icon: '🌙', title: '晚安预告', text: () => `“${randomLine(CONFIG.windowNotes || [])}”` },
    { icon: '🐱', title: '猫猫代传话', text: () => `“${randomLine(CONFIG.catLines || [])}”` }
  ];

  function openGiftBox() {
    const surprise = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
    S.giftCount++;
    save();
    paintHUD();
    const rect = document.getElementById('hud-gift').getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, { size: 8, power: 4, up: 2, color: '#ffd166' });
    if (surprise.action) setTimeout(surprise.action, 300);
    openModal({
      badge: surprise.icon, eyebrow: 'SURPRISE BOX', title: `惊喜盲盒 · ${surprise.title}`,
      body: `<div class="gift-reveal"><p class="quote">${escapeHtml(surprise.text())}</p></div>
        <p style="color:var(--muted);font-size:0.75rem;text-align:center">已拆开 ${S.giftCount} 次 · 每次都有新的惊喜等着你 ♥</p>`
    });
    playTone(784); setTimeout(() => playTone(1047), 140);
  }

  // ---------- 每日签到 ----------
  function dailyCheckin() {
    const today = new Date().toISOString().slice(0, 10);
    if (S.checkins.includes(today)) {
      openModal({
        badge: '📅', eyebrow: 'DAILY CHECK-IN', title: '今天已经签过到啦',
        body: `<p class="quote">“今天也想你”这句话，我每天都想说 ♥</p>
          <p>已连续签到 ${countStreak()} 天 · 明天再来找我吧</p>`
      });
      return;
    }
    S.checkins.push(today);
    save();
    paintHUD();
    const rect = document.getElementById('hud-checkin').getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 40, { size: 9, power: 5, up: 3, color: '#5eead4' });
    openModal({
      badge: '📅', eyebrow: 'DAILY CHECK-IN', title: '今天也想你 ♥',
      body: `<p class="quote">“${escapeHtml(randomLine(CONFIG.loveLines || []))}”</p>
        <div class="stat-line"><span>连续签到</span><strong>${countStreak()} 天</strong></div>
        <div class="stat-line"><span>在一起</span><strong>${daysTogether} 天</strong></div>
        <p style="color:var(--muted);font-size:0.75rem">每天来点一次，把喜欢变成习惯 ♥</p>`
    });
  }

  function countStreak() {
    if (!S.checkins.length) return 0;
    const dates = [...new Set(S.checkins)].sort().reverse();
    let streak = 0;
    const day = new Date();
    for (const date of dates) {
      const expected = day.toISOString().slice(0, 10);
      if (date === expected) { streak++; day.setDate(day.getDate() - 1); }
      else break;
    }
    return streak;
  }

  // ---------- 心跳同步 · 节奏小游戏 ----------
  function startRhythmGame() {
    openModal({
      badge: '♥', eyebrow: 'MINI GAME', title: '心跳同步',
      body: `<div class="rhythm-ui">
        <p class="game-ui-title">跟着心跳的节奏点击，看看我们的默契有多高</p>
        <div class="rhythm-stage">
          <div class="rhythm-heart" id="rhythm-heart">♥</div>
          <div class="rhythm-ring" id="rhythm-ring"></div>
        </div>
        <p class="game-status" id="rhythm-status">准备好了吗？</p>
        <button class="pixel-btn" id="rhythm-start">开始游戏</button>
      </div>`
    });

    let running = false, score = 0, hits = 0, misses = 0, timer = null;
    const heart = document.getElementById('rhythm-heart');
    const ring = document.getElementById('rhythm-ring');
    const status = document.getElementById('rhythm-status');
    const startBtn = document.getElementById('rhythm-start');

    function stop() {
      running = false;
      clearInterval(timer);
      heart.classList.remove('beat');
    }

    function hit() {
      if (!running) return;
      const active = heart.classList.contains('beat');
      const rect = heart.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      if (active) {
        hits++; score += 100;
        heart.classList.remove('beat');
        burst(x, y, 18, { size: 7, power: 3.5, up: 1.5, color: '#ff5c8a', shape: 'heart' });
        playTone(880, 0.1);
      } else {
        misses++;
        playTone(300, 0.08);
      }
      status.textContent = `心跳 ${hits} 次 · 失误 ${misses} 次 · 得分 ${score}`;
    }

    startBtn.addEventListener('click', () => {
      if (running) return;
      score = 0; hits = 0; misses = 0;
      running = true;
      startBtn.textContent = '跟上节奏 ♥';
      status.textContent = '看到爱心放大时，点击它！';
      const rect = heart.getBoundingClientRect();
      let n = 0;
      timer = setInterval(() => {
        if (n > 8) {
          stop();
          const accuracy = Math.round(hits / 8 * 100);
          if (score > S.rhythmBest) { S.rhythmBest = score; save(); paintHUD(); }
          const grade = accuracy >= 90 ? '满分默契 ♥♥♥' : accuracy >= 60 ? '很有默契 ♥♥' : accuracy >= 30 ? '还在磨合 ♥' : '再多练练，我等你 ♡';
          status.textContent = `结束！${grade} · 得分 ${score}（最佳 ${S.rhythmBest}）`;
          startBtn.textContent = '再玩一次 ♥';
          if (accuracy >= 90) { heartRain(60); playTone(1047, 0.2); }
          return;
        }
        n++;
        const delay = 600 + Math.random() * 300;
        setTimeout(() => {
          if (!running) return;
          heart.classList.add('beat');
          setTimeout(() => {
            if (running && heart.classList.contains('beat')) {
              heart.classList.remove('beat');
              misses++;
              status.textContent = `心跳 ${hits} 次 · 失误 ${misses} 次 · 得分 ${score}`;
            }
          }, 700);
        }, delay);
      }, 1200);
    });

    heart.addEventListener('click', hit);
  }

  // ---------- 终极告白 ----------
  function openFinalLetter() {
    S.letterOpened = true;
    save();
    heartRain(160);
    setTimeout(() => heartRain(100), 800);
    openModal({
      badge: '💌', eyebrow: 'FINAL SURPRISE', title: '写给艺萌的一封信',
      body: `<div class="letter-envelope">
          <div class="letter-flap">♥</div>
          <div class="letter-paper">
            <p class="quote">${escapeHtml(CONFIG.nameB)}：</p>
            <p>${escapeHtml((CONFIG.letter || '').replace(/^艺萌[：:]\s*\n+/, '')).replace(/\n/g, '<br>')}</p>
            <p class="letter-sign">—— 永远爱你的 ${escapeHtml(CONFIG.nameA)} ♥</p>
          </div>
        </div>
        <p style="text-align:center;color:var(--gold);font-size:0.8rem;margin-top:16px">五颗心都集齐了，接下来的日子，我们继续一起写 ♥</p>`
    });
    for (let i = 0; i < 6; i++) setTimeout(() => playTone([523, 659, 784, 1047][i % 4], 0.2), i * 160);
  }

  // 保留一个可调用的外部接口
  window.Quest = { notify, paintHUD, burst, heartRain };

  // 等待游戏启动后挂载 HUD
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(buildHUD, 50));
})();
