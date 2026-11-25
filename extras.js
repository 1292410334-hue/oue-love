/* ===== 情感拓展模块 · 时间胶囊 / 喜欢你清单 / 里程碑 / 告白逃脱 ===== */
(() => {
  'use strict';

  const SAVE_KEY = 'love-extras-v1';
  const S = (() => {
    const empty = { capsules: [], reasons: [], proposalWon: false };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(empty, JSON.parse(raw));
    } catch {}
    return empty;
  })();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };

  const DEFAULT_REASONS = [
    '因为你笑起来的样子特别好看',
    '因为你总能懂我没说出口的话',
    '因为和你在一起不用装作坚强',
    '因为你记得我喜欢的一切小细节',
    '因为你陪我度过那些普通又珍贵的日子',
    '因为你说晚安的时候声音很温柔',
    '因为世界上只有一个你，而居然被我遇到了'
  ];

  function openMenu() {
    openModal({
      badge: '💖', eyebrow: 'LOVE EXTRAS', title: '我们的心意角',
      body: `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:14px">一些藏在小屋里的小小仪式感 ♥</p>
        <div class="game-center-grid">
          <button class="gc-card" data-extra="capsule"><span class="gc-icon">⏳</span><span class="gc-name">时间胶囊</span><span class="gc-desc">写给未来的彼此</span><span class="gc-best">${S.capsules.length} 个胶囊</span></button>
          <button class="gc-card" data-extra="reasons"><span class="gc-icon">📝</span><span class="gc-name">喜欢你的理由</span><span class="gc-desc">数一数有多少条</span><span class="gc-best">${DEFAULT_REASONS.length + S.reasons.length} 条理由</span></button>
          <button class="gc-card" data-extra="milestone"><span class="gc-icon">🏁</span><span class="gc-name">里程碑倒计时</span><span class="gc-desc">下一个纪念里程碑</span><span class="gc-best">${nextMilestone().label}</span></button>
          <button class="gc-card" data-extra="proposal"><span class="gc-icon">💍</span><span class="gc-name">一个郑重的提问</span><span class="gc-desc">敢不敢点开看看</span><span class="gc-best">${S.proposalWon ? '已答应 ♥' : '未挑战'}</span></button>
          <button class="gc-card" data-extra="share"><span class="gc-icon">🔗</span><span class="gc-name">分享小屋</span><span class="gc-desc">复制链接发给对方</span><span class="gc-best">一键复制</span></button>
        </div>`
    });
    document.querySelectorAll('[data-extra]').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.extra;
        closeModal();
        setTimeout(() => launch(id), 120);
      });
    });
  }

  function launch(id) {
    if (id === 'capsule') return openCapsules();
    if (id === 'reasons') return openReasons();
    if (id === 'milestone') return openMilestone();
    if (id === 'proposal') return openProposal();
    if (id === 'share') return shareSite();
  }

  // ---------- 时间胶囊 ----------
  function openCapsules() {
    openModal({
      badge: '⏳', eyebrow: 'TIME CAPSULE', title: '写给未来的我们',
      body: `<div class="capsule-ui">
        <p style="color:var(--muted);font-size:0.75rem">写下一句话，设定一个未来的日子。那天到来之前，谁也打不开 ♥</p>
        <textarea id="capsule-text" maxlength="300" placeholder="写给未来的我们……"></textarea>
        <div class="capsule-date-row">
          <label>解锁日期 <input type="date" id="capsule-date"></label>
          <button class="pixel-btn" id="capsule-add">封存 ✦</button>
        </div>
        <div class="capsule-list" id="capsule-list"></div>
      </div>`
    });
    const list = document.getElementById('capsule-list');
    const dateInput = document.getElementById('capsule-date');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    dateInput.min = tomorrow;
    dateInput.value = tomorrow;

    function render() {
      if (!S.capsules.length) { list.innerHTML = '<p style="color:var(--muted);font-size:0.75rem;text-align:center">还没有胶囊，写下第一封吧。</p>'; return; }
      list.innerHTML = S.capsules.map((c, i) => {
        const locked = new Date(c.date + 'T00:00:00').getTime() > Date.now();
        return `<div class="capsule-item ${locked ? 'locked' : 'ready'}">
          <span class="capsule-icon">${locked ? '🔒' : '✨'}</span>
          <div><strong>${locked ? c.date + ' 解锁' : '可以拆开啦'}</strong>
          <p>${locked ? '这封信还在时间里睡着……' : escapeHtml(c.text)}</p></div>
          <button class="capsule-del" data-index="${i}" title="删除">✕</button>
        </div>`;
      }).join('');
    }
    render();

    document.getElementById('capsule-add').addEventListener('click', () => {
      const text = document.getElementById('capsule-text').value.trim();
      const date = dateInput.value;
      if (!text || !date) { playTone(300, 0.08); return; }
      S.capsules.push({ text, date, created: new Date().toISOString() });
      save(); render();
      document.getElementById('capsule-text').value = '';
      window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 24, { size: 7, power: 3, up: 2 });
      playTone(880);
    });
    list.addEventListener('click', (event) => {
      const btn = event.target.closest('.capsule-del');
      if (btn) { S.capsules.splice(Number(btn.dataset.index), 1); save(); render(); return; }
      const item = event.target.closest('.capsule-item.ready');
      if (item) { window.Quest.heartRain(50); playTone(1047, 0.2); }
    });
  }

  // ---------- 喜欢你的理由 ----------
  function openReasons() {
    const all = [...DEFAULT_REASONS, ...S.reasons];
    openModal({
      badge: '📝', eyebrow: 'WHY I LOVE YOU', title: `喜欢你的 ${all.length} 个理由`,
      body: `<div class="reasons-ui">
        <p class="quote">${escapeHtml(all[Math.floor(Math.random() * all.length)])}</p>
        <div class="reasons-list">${all.map((r, i) => `<div class="reason-item"><span>${String(i + 1).padStart(2, '0')}</span><p>${escapeHtml(r)}</p></div>`).join('')}</div>
        <div class="reasons-add">
          <input id="reason-input" maxlength="100" placeholder="再添一条理由……">
          <button class="pixel-btn" id="reason-add">添加 ♥</button>
        </div>
      </div>`
    });
    document.getElementById('reason-add').addEventListener('click', () => {
      const input = document.getElementById('reason-input');
      const text = input.value.trim();
      if (!text) return;
      S.reasons.push(text); save(); playTone(880);
      openReasons();
    });
  }

  // ---------- 里程碑倒计时 ----------
  function nextMilestone() {
    const days = daysTogether;
    const list = [
      { days: 100, label: '百日纪念' }, { days: 200, label: '两百天' },
      { days: 365, label: '一周年' }, { days: 520, label: '我爱你' },
      { days: 730, label: '两周年' }, { days: 1000, label: '千日之约' },
      { days: 1095, label: '三周年' }, { days: 1460, label: '四周年' },
      { days: 1825, label: '五周年' }
    ];
    const next = list.find(m => m.days > days) || { days: 3650, label: '十周年' };
    return { ...next, left: next.days - days };
  }

  function openMilestone() {
    const m = nextMilestone();
    openModal({
      badge: '🏁', eyebrow: 'MILESTONE', title: '下一个里程碑',
      body: `<div class="milestone-ui">
        <p class="quote">距离「${m.label}」还有</p>
        <div class="milestone-days">${m.left}<small>天</small></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, daysTogether / m.days * 100)}%"></div></div>
        <p style="color:var(--muted);font-size:0.75rem">已经走了 ${daysTogether} / ${m.days} 天 · 每一步都算数 ♥</p>
      </div>`
    });
  }

  // ---------- 告白逃脱 ----------
  function openProposal() {
    if (S.proposalWon) {
      openModal({ badge: '♥', eyebrow: 'THE ANSWER', title: '你已经答应过啦',
        body: '<p class="quote">“我愿意”这三个字，我想听一辈子 ♥</p>' });
      return;
    }
    let noCount = 0;
    const noTexts = ['再想想嘛', '不要', '真的不要？', '朋 友？', '我会伤心的', '求你了🥺', '最后一个机会'];
    openModal({
      badge: '💍', eyebrow: 'A SERIOUS QUESTION', title: '有一个问题想问你',
      body: `<div class="proposal-ui">
        <p class="quote">${escapeHtml(CONFIG.nameB)}，你愿意一直和我在一起吗？</p>
        <div class="proposal-buttons">
          <button class="pixel-btn proposal-yes" id="proposal-yes">愿意 ♥</button>
          <button class="pixel-btn proposal-no" id="proposal-no">${noTexts[0]}</button>
        </div>
        <p class="proposal-hint" id="proposal-hint"></p>
      </div>`
    });
    const noBtn = document.getElementById('proposal-no');
    const yesBtn = document.getElementById('proposal-yes');
    const hint = document.getElementById('proposal-hint');

    function dodge() {
      noCount++;
      noBtn.textContent = noTexts[Math.min(noCount, noTexts.length - 1)];
      const maxX = window.innerWidth - 100, maxY = window.innerHeight - 60;
      noBtn.style.position = 'fixed';
      noBtn.style.left = (40 + Math.random() * Math.max(50, maxX - 80)) + 'px';
      noBtn.style.top = (80 + Math.random() * Math.max(50, maxY - 120)) + 'px';
      noBtn.style.zIndex = 500;
      hint.textContent = noCount >= 5 ? '它好像跑不动了……' : '咦？按钮怎么跑了？';
      playTone(400, 0.05);
    }
    noBtn.addEventListener('mouseenter', dodge);
    noBtn.addEventListener('click', dodge);
    noBtn.addEventListener('touchstart', dodge, { passive: true });
    yesBtn.addEventListener('click', () => {
      S.proposalWon = true; save();
      window.Quest.heartRain(200);
      setTimeout(() => window.Quest.heartRain(120), 600);
      playTone(523); setTimeout(() => playTone(659), 120); setTimeout(() => playTone(784), 240); setTimeout(() => playTone(1047), 380);
      openModal({ badge: '♥', eyebrow: 'SHE SAID YES', title: '就知道你会答应 ♥',
        body: `<p class="quote">${escapeHtml(CONFIG.secretYes || '这辈子就赖上你了 ♥')}</p>
          <p style="text-align:center;color:var(--gold)">从 2025.07.08 开始，我们一起走了 ${daysTogether} 天，还要走很久很久 ♥</p>` });
    });
  }

  // ---------- 分享 ----------
  async function shareSite() {
    const url = location.href.split('?')[0];
    try {
      await navigator.clipboard.writeText(url);
      openModal({ badge: '🔗', eyebrow: 'SHARE', title: '链接已复制',
        body: `<p>把这个网址发给艺萌，让她也来看看我们的小屋 ♥</p><p class="quote">${escapeHtml(url)}</p>` });
    } catch {
      openModal({ badge: '🔗', eyebrow: 'SHARE', title: '复制链接',
        body: `<p>手动复制下面的网址发给对方 ♥</p><p class="quote">${escapeHtml(url)}</p>` });
    }
    playTone(880);
  }

  window.LoveExtras = { openMenu };

  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(() => {
    if (!document.getElementById('hud-extra')) {
      const btn = document.createElement('button');
      btn.id = 'hud-extra';
      btn.className = 'hud-btn extra-btn';
      btn.title = '我们的心意角';
      btn.innerHTML = '💖 <span>心意</span>';
      btn.addEventListener('click', openMenu);
      const level = document.getElementById('hud-level');
      if (level) level.before(btn);
    }
  }, 100));
})();
