// ===== 粒子引擎：点击霓虹爆炸 / 心形爆发 / 涟漪 / 星尘背景 =====
const FX = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, ratio;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  const palette = ['#ff5c8a', '#ff8fab', '#ffd166', '#5eead4', '#a78bfa', '#ffffff'];
  const particles = [];
  const ripples = [];
  const dust = [];
  const pointer = { x: -1000, y: -1000 };

  window.addEventListener('pointermove', (event) => { pointer.x = event.clientX; pointer.y = event.clientY; });

  for (let i = 0; i < 70; i++) {
    dust.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 1.2,
      speed: 0.05 + Math.random() * 0.16,
      alpha: 0.1 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2
    });
  }

  function addParticle(x, y, vx, vy, color, size, life, glow = true) {
    particles.push({ x, y, px: x, py: y, vx, vy, color, size, life, maxLife: life, glow, gravity: 0.035 });
  }

  function burst(x, y, options = {}) {
    if (reduceMotion) return;
    const { count = 55, power = 6, colors = palette, ring = true } = options;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.35 + Math.random() * 0.9);
      const color = colors[Math.floor(Math.random() * colors.length)];
      addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 1 + Math.random() * 2.8, 45 + Math.random() * 45);
    }
    if (ring) {
      ripples.push({ x, y, radius: 6, alpha: 0.8, color: colors[0] || '#ff5c8a', speed: 4.5 });
    }
  }

  function heartBurst(x, y) {
    if (reduceMotion) return;
    const colors = ['#ff5c8a', '#ff8fab', '#ffd166', '#ffffff'];
    for (let i = 0; i < 36; i++) {
      const t = (i / 36) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const scale = 4 + Math.random() * 3;
      const tx = x + hx * scale;
      const ty = y + hy * scale;
      const angle = Math.atan2(ty - y, tx - x) + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 5;
      addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        colors[i % colors.length], 1.6 + Math.random() * 2.4, 60 + Math.random() * 35, false);
    }
    burst(x, y, { count: 45, power: 7, colors: ['#ff5c8a', '#ff8fab', '#ffffff'] });
    ripples.push({ x, y, radius: 8, alpha: 0.9, color: '#ff5c8a', speed: 5 });
    ripples.push({ x, y, radius: 2, alpha: 0.6, color: '#5eead4', speed: 3.2 });
  }

  function clickBurst(event) {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = event.clientX || (rect.left + rect.width / 2);
    const y = event.clientY || (rect.top + rect.height / 2);
    burst(x, y, { count: 65, power: 7 });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    // 背景星尘
    ctx.globalCompositeOperation = 'source-over';
    for (const d of dust) {
      d.y -= d.speed;
      d.phase += 0.008;
      if (d.y < -5) { d.y = height + 5; d.x = Math.random() * width; }
      const dx = d.x - pointer.x;
      const dy = d.y - pointer.y;
      if (Math.hypot(dx, dy) < 90) d.alpha = Math.min(0.9, d.alpha + 0.01);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${d.alpha * (0.7 + Math.sin(d.phase) * 0.3)})`;
      ctx.fill();
    }

    // 发光粒子叠加
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.975;
      p.vy = p.vy * 0.975 + p.gravity;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = alpha * 0.65;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      if (p.glow) { ctx.shadowBlur = 14; ctx.shadowColor = p.color; }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed;
      r.alpha *= 0.94;
      if (r.alpha < 0.02) { ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = r.alpha;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 18;
      ctx.shadowColor = r.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(loop);
  }
  loop();

  function animateNumber(element, target, duration = 1600) {
    if (reduceMotion) { element.textContent = target; return; }
    const start = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  function initScroll() {
    const bar = document.getElementById('progress-bar');
    const topButton = document.getElementById('back-to-top');
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      topButton.classList.toggle('show', window.scrollY > 500);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function bindGlobalClicks() {
    document.querySelectorAll('[data-burst]').forEach((element) => {
      element.addEventListener('click', clickBurst);
    });
    document.querySelectorAll('[data-heart-burst]').forEach((element) => {
      element.addEventListener('click', (event) => {
        const rect = element.getBoundingClientRect();
        heartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
    });
  }

  return { burst, heartBurst, animateNumber, initReveal, initScroll, bindGlobalClicks };
})();