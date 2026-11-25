/* ===== 恋爱日历 + 我们的暗号（借鉴情侣纪念站常见的日历/私密语言玩法） ===== */
(() => {
  'use strict';

  const SAVE_KEY = 'love-diary-v1';
  const S = (() => {
    const empty = { notes: {}, codes: [] };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(empty, JSON.parse(raw));
    } catch {}
    return empty;
  })();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const toast = text => {
    const el = document.getElementById('toast-text');
    const box = document.getElementById('zone-toast');
    if (!el || !box) return;
    el.textContent = text;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('show'), 1800);
  };

  function openCalendar(year = new Date().getFullYear(), month = new Date().getMonth()) {
    const realToday = new Date();
    const startMonth = new Date(CONFIG.startDate[0], CONFIG.startDate[1], CONFIG.startDate[2]);
    const isCurrent = year === realToday.getFullYear() && month === realToday.getMonth();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array(firstDay).fill('<span></span>');
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month, day);
      const isTogether = date >= new Date(startMonth.getFullYear(), startMonth.getMonth(), startMonth.getDate());
      const isToday = isCurrent && day === realToday.getDate();
      const hasNote = Boolean(S.notes[key]);
      cells.push(`<button class="cal-day ${isToday ? 'today' : ''} ${hasNote ? 'noted' : ''} ${isTogether ? 'together' : ''}" data-date="${key}">
        <span>${day}</span>${hasNote ? '<i>♥</i>' : ''}${isToday ? '<i class="cal-now">今</i>' : ''}
      </button>`);
    }
    openModal({
      badge: '🗓️', eyebrow: 'OUR CALENDAR', title: '我们的恋爱日历',
      body: `<div class="cal-wrap">
        <div class="cal-head">
          <button class="pixel-btn" id="cal-prev">◀</button>
          <strong>${year} 年 ${month + 1} 月</strong>
          <button class="pixel-btn" id="cal-next" ${isCurrent ? 'disabled' : ''}>▶</button>
        </div>
        <div class="cal-week"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <div class="cal-grid">${cells.join('')}</div>
        <p class="cal-tip">♥ 标记的日子有我们写下的小记 · 点日期查看 / 写下那天 ♥</p>
      </div>`
    });
    document.getElementById('cal-prev').addEventListener('click', () => {
      const previous = month === 0 ? new Date(year - 1, 11, 1) : new Date(year, month - 1, 1);
      openCalendar(previous.getFullYear(), previous.getMonth());
    });
    const next = document.getElementById('cal-next');
    if (!next.disabled) next.addEventListener('click', () => {
      const following = month === 11 ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);
      openCalendar(following.getFullYear(), following.getMonth());
    });
    document.querySelectorAll('.cal-day').forEach(day => day.addEventListener('click', () => openDayNote(day.dataset.date)));
  }

  function openDayNote(key) {
    openModal({
      badge: '✎', eyebrow: 'DAILY NOTE', title: key,
      body: `<div class="cal-note-ui">
        <textarea id="cal-note-text" maxlength="300" placeholder="那一天发生了什么值得记住的小事？">${escapeHtml(S.notes[key] || '')}</textarea>
        <div class="cal-note-actions">
          <button class="pixel-btn" id="cal-note-save">写下这一刻 ♥</button>
          ${S.notes[key] ? '<button class="pixel-btn ghost-btn" id="cal-note-del">删除</button>' : ''}
        </div>
      </div>`
    });
    document.getElementById('cal-note-save').addEventListener('click', () => {
      const text = document.getElementById('cal-note-text').value.trim();
      if (!text) { toast('先写点什么再保存吧 ♥'); return; }
      S.notes[key] = text; save();
      window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 24, { size: 7, power: 3, shape: 'heart' });
      playTone(880);
      toast('这一刻，已经悄悄存进我们的日历 ♥');
      openCalendar();
    });
    const del = document.getElementById('cal-note-del');
    if (del) del.addEventListener('click', () => { delete S.notes[key]; save(); playTone(400); openCalendar(); });
  }

  function openCodes() {
    renderCodes();
  }

  function renderCodes() {
    const samples = [
      { code: '501', meaning: '我愿意', from: '示例 · 点下面的按钮添加你们的暗号' },
      { code: '520', meaning: '我爱你', from: '示例 · 人人懂，但只对你说' }
    ];
    const all = [...samples, ...S.codes];
    openModal({
      badge: '🔐', eyebrow: 'OUR SECRET LANGUAGE', title: '只有我们懂的暗号',
      body: `<div class="code-ui">
        <p class="quote">别人看不懂的小暗号，是我们之间最甜的秘密 ♥</p>
        <div class="code-list">${all.map((item, i) => `<div class="code-item"><span class="code-key">${escapeHtml(item.code)}</span><div><strong>${escapeHtml(item.meaning)}</strong><small>${escapeHtml(item.from || '我们的小秘密')}</small></div>${i >= samples.length ? `<button class="capsule-del" data-code="${i - samples.length}" title="删除">✕</button>` : ''}</div>`).join('')}</div>
        <div class="code-add">
          <input id="code-key" maxlength="12" placeholder="暗号，比如 1314">
          <input id="code-meaning" maxlength="60" placeholder="它的意思">
          <button class="pixel-btn" id="code-add">收进暗号本 ♥</button>
        </div>
      </div>`
    });
    document.getElementById('code-add').addEventListener('click', () => {
      const code = document.getElementById('code-key').value.trim();
      const meaning = document.getElementById('code-meaning').value.trim();
      if (!code || !meaning) { toast('暗号和意思都要写哦 ♥'); return; }
      S.codes.push({ code, meaning, from: `崇新 & 艺萌 · 第 ${S.codes.length + 1} 条` });
      save();
      window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 24, { size: 7, power: 3 });
      playTone(880);
      renderCodes();
    });
    document.querySelectorAll('[data-code]').forEach(btn => btn.addEventListener('click', () => {
      S.codes.splice(Number(btn.dataset.code), 1); save(); renderCodes();
    }));
  }

  function openMenu() {
    openModal({
      badge: '📖', eyebrow: 'LOVE DIARY', title: '我们的恋爱日记',
      body: `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:14px">记录每一天，也记住那些只有我们懂的话 ♥</p>
        <div class="game-center-grid">
          <button class="gc-card" data-diary="calendar"><span class="gc-icon">🗓️</span><span class="gc-name">恋爱日历</span><span class="gc-desc">给特别的日子写小记</span><span class="gc-best">${Object.keys(S.notes).length} 篇小记</span></button>
          <button class="gc-card" data-diary="codes"><span class="gc-icon">🔐</span><span class="gc-name">我们的暗号</span><span class="gc-desc">只有彼此懂的甜蜜密码</span><span class="gc-best">${S.codes.length} 条暗号</span></button>
        </div>`
    });
    document.querySelectorAll('[data-diary]').forEach(card => card.addEventListener('click', () => {
      const id = card.dataset.diary;
      closeModal();
      setTimeout(() => id === 'calendar' ? openCalendar() : openCodes(), 120);
    }));
  }

  window.LoveDiary = { openMenu, openCalendar, openCodes };

  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(() => {
    if (document.getElementById('hud-diary')) return;
    const btn = document.createElement('button');
    btn.id = 'hud-diary';
    btn.className = 'hud-btn diary-btn';
    btn.title = '我们的恋爱日记';
    btn.innerHTML = '📖 <span>日记</span>';
    btn.addEventListener('click', openMenu);
    const level = document.getElementById('hud-level');
    if (level) level.before(btn);
  }, 120));
})();
