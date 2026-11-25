/* ===== 氛围特效层 · 樱花 / 萤火 / 星光 / 人物拖尾 ===== */
(() => {
  'use strict';
  if (!window.PIXEL) return;

  const gameCanvas = document.getElementById('game');
  if (!gameCanvas) return;
  const W = PIXEL.W, H = PIXEL.H;

  const fx = document.createElement('canvas');
  fx.className = 'ambience-layer';
  fx.width = W; fx.height = H;
  gameCanvas.parentElement.insertBefore(fx, gameCanvas.nextSibling);
  const ctx = fx.getContext('2d');

  function syncSize() {
    const rect = gameCanvas.getBoundingClientRect();
    fx.style.width = rect.width + 'px';
    fx.style.height = rect.height + 'px';
  }
  window.addEventListener('resize', syncSize);
  if (window.ResizeObserver) new ResizeObserver(syncSize).observe(gameCanvas);
  syncSize();

  const petals = [];
  const fireflies = [];
  const trails = [];
  for (let i = 0; i < 34; i++) petals.push(spawnPetal(true));
  for (let i = 0; i < 22; i++) fireflies.push({
    x: Math.random() * W, y: 60 + Math.random() * (H - 80),
    phase: Math.random() * 6.28, speed: 0.3 + Math.random() * 0.6,
    size: 1 + Math.random() * 1.5
  });

  function spawnPetal(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : -10,
      vx: -0.25 - Math.random() * 0.4,
      vy: 0.35 + Math.random() * 0.5,
      rot: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 0.04,
      size: 3 + Math.random() * 3,
      color: ['#ff8fab', '#ffc4d6', '#f5e4b0', '#ffffff'][Math.floor(Math.random() * 4)]
    };
  }

  let frame = 0;
  let lastPlayer = null, lastPartner = null, lastDog = null;

  function heartPath(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y - size * 0.2, x - size, y - size * 0.3, x - size, y + size * 0.2);
    ctx.bezierCurveTo(x - size, y + size * 0.7, x, y + size, x, y + size * 1.2);
    ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.7, x + size, y + size * 0.2);
    ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.2, x, y + size * 0.3);
    ctx.closePath();
  }

  function addTrail(pos, color) {
    if (!pos) return;
    trails.push({ x: pos.x, y: pos.y + 14, life: 1, color });
    if (trails.length > 80) trails.shift();
  }

  function animate() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    // 窗户透进的柔和光束（缓慢摇摆）
    const beamShift = Math.sin(frame * 0.006) * 12;
    const beam = ctx.createLinearGradient(180, 90, 340, H);
    beam.addColorStop(0, 'rgba(255,240,200,0.07)');
    beam.addColorStop(0.5, 'rgba(255,220,180,0.025)');
    beam.addColorStop(1, 'rgba(255,200,160,0)');
    ctx.save();
    ctx.translate(beamShift, 0);
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(180, 90); ctx.lineTo(268, 90); ctx.lineTo(380, H); ctx.lineTo(150, H);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    const p = PIXEL.getPlayer();
    // 人物移动时留下爱心脚印
    if (p && p.moving) addTrail({ x: p.x, y: p.y }, '#ff8fab');
    // 静止时头顶冒小心心（用随机位置模拟伙伴位置）
    if (p && frame % 26 === 0 && !p.moving) addTrail({ x: p.x + 12, y: p.y - 26 }, '#ffd166');

    // 拖尾粒子
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life -= 0.035;
      t.y -= 0.25;
      if (t.life <= 0) { trails.splice(i, 1); continue; }
      ctx.globalAlpha = t.life * 0.75;
      ctx.fillStyle = t.color;
      heartPath(ctx, t.x, t.y, 2.5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 飘落樱花
    for (const petal of petals) {
      petal.x += petal.vx + Math.sin(frame * 0.02 + petal.rot) * 0.2;
      petal.y += petal.vy;
      petal.rot += petal.spin;
      if (petal.y > H + 10 || petal.x < -10) Object.assign(petal, spawnPetal(false), { x: Math.random() * (W + 40) });
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 萤火虫（呼吸光点）
    for (const f of fireflies) {
      const glow = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.02 * f.speed + f.phase));
      f.x += Math.sin(frame * 0.01 + f.phase) * 0.15;
      f.y += Math.cos(frame * 0.008 + f.phase) * 0.12;
      ctx.globalAlpha = glow * 0.7;
      ctx.fillStyle = '#fff3a8';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glow * 0.18;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(animate);
  }
  animate();
})();
