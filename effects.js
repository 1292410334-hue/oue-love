// ===== 特效引擎：粒子背景 / 心形爆发 / 鼠标拖尾 / 滚动进度 / 数字动画 =====
const Effects = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 700px)').matches;

  function createCanvas(id) {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return { canvas, ctx, resize };
  }

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener('pointermove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  function initParticleBackground() {
    if (reduceMotion) return;
    const { ctx } = createCanvas('particle-canvas');
    const symbols = ['♥', '✦', '✿', '·', '✧'];
    const colors = ['#ff8fab', '#ffb3c6', '#ffd166', '#ffffff', '#a8e6cf'];
    const count = isMobile ? 44 : 110;
    const particles = Array.from({ length: count }, () => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: symbol === '·' ? 2 + Math.random() * 2 : 8 + Math.random() * 16,
        symbol,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.35 + Math.random() * 0.55,
        speedY: 0.12 + Math.random() * 0.45,
        speedX: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.006,
        angle: Math.random() * Math.PI * 2
      };
    });

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.phase) * 0.25;
        p.phase += 0.01;
        p.angle += p.spin;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 110 && distance > 0) {
          const push = (110 - distance) / 110;
          p.x += (dx / distance) * push * 1.6;
          p.y += (dy / distance) * push * 1.6;
        }

        if (p.y < -30) { p.y = window.innerHeight + 30; p.x = Math.random() * window.innerWidth; }
        if (p.x < -30) p.x = window.innerWidth + 30;
        if (p.x > window.innerWidth + 30) p.x = -30;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  function initBurstLayer() {
    return createCanvas('burst-canvas');
  }

  const burstLayer = initBurstLayer();

  function burstHearts(originX, originY, amount = 70) {
    if (reduceMotion) return;
    const { ctx } = burstLayer;
    const pieces = [];
    for (let i = 0; i < amount; i++) {
      const t = (i / amount) * Math.PI * 2;
      const heartX = 16 * Math.pow(Math.sin(t), 3);
      const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const spread = 4 + Math.random() * 5;
      const delay = Math.random() * 0.28;
      pieces.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 60,
        tx: originX + heartX * spread,
        ty: originY + heartY * spread,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 3,
        size: 5 + Math.random() * 11,
        color: ['#ff5c8a', '#ff8fab', '#ffb3c6', '#ffd166', '#ffffff'][Math.floor(Math.random() * 5)],
        alpha: 0,
        delay,
        life: 0,
        duration: 90 + Math.random() * 50
      });
    }

    let frameCount = 0;
    function animate() {
      frameCount++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = false;
      for (const p of pieces) {
        if (frameCount < p.delay * 60) { alive = true; continue; }
        p.life++;
        const progress = Math.min(1, p.life / 25);
        const eased = 1 - Math.pow(1 - progress, 3);
        p.x += (p.tx - p.x) * eased * 0.16 + p.vx * 0.35;
        p.y += (p.ty - p.y) * eased * 0.16 + p.vy * 0.35;
        p.vy += 0.08;
        p.alpha = p.life < 50 ? Math.min(1, p.life / 12) : Math.max(0, 1 - (p.life - 50) / (p.duration - 50));
        if (p.life < p.duration) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♥', p.x, p.y);
          ctx.restore();
        }
      }
      if (alive) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    animate();
  }

  function initCursorTrail() {
    if (reduceMotion || isMobile || !window.matchMedia('(pointer: fine)').matches) return;
    const layer = document.getElementById('cursor-layer');
    let last = 0;
    window.addEventListener('pointermove', (event) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const heart = document.createElement('span');
      heart.className = 'cursor-heart';
      heart.textContent = ['♥', '✦', '✧'][Math.floor(Math.random() * 3)];
      heart.style.left = `${event.clientX}px`;
      heart.style.top = `${event.clientY}px`;
      heart.style.color = ['#ff8fab', '#ffd166', '#ffffff'][Math.floor(Math.random() * 3)];
      layer.appendChild(heart);
      setTimeout(() => heart.remove(), 900);
    });
  }

  function initScrollProgress() {
    const bar = document.getElementById('progress-bar');
    const topButton = document.getElementById('back-to-top');
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${percent}%`;
      topButton.classList.toggle('show', window.scrollY > 500);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  return { initParticleBackground, burstHearts, initCursorTrail, initScrollProgress, animateNumber, initReveal };
})();
