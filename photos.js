/* ===== 相片胶带 · 3D 旋转木马照片墙 ===== */
(() => {
  'use strict';

  const photos = (CONFIG.photos || []).filter(p => p.src);
  if (!photos.length) return;

  let angle = 0;
  let autoTimer = null;
  let activeIndex = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartAngle = 0;

  function openGallery() {
    openModal({
      badge: '📷', eyebrow: 'OUR MEMORIES', title: '我们的相片胶带',
      body: `<div class="photo-gallery" id="photo-gallery">
        <div class="gallery-hint">拖动旋转 · 滚轮切换 · 点击照片放大</div>
        <div class="gallery-stage" id="gallery-stage">
          <div class="gallery-ring" id="gallery-ring">
            ${photos.map((p, i) => `
              <button class="tape-photo" data-index="${i}" aria-label="${escapeHtml(p.caption)}">
                <span class="tape-pin">♥</span>
                <img src="${p.src}" alt="${escapeHtml(p.caption)}" draggable="false">
                <span class="tape-caption">${escapeHtml(p.caption)}</span>
              </button>`).join('')}
          </div>
        </div>
        <div class="gallery-controls">
          <button class="pixel-btn no-particle" id="gallery-prev">◀ 上一张</button>
          <button class="pixel-btn no-particle" id="gallery-toggle">⏸ 暂停</button>
          <button class="pixel-btn no-particle" id="gallery-next">下一张 ▶</button>
        </div>
        <p class="gallery-counter" id="gallery-counter">1 / ${photos.length}</p>
      </div>`
    });

    const stage = document.getElementById('gallery-stage');
    const ring = document.getElementById('gallery-ring');
    const counter = document.getElementById('gallery-counter');
    const toggle = document.getElementById('gallery-toggle');

    function render() {
      const n = photos.length;
      const step = 360 / n;
      ring.style.transform = `rotateY(${angle}deg)`;
      ring.querySelectorAll('.tape-photo').forEach((el, i) => {
        const tileAngle = i * step;
        const tilt = i % 2 ? 2 : -2;
        el.style.transform = `rotateY(${tileAngle}deg) translateZ(300px) rotate(${tilt}deg)`;
        const normalized = ((tileAngle + angle) % 360 + 360) % 360;
        const facing = normalized < 90 || normalized > 270;
        el.style.opacity = facing ? '1' : '0.45';
        el.style.zIndex = facing ? String(Math.round(100 - Math.abs(normalized - 180) / 3)) : '0';
      });
      activeIndex = ((-Math.round(angle / step) % n) + n) % n;
      counter.textContent = `${activeIndex + 1} / ${n}`;
    }

    function rotateBy(deg) {
      angle += deg;
      render();
    }
    function goTo(index) {
      const step = 360 / photos.length;
      const currentIndex = ((-Math.round(angle / step) % photos.length) + photos.length) % photos.length;
      let diff = index - currentIndex;
      if (diff > photos.length / 2) diff -= photos.length;
      if (diff < -photos.length / 2) diff += photos.length;
      angle -= diff * step;
      render();
    }
    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => rotateBy(-360 / photos.length), 3200);
      toggle.textContent = '⏸ 暂停';
    }
    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
      toggle.textContent = '▶ 自动旋转';
    }

    document.getElementById('gallery-prev').addEventListener('click', () => { stopAuto(); goTo((activeIndex - 1 + photos.length) % photos.length); });
    document.getElementById('gallery-next').addEventListener('click', () => { stopAuto(); goTo((activeIndex + 1) % photos.length); });
    toggle.addEventListener('click', () => { if (autoTimer) stopAuto(); else startAuto(); });

    stage.addEventListener('pointerdown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartAngle = angle;
      stage.setPointerCapture(e.pointerId);
      stopAuto();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      angle = dragStartAngle + (e.clientX - dragStartX) * 0.45;
      render();
    });
    stage.addEventListener('pointerup', () => { isDragging = false; });
    stage.addEventListener('pointercancel', () => { isDragging = false; });
    stage.addEventListener('wheel', (e) => { e.preventDefault(); stopAuto(); rotateBy(e.deltaY > 0 ? -25 : 25); }, { passive: false });

    ring.querySelectorAll('.tape-photo').forEach(el => {
      el.addEventListener('click', () => {
        if (isDragging) return;
        const index = Number(el.dataset.index);
        if (index !== activeIndex) { goTo(index); return; }
        openLightbox(index);
      });
    });

    render();
    startAuto();
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

  // HUD 入口
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(() => {
    if (!document.getElementById('hud-photo')) {
      const btn = document.createElement('button');
      btn.id = 'hud-photo';
      btn.className = 'hud-btn photo-btn';
      btn.title = '我们的相片胶带';
      btn.innerHTML = '📷 <span>照片</span>';
      btn.addEventListener('click', openGallery);
      const level = document.getElementById('hud-level');
      if (level) level.before(btn);
    }
  }, 80));
})();
