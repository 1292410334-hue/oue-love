/* ===== 照片星河 · 心形 / 网格 / 螺旋 三种形态 ===== */
(() => {
  'use strict';

  const photos = (CONFIG.photos || []).filter(p => p.src);
  if (!photos.length) return;

  const MODES = ['heart', 'grid', 'spiral'];
  const MODE_LABELS = { heart: '♥ 心形星河', grid: '▦ 岁月长卷', spiral: '✧ 时光漩涡' };
  let modeIndex = 0;
  let galleryActive = false;
  let rafId = null;
  let frame = 0;
  let images = [];
  let tiles = [];
  let canvas, ctx, W = 900, H = 520;
  let dpr = 1;

  function preload() {
    images = photos.map(p => {
      const img = new Image();
      img.src = p.src;
      return img;
    });
    // 每张照片复制几份，形成"照片星河"的密集感
    tiles = [];
    for (let i = 0; i < 54; i++) {
      const source = i % photos.length;
      tiles.push({
        source,
        x: 450, y: 260, tx: 450, ty: 260,
        rot: (Math.random() - 0.5) * 0.5,
        scale: 0.75 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.8,
        alpha: 0.7 + Math.random() * 0.3
      });
    }
  }

  // 心形曲线参数方程：x = 16 sin³t, y = -(13cos t - 5cos2t - 2cos3t - cos4t)
  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    return [x, y];
  }

  function targetsFor(mode) {
    const n = tiles.length;
    const out = [];
    if (mode === 'heart') {
      // 多层心形：外轮廓 + 内部散布
      for (let i = 0; i < n; i++) {
        const ring = Math.floor(i / 26);
        const idx = i % 26;
        const t = (idx / 26) * Math.PI * 2 + ring * 0.12;
        const [hx, hy] = heartPoint(t);
        const shrink = ring === 0 ? 1 : ring === 1 ? 0.72 : 0.44;
        const jitter = ring === 0 ? 0 : (Math.random() - 0.5) * 3;
        out.push([W/2 + hx * 15 * shrink + jitter, H/2 + hy * 12 * shrink + jitter]);
      }
    } else if (mode === 'grid') {
      const cols = 9, rows = Math.ceil(n / cols);
      const gapX = Math.min(72, (W - 80) / cols);
      const gapY = Math.min(78, (H - 120) / rows);
      for (let i = 0; i < n; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        out.push([W/2 + (col - (cols-1)/2) * gapX, H/2 + (row - (rows-1)/2) * gapY]);
      }
    } else {
      for (let i = 0; i < n; i++) {
        const t = i * 0.42;
        const r = 20 + i * 4.2;
        out.push([W/2 + Math.cos(t) * r, H/2 + Math.sin(t) * r * 0.7]);
      }
    }
    return out;
  }

  function openGallery() {
    if (galleryActive) return;
    galleryActive = true;
    preload();
    const targets = targetsFor(MODES[modeIndex]);
    tiles.forEach((tile, i) => { tile.tx = targets[i][0]; tile.ty = targets[i][1]; });

    openModal({
      badge: '📷', eyebrow: 'OUR MEMORIES', title: '我们的照片星河',
      body: `<div class="starfield-gallery">
        <div class="starfield-top">
          <span>我们在一起已经</span>
          <strong id="star-countdown">0000 天 00 时 00 分</strong>
        </div>
        <canvas id="star-canvas" width="${W}" height="${H}"></canvas>
        <div class="starfield-bottom"><span>♥ 每一张照片，都是我们的一帧回忆 ♥</span></div>
        <div class="starfield-controls">
          <button class="pixel-btn no-particle" id="star-mode">${MODE_LABELS[MODES[modeIndex]]}</button>
          <button class="pixel-btn no-particle" id="star-pause">⏸ 暂停</button>
          <span class="star-tip">点击照片可放大</span>
        </div>
      </div>`
    });

    canvas = document.getElementById('star-canvas');
    ctx = canvas.getContext('2d');
    dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let paused = false;
    const pauseBtn = document.getElementById('star-pause');
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.textContent = paused ? '▶ 继续' : '⏸ 暂停';
    });
    document.getElementById('star-mode').addEventListener('click', (event) => {
      modeIndex = (modeIndex + 1) % MODES.length;
      event.target.textContent = MODE_LABELS[MODES[modeIndex]];
      const newTargets = targetsFor(MODES[modeIndex]);
      tiles.forEach((tile, i) => { tile.tx = newTargets[i][0]; tile.ty = newTargets[i][1]; });
      playTone(784, 0.08);
    });

    // 点击照片放大
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (W / rect.width);
      const y = (event.clientY - rect.top) * (H / rect.height);
      let best = null, bestDist = 45;
      for (const tile of tiles) {
        const dist = Math.hypot(tile.x - x, tile.y - y);
        if (dist < bestDist) { bestDist = dist; best = tile; }
      }
      if (best) openLightbox(best.source);
    });

    updateCountdown();
    setInterval(updateCountdown, 60000);
    animate();
    modal.addEventListener('click', function onClose(event) {
      if (event.target.hasAttribute('data-close')) {
        galleryActive = false;
        if (rafId) cancelAnimationFrame(rafId);
        modal.removeEventListener('click', onClose);
      }
    });
  }

  function updateCountdown() {
    const el = document.getElementById('star-countdown');
    if (!el) return;
    const diff = Date.now() - startDate.getTime();
    const days = Math.max(0, Math.floor(diff / 86400000));
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;
    el.textContent = `${String(days).padStart(4,'0')} 天 ${String(hours).padStart(2,'0')} 时 ${String(minutes).padStart(2,'0')} 分`;
  }

  function animate() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // 星空背景
    const bg = ctx.createRadialGradient(W/2, H/2, 40, W/2, H/2, W*0.7);
    bg.addColorStop(0, '#1a1230');
    bg.addColorStop(0.5, '#0d0a1c');
    bg.addColorStop(1, '#05040e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137.5) % W, sy = (i * 83.7) % H;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.02 + i));
      ctx.fillStyle = `rgba(255,240,210,${0.15 + twinkle * 0.45})`;
      ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }

    // 心形微光轮廓
    if (MODES[modeIndex] === 'heart') {
      ctx.save();
      ctx.strokeStyle = `rgba(255,92,138,${0.12 + 0.06 * Math.sin(frame * 0.03)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const [hx, hy] = heartPoint(i / 120 * Math.PI * 2);
        const px = W/2 + hx * 15.5, py = H/2 + hy * 12.5;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 照片碎片
    tiles.forEach(tile => {
      const dx = tile.tx - tile.x, dy = tile.ty - tile.y;
      tile.x += dx * 0.035;
      tile.y += dy * 0.035;
      const floatX = Math.sin(frame * 0.012 * tile.speed + tile.phase) * 4;
      const floatY = Math.cos(frame * 0.009 * tile.speed + tile.phase) * 3;
      const img = images[tile.source];
      const w = 42 * tile.scale, h = 56 * tile.scale;
      const x = tile.x + floatX, y = tile.y + floatY;
      ctx.save();
      ctx.globalAlpha = tile.alpha;
      ctx.translate(x, y);
      ctx.rotate(tile.rot + Math.sin(frame * 0.008 + tile.phase) * 0.05);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fff8f0';
      ctx.fillRect(-w/2 - 2, -h/2 - 2, w + 4, h + 12);
      ctx.shadowBlur = 0;
      if (img.complete && img.naturalWidth) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const ratio = Math.max(w / iw, h / ih);
        const sw = w / ratio, sh = h / ratio;
        ctx.drawImage(img, (iw - sw)/2, (ih - sh)/2, sw, sh, -w/2, -h/2, w, h);
      }
      ctx.restore();
    });

    rafId = requestAnimationFrame(animate);
  }

  function openLightbox(index) {
    const p = photos[index];
    openModal({
      badge: '♥', eyebrow: `MEMORY ${String(index + 1).padStart(2, '0')}`, title: p.caption,
      body: `<div class="lightbox-photo"><img src="${p.src}" alt="${escapeHtml(p.caption)}"></div>
        <div class="lightbox-nav">
          <button class="pixel-btn" id="lightbox-prev">◀</button>
          <button class="pixel-btn" id="lightbox-next">▶</button>
        </div>`
    });
    document.getElementById('lightbox-prev').addEventListener('click', () => openLightbox((index - 1 + photos.length) % photos.length));
    document.getElementById('lightbox-next').addEventListener('click', () => openLightbox((index + 1) % photos.length));
    playTone(784, 0.08);
  }

  window.PhotoGallery = { openGallery };

  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(() => {
    if (!document.getElementById('hud-photo')) {
      const btn = document.createElement('button');
      btn.id = 'hud-photo';
      btn.className = 'hud-btn photo-btn';
      btn.title = '我们的照片星河';
      btn.innerHTML = '📷 <span>照片</span>';
      btn.addEventListener('click', openGallery);
      const level = document.getElementById('hud-level');
      if (level) level.before(btn);
    }
  }, 80));
})();
