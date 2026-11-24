// ===== 像素客厅引擎：Canvas 绘制 + 角色移动 + 区域检测 =====
const PIXEL = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 384;
  const H = 216;
  let scale = 1;

  function resize() {
    const wrap = canvas.parentElement;
    const availW = wrap.clientWidth - 4;
    const availH = Math.min(window.innerHeight - 250, 560);
    scale = Math.max(0.55, Math.min(availW / W, availH / H));
    canvas.style.width = W * scale + 'px';
    canvas.style.height = H * scale + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function px(x, y, color, size = 1) { rect(x, y, size, size, color); }

  const C = {
    wall: '#3b3054', wallDark: '#2e2645', wallLight: '#4b3d69',
    floor: '#6d4b5a', floorDark: '#5a3d49', floorLight: '#805a69',
    wood: '#8b5a3c', woodDark: '#5e3a2a', woodLight: '#b4784f',
    pink: '#ff5c8a', pinkLight: '#ff8fab', violet: '#a78bfa', mint: '#5eead4',
    gold: '#ffd166', white: '#fff6f8', dark: '#1a1426', black: '#120e1c',
    skin: '#ffd0b0', hair: '#3a2a3a', shirt: '#5eead4', pants: '#4a3a68',
    cat: '#f0e6d2', catDark: '#c9b89e'
  };

  let frame = 0;
  let player = { x: 250, y: 186, dir: 'down', moving: false, step: 0 };
  const keys = {};
  const zones = [];

  function defineZones() {
    zones.length = 0;
    zones.push({ id: 'tv', x: 36, y: 60, w: 76, h: 46, label: '电视', hint: '翻看我们的照片' });
    zones.push({ id: 'window', x: 132, y: 30, w: 74, h: 52, label: '窗户', hint: '看看窗外的寄语' });
    zones.push({ id: 'clock', x: 90, y: 12, w: 28, h: 28, label: '挂钟', hint: '看看我们一起走过的时间' });
    zones.push({ id: 'map', x: 226, y: 32, w: 70, h: 42, label: '墙上地图', hint: '查看我们的足迹' });
    zones.push({ id: 'photo', x: 312, y: 34, w: 46, h: 40, label: '照片墙', hint: '打开我们的相册' });
    zones.push({ id: 'bookshelf', x: 316, y: 88, w: 46, h: 58, label: '书架', hint: '打开给你的情书' });
    zones.push({ id: 'cat', x: 262, y: 142, w: 34, h: 30, label: '小猫', hint: '摸摸这只猫' });
    zones.push({ id: 'sofa', x: 40, y: 126, w: 96, h: 48, label: '沙发', hint: '收下一句情话' });
    zones.push({ id: 'diary', x: 146, y: 152, w: 44, h: 26, label: '茶几日记', hint: '翻开我们的故事' });
    zones.push({ id: 'plant', x: 208, y: 126, w: 32, h: 46, label: '盆栽', hint: '写下想说的话' });
    zones.push({ id: 'radio', x: 114, y: 168, w: 30, h: 22, label: '音响', hint: '开关我们的旋律' });
    zones.push({ id: 'door', x: 192, y: 68, w: 34, h: 58, label: '门', hint: '推开门看看未来' });
  }
  defineZones();

  function inside(zone, x, y) {
    return x >= zone.x - 10 && x <= zone.x + zone.w + 10 && y >= zone.y - 10 && y <= zone.y + zone.h + 10;
  }
  function currentZone() {
    return zones.find((zone) => inside(zone, player.x, player.y + 10)) || null;
  }

  function drawRoom() {
    rect(0, 0, W, 92, C.wall);
    rect(0, 92, W, H - 92, C.floor);
    for (let x = 0; x < W; x += 16) rect(x, 0, 1, 92, C.wallDark);
    for (let y = 96; y < H; y += 12) {
      rect(0, y, W, 1, C.floorDark);
      const shift = ((y - 96) / 12) % 2 ? 0 : 16;
      for (let x = shift; x < W; x += 32) rect(x, y, 1, 12, C.floorDark);
    }
    rect(0, 88, W, 4, C.wallLight);
    rect(0, 90, W, 2, C.woodDark);
    // 窗外投在地板上的光斑
    for (let i = 0; i < 5; i++) {
      const lx = 136 + i * 15;
      rect(lx, 96 + (i % 2) * 3, 10, 40, 'rgba(255,240,180,0.045)');
    }
  }

  function drawWindow() {
    const x = 132, y = 30;
    rect(x - 2, y - 2, 78, 56, C.woodDark);
    rect(x, y, 74, 52, '#141b36');
    for (let i = 0; i < 18; i++) {
      const sx = x + 4 + ((i * 37) % 66);
      const sy = y + 4 + ((i * 19) % 42);
      const twinkle = (Math.floor(frame / 22) + i) % 4 === 0;
      px(sx, sy, twinkle ? C.white : '#8a9cc4');
    }
    // 月亮
    rect(x + 52, y + 8, 12, 12, '#ffe9a8');
    rect(x + 56, y + 6, 8, 16, '#141b36');
    // 偶尔划过的流星
    const meteor = Math.floor(frame / 6) % 90;
    if (meteor > 8 && meteor < 18) {
      const mx = x + 60 - (meteor - 8) * 4;
      const my = y + 8 + (meteor - 8) * 2;
      px(mx, my, C.white); px(mx + 3, my - 1, '#a8c4ff');
      px(mx + 6, my - 2, '#6a86c4');
    }
    rect(x + 36, y, 2, 52, C.woodDark);
    rect(x, y + 26, 74, 2, C.woodDark);
    rect(x - 4, y + 52, 82, 3, C.woodLight);
  }

  function drawClock() {
    const cx = 104, cy = 24;
    rect(cx - 10, cy - 10, 20, 20, C.woodDark);
    rect(cx - 8, cy - 8, 16, 16, '#f5efe0');
    px(cx, cy, C.dark, 2);
    // 分针秒针随时间转
    const seconds = Date.now() / 1000;
    const hourAngle = (seconds / 3600) * Math.PI * 2;
    const minAngle = (seconds / 60) * Math.PI * 2;
    px(Math.round(cx + Math.sin(hourAngle) * 4), Math.round(cy - Math.cos(hourAngle) * 4), C.dark, 1);
    px(Math.round(cx + Math.sin(minAngle) * 6), Math.round(cy - Math.cos(minAngle) * 6), C.pink, 1);
    // 12/3/6/9 刻度
    px(cx, cy - 7, C.woodDark); px(cx + 6, cy, C.woodDark);
    px(cx, cy + 6, C.woodDark); px(cx - 6, cy, C.woodDark);
  }

  function drawLamp() {
    const x = 180;
    rect(x - 1, 0, 2, 14, C.woodDark);
    rect(x - 8, 14, 16, 2, C.black);
    rect(x - 6, 16, 12, 5, C.gold);
    rect(x - 4, 21, 8, 2, '#ffe9a8');
    // 光晕
    const glow = 0.05 + Math.sin(frame / 30) * 0.015;
    rect(x - 40, 22, 80, 60, `rgba(255,209,102,${glow})`);
  }

  function drawTV() {
    const x = 36, y = 60;
    rect(x - 2, y - 2, 80, 50, C.black);
    rect(x, y, 76, 44, '#1a2740');
    const beat = Math.floor(frame / 20) % 2;
    const hx = x + 38, hy = y + 22 + beat;
    const heart = [
      '  XX  XX  ',
      ' XXXX XXXX ',
      'XXXXXXXXXX',
      ' XXXXXXXX ',
      '  XXXXXX  ',
      '   XXXX   ',
      '    XX    '
    ];
    heart.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === 'X') px(hx - 5 + rx, hy - 4 + ry, C.pink);
      }
    });
    for (let ly = y; ly < y + 44; ly += 4) rect(x, ly, 76, 1, 'rgba(0,0,0,0.18)');
    rect(x + 34, y + 44, 8, 4, C.black);
    rect(x + 26, y + 48, 24, 2, C.woodDark);
  }

  function drawMap() {
    const x = 226, y = 32;
    rect(x, y, 70, 42, '#e8dcc0');
    rect(x + 2, y + 2, 66, 38, '#d8c8a4');
    rect(x + 8, y + 8, 18, 12, '#8fae7a');
    rect(x + 14, y + 20, 10, 8, '#8fae7a');
    rect(x + 38, y + 6, 22, 14, '#8fae7a');
    rect(x + 44, y + 20, 12, 10, '#8fae7a');
    const dots = [[x + 16, y + 14], [x + 46, y + 12], [x + 52, y + 26]];
    dots.forEach(([dx, dy], i) => {
      if ((Math.floor(frame / 18) + i) % 3 !== 0) px(dx, dy, C.pink, 2);
    });
  }

  function drawPhotoWall() {
    const x = 312, y = 34;
    const colors = [C.pink, C.violet, C.mint, C.gold];
    for (let i = 0; i < 4; i++) {
      const fx = x + (i % 2) * 23 + 2;
      const fy = y + Math.floor(i / 2) * 20 + 2;
      rect(fx - 1, fy - 1, 19, 17, '#f5efe0');
      rect(fx, fy, 17, 12, colors[i]);
      px(fx + 5, fy + 4, C.dark); px(fx + 11, fy + 4, C.dark);
      rect(fx + 6, fy + 8, 6, 1, C.dark);
    }
  }

  function drawBookshelf() {
    const x = 316, y = 88;
    rect(x, y, 46, 58, C.woodDark);
    rect(x + 2, y + 2, 42, 54, C.wood);
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = y + 4 + shelf * 18;
      rect(x + 2, sy + 14, 42, 3, C.woodDark);
      const bookColors = [C.pink, C.violet, C.mint, C.gold, '#6ba8e8', '#f0a060'];
      for (let i = 0; i < 7; i++) {
        const bx = x + 4 + i * 6;
        const bookH = 8 + ((i * 3 + shelf) % 5);
        rect(bx, sy + 14 - bookH, 5, bookH, bookColors[(i + shelf) % bookColors.length]);
        px(bx + 2, sy + 15 - bookH, '#fff6f8');
      }
    }
    rect(x + 18, y - 8, 10, 8, C.gold);
    rect(x + 17, y - 10, 12, 2, C.gold);
    rect(x + 21, y - 2, 2, 2, C.gold);
  }

  function drawDoor() {
    const x = 192, y = 68;
    rect(x - 2, y - 2, 38, 62, C.woodDark);
    rect(x, y, 34, 58, '#7a4a34');
    rect(x + 3, y + 3, 28, 24, '#8b5a3c');
    rect(x + 3, y + 31, 28, 24, '#8b5a3c');
    rect(x + 27, y + 28, 4, 4, C.gold);
    if (Math.floor(frame / 40) % 5 === 0) rect(x + 33, y + 2, 1, 54, C.gold);
  }

  function drawSofa() {
    const x = 40, y = 126;
    rect(x, y, 96, 26, '#c95b7f');
    rect(x + 2, y + 2, 92, 22, '#e06a90');
    rect(x + 4, y + 4, 42, 18, '#eb7a9e');
    rect(x + 50, y + 4, 42, 18, '#eb7a9e');
    rect(x - 4, y + 18, 12, 28, '#c95b7f');
    rect(x + 88, y + 18, 12, 28, '#c95b7f');
    rect(x + 6, y + 28, 84, 16, '#f08cab');
    rect(x + 6, y + 42, 84, 4, '#c95b7f');
    rect(x + 12, y + 20, 14, 14, C.gold);
    rect(x + 70, y + 20, 14, 14, C.violet);
    px(x + 18, y + 26, C.dark, 2);
    px(x + 76, y + 26, C.dark, 2);
  }

  function drawTable() {
    const x = 146, y = 152;
    rect(x, y, 44, 4, C.woodLight);
    rect(x + 4, y + 4, 36, 3, C.woodDark);
    rect(x + 6, y + 7, 4, 12, C.woodDark);
    rect(x + 34, y + 7, 4, 12, C.woodDark);
    rect(x + 12, y - 6, 20, 10, '#fff6f8');
    rect(x + 13, y - 5, 18, 8, '#f0d8e4');
    rect(x + 16, y - 5, 1, 8, C.pink);
    rect(x + 36, y - 6, 6, 6, C.white);
    rect(x + 42, y - 5, 2, 3, C.white);
  }

  function drawPlant() {
    const x = 208, y = 126;
    rect(x + 6, y + 26, 20, 18, '#c8724a');
    rect(x + 4, y + 24, 24, 4, '#e08a5e');
    const sway = Math.floor(frame / 18) % 2;
    rect(x + 14, y + 8 + sway, 3, 18, '#4c9a6a');
    rect(x + 6, y + 14, 10, 4, '#5eb87a');
    rect(x + 17, y + 12 + sway, 10, 4, '#5eb87a');
    rect(x + 9, y + 6, 6, 4, '#6fc98a');
  }

  function drawCat() {
    const x = 262, y = 142;
    rect(x + 6, y + 10, 20, 15, C.cat);
    rect(x + 2, y + 2, 16, 14, C.cat);
    rect(x + 3, y - 2, 4, 5, C.cat);
    rect(x + 13, y - 2, 4, 5, C.cat);
    px(x + 4, y - 1, C.pink); px(x + 14, y - 1, C.pink);
    const blink = Math.floor(frame / 60) % 8 === 0;
    px(x + 6, y + 7, C.black); px(x + 12, y + 7, C.black);
    if (blink) { rect(x + 5, y + 7, 3, 1, C.cat); rect(x + 11, y + 7, 3, 1, C.cat); }
    px(x + 9, y + 10, C.pink);
    const tail = Math.floor(frame / 12) % 4;
    rect(x + 26, y + 16 - tail, 3, 3, C.catDark);
    rect(x + 29, y + 12 - tail, 3, 3, C.catDark);
    rect(x + 8, y + 25, 5, 3, C.cat);
    rect(x + 18, y + 25, 5, 3, C.cat);
    // 猫碗
    rect(x + 40, y + 22, 14, 6, '#5a8fd6');
    rect(x + 42, y + 20, 10, 3, '#7ab0ee');
    px(x + 45, y + 23, C.white);
  }

  function drawRadio() {
    const x = 114, y = 168;
    rect(x, y, 30, 22, '#3a3a52');
    rect(x + 2, y + 2, 26, 18, '#555570');
    rect(x + 4, y + 4, 12, 12, '#22223a');
    const bar = 3 + (Math.floor(frame / 8) % 8);
    for (let i = 0; i < 4; i++) rect(x + 6 + i * 3, y + 12 - Math.min(8, bar - i), 2, Math.min(8, bar - i), C.mint);
    rect(x + 19, y + 6, 7, 3, C.gold);
    rect(x + 19, y + 12, 7, 3, C.pink);
  }

  function drawRug() {
    rect(90, 168, 150, 26, '#8b4a6a');
    rect(94, 172, 142, 18, '#a85a7e');
    for (let x = 98; x < 236; x += 14) px(x, 180, '#d4789e');
  }

  function drawPlayer() {
    const pxX = Math.round(player.x);
    const pxY = Math.round(player.y);
    const bounce = player.moving ? (Math.floor(player.step / 4) % 2) : 0;
    rect(pxX - 6, pxY + 11, 12, 3, 'rgba(0,0,0,0.28)');
    rect(pxX - 5, pxY + 5 + bounce, 4, 7, C.pants);
    rect(pxX + 1, pxY + 5 - bounce, 4, 7, C.pants);
    rect(pxX - 6, pxY - 4, 12, 11, C.shirt);
    rect(pxX - 8, pxY - 2 + bounce, 2, 7, C.skin);
    rect(pxX + 6, pxY - 2 - bounce, 2, 7, C.skin);
    rect(pxX - 5, pxY - 14, 10, 10, C.skin);
    rect(pxX - 6, pxY - 16, 12, 4, C.hair);
    rect(pxX - 6, pxY - 13, 2, 5, C.hair);
    if (player.dir !== 'up') {
      if (player.dir === 'left') px(pxX - 3, pxY - 10, C.black);
      else if (player.dir === 'right') px(pxX + 2, pxY - 10, C.black);
      else { px(pxX - 2, pxY - 10, C.black); px(pxX + 2, pxY - 10, C.black); }
    }
    if (Math.floor(frame / 30) % 4 === 0) px(pxX + 6, pxY - 18, C.pink);
  }

  function drawHighlight(zone) {
    if (!zone) return;
    const pulse = Math.floor(frame / 12) % 2;
    const color = pulse ? C.gold : C.white;
    const x = zone.x, y = zone.y, w = zone.w, h = zone.h;
    rect(x - 2, y - 2, 8, 2, color); rect(x - 2, y - 2, 2, 8, color);
    rect(x + w - 6, y - 2, 8, 2, color); rect(x + w - 2, y - 2, 2, 8, color);
    rect(x - 2, y + h - 2, 8, 2, color); rect(x - 2, y + h - 6, 2, 8, color);
    rect(x + w - 6, y + h - 2, 8, 2, color); rect(x + w - 2, y + h - 6, 2, 8, color);
  }

  const isSolid = (x, y) => {
    if (x < 8 || x > W - 8 || y < 20 || y > H - 8) return true;
    if (y > 96 && y < 148 && x > 36 && x < 140) return true;
    if (y > 148 && y < 176 && x > 142 && x < 194) return true;
    if (y > 118 && y < 174 && x > 204 && x < 244) return true;
    if (y > 62 && y < 130 && x > 188 && x < 230) return true;
    if (y > 84 && y < 150 && x > 312 && x < 366) return true;
    if (y > 136 && y < 176 && x > 258 && x < 300) return true;
    return false;
  };

  function update() {
    frame++;
    let dx = 0, dy = 0;
    if (keys.ArrowUp || keys.KeyW) dy = -1;
    if (keys.ArrowDown || keys.KeyS) dy = 1;
    if (keys.ArrowLeft || keys.KeyA) dx = -1;
    if (keys.ArrowRight || keys.KeyD) dx = 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length; dy /= length;
      const speed = 1.15;
      player.moving = true;
      player.step++;
      if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
      else player.dir = dy < 0 ? 'up' : 'down';
      const nx = player.x + dx * speed;
      const ny = player.y + dy * speed;
      if (!isSolid(nx, player.y)) player.x = nx;
      if (!isSolid(player.x, ny)) player.y = ny;
    } else {
      player.moving = false;
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawRoom();
    drawLamp();
    drawWindow();
    drawClock();
    drawMap();
    drawPhotoWall();
    drawBookshelf();
    drawDoor();
    drawTV();
    drawRug();
    drawSofa();
    drawTable();
    drawPlant();
    drawCat();
    drawRadio();
    drawHighlight(currentZone());
    drawPlayer();
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  loop();

  window.addEventListener('keydown', (event) => { keys[event.code] = true; });
  window.addEventListener('keyup', (event) => { keys[event.code] = false; });

  canvas.addEventListener('click', (event) => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / scale;
    const y = (event.clientY - bounds.top) / scale;
    const zone = zones.find((z) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);
    if (zone) window.dispatchEvent(new CustomEvent('zone-interact', { detail: zone.id }));
  });

  return {
    getZone: currentZone,
    getPlayer: () => player,
    setKey: (code, value) => { keys[code] = value; },
    W, H
  };
})();