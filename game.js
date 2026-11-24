// ===== 像素情侣小屋 · 大场景引擎 =====
const PIXEL = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 640;
  const H = 360;
  let scale = 1;

  function resize() {
    const wide = window.innerWidth > 700;
    const availW = Math.min(window.innerWidth - (wide ? 64 : 24), wide ? 1040 : window.innerWidth - 24);
    const availH = Math.min(window.innerHeight - (wide ? 250 : 300), 700);
    scale = Math.max(0.42, Math.min(availW / W, availH / H));
    canvas.style.width = Math.round(W * scale) + 'px';
    canvas.style.height = Math.round(H * scale) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function px(x, y, color, size = 1) { rect(x, y, size, size, color); }
  function circle(cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), r, 0, Math.PI * 2);
    ctx.fill();
  }

  const C = {
    wall: '#3b3054', wallDark: '#2e2645', wallLight: '#4b3d69',
    floor: '#6d4b5a', floorDark: '#5a3d49', floorLight: '#805a69',
    wood: '#8b5a3c', woodDark: '#5e3a2a', woodLight: '#b4784f',
    pink: '#ff5c8a', pinkLight: '#ff8fab', violet: '#a78bfa', mint: '#5eead4',
    gold: '#ffd166', white: '#fff6f8', dark: '#1a1426', black: '#120e1c',
    skin: '#ffd0b0', hair: '#3a2a3a', shirt: '#5eead4', pants: '#4a3a68',
    cat: '#f0e6d2', catDark: '#c9b89e', blue: '#6ba8e8'
  };

  let frame = 0;
  let player = { x: 470, y: 310, dir: 'down', moving: false, step: 0 };
  const keys = {};
  const zones = [];

  function defineZones() {
    zones.length = 0;
    zones.push({ id: 'neon', x: 48, y: 18, w: 96, h: 34, label: 'LOVE 灯牌', hint: '看看我们的爱情宣言' });
    zones.push({ id: 'calendar', x: 268, y: 14, w: 66, h: 44, label: '墙上日历', hint: '重要的日子' });
    zones.push({ id: 'clock', x: 360, y: 18, w: 30, h: 30, label: '挂钟', hint: '我们一起走过的时间' });
    zones.push({ id: 'window', x: 164, y: 34, w: 92, h: 66, label: '窗户', hint: '窗外的寄语' });
    zones.push({ id: 'map', x: 440, y: 30, w: 84, h: 50, label: '足迹地图', hint: '我们去过的地方' });
    zones.push({ id: 'photo', x: 548, y: 30, w: 66, h: 52, label: '照片墙', hint: '我们的相册' });
    zones.push({ id: 'bookshelf', x: 548, y: 100, w: 66, h: 82, label: '书架', hint: '给你的情书' });
    zones.push({ id: 'tv', x: 40, y: 84, w: 106, h: 66, label: '电视', hint: '照片轮播' });
    zones.push({ id: 'arcade', x: 40, y: 174, w: 48, h: 62, label: '街机', hint: '玩记忆翻牌小游戏' });
    zones.push({ id: 'sofa', x: 60, y: 178, w: 140, h: 70, label: '情侣沙发', hint: '收一句情话' });
    zones.push({ id: 'diary', x: 236, y: 226, w: 56, h: 34, label: '茶几日记', hint: '翻开我们的故事' });
    zones.push({ id: 'coffee', x: 300, y: 222, w: 46, h: 38, label: '两杯咖啡', hint: '一起喝杯咖啡吧' });
    zones.push({ id: 'plant', x: 372, y: 192, w: 44, h: 64, label: '盆栽', hint: '留言板' });
    zones.push({ id: 'cat', x: 462, y: 224, w: 48, h: 42, label: '小猫', hint: '摸摸猫' });
    zones.push({ id: 'radio', x: 196, y: 272, w: 38, h: 28, label: '音响', hint: '开关音乐' });
    zones.push({ id: 'fridge', x: 548, y: 196, w: 62, h: 96, label: '冰箱', hint: '冰箱贴留言' });
    zones.push({ id: 'door', x: 326, y: 116, w: 48, h: 80, label: '门', hint: '推开门看未来' });
    zones.push({ id: 'trivia', x: 130, y: 288, w: 54, h: 34, label: '默契问答', hint: '玩情侣问答小游戏' });
  }
  defineZones();

  function inside(zone, x, y) {
    return x >= zone.x - 12 && x <= zone.x + zone.w + 12 && y >= zone.y - 12 && y <= zone.y + zone.h + 12;
  }
  function currentZone() {
    return zones.find((zone) => inside(zone, player.x, player.y + 12)) || null;
  }

  function drawRoom() {
    rect(0, 0, W, 120, C.wall);
    rect(0, 120, W, H - 120, C.floor);
    for (let x = 0; x < W; x += 20) rect(x, 0, 1, 120, C.wallDark);
    for (let y = 126; y < H; y += 14) {
      rect(0, y, W, 1, C.floorDark);
      const shift = ((y - 126) / 14) % 2 ? 0 : 20;
      for (let x = shift; x < W; x += 40) rect(x, y, 1, 14, C.floorDark);
    }
    rect(0, 114, W, 6, C.wallLight);
    rect(0, 118, W, 3, C.woodDark);
    // 窗光投在地板
    for (let i = 0; i < 8; i++) rect(168 + i * 13, 122 + (i % 2) * 4, 11, 52, 'rgba(255,240,180,0.04)');
  }

  function drawNeon() {
    const x = 48, y = 18;
    rect(x - 2, y - 2, 100, 38, '#241b35');
    rect(x, y, 96, 34, '#120e1c');
    const pulse = Math.floor(frame / 18) % 2;
    const color = pulse ? C.pink : C.pinkLight;
    // 用 5x7 点阵画 LOVE
    const glyphs = {
      L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
      O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
      V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
      E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####']
    };
    const word = 'LOVE';
    word.split('').forEach((letter, li) => {
      glyphs[letter].forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '#') rect(x + 8 + li * 18 + rx * 3, y + 4 + ry * 4, 3, 3, color);
        }
      });
    });
    // 小爱心
    const hx = x + 84, hy = y + 18;
    px(hx - 3, hy - 2, color, 2); px(hx + 2, hy - 2, color, 2);
    rect(hx - 4, hy, 11, 3, color); rect(hx - 2, hy + 3, 7, 2, color); px(hx, hy + 5, color, 2);
    rect(x + 44, y + 34, 4, 4, C.woodDark);
  }

  function drawCalendar() {
    const x = 268, y = 14;
    rect(x - 2, y - 2, 70, 48, C.woodDark);
    rect(x, y, 66, 44, '#f5efe0');
    rect(x, y, 66, 12, C.pink);
    rect(x + 4, y + 3, 22, 3, '#fff');
    // 日历格
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        px(x + 4 + col * 8, y + 16 + row * 8, '#c9bfae');
      }
    }
    // 圈出 8 号（7月8日）
    rect(x + 4 + 7 * 8 - 2, y + 16 + 6 - 2, 10, 10, C.pink);
    rect(x + 4 + 7 * 8 - 1, y + 16 + 6 - 1, 8, 8, '#f5efe0');
    px(x + 4 + 7 * 8 + 2, y + 16 + 6 + 3, C.pink, 2);
  }

  function drawClock() {
    const cx = 375, cy = 33;
    circle(cx, cy, 14, C.woodDark);
    circle(cx, cy, 11, '#f5efe0');
    px(cx, cy, C.dark, 2);
    const seconds = Date.now() / 1000;
    const hourAngle = (seconds / 3600) * Math.PI * 2;
    const minAngle = (seconds / 60) * Math.PI * 2;
    px(Math.round(cx + Math.sin(hourAngle) * 5), Math.round(cy - Math.cos(hourAngle) * 5), C.dark);
    px(Math.round(cx + Math.sin(minAngle) * 8), Math.round(cy - Math.cos(minAngle) * 8), C.pink);
    px(cx, cy - 10, C.woodDark); px(cx + 9, cy, C.woodDark);
    px(cx, cy + 9, C.woodDark); px(cx - 9, cy, C.woodDark);
  }

  function drawWindow() {
    const x = 164, y = 34;
    rect(x - 3, y - 3, 98, 72, C.woodDark);
    rect(x, y, 92, 66, '#141b36');
    // 星空
    for (let i = 0; i < 34; i++) {
      const sx = x + 4 + ((i * 37) % 84);
      const sy = y + 4 + ((i * 19) % 56);
      const twinkle = (Math.floor(frame / 22) + i) % 4 === 0;
      px(sx, sy, twinkle ? C.white : '#8a9cc4');
    }
    // 月亮和云
    circle(x + 68, y + 16, 9, '#ffe9a8');
    rect(x + 73, y + 8, 9, 18, '#141b36');
    rect(x + 14, y + 44, 22, 4, 'rgba(255,255,255,0.15)');
    rect(x + 18, y + 41, 14, 4, 'rgba(255,255,255,0.15)');
    // 流星
    const meteor = Math.floor(frame / 6) % 120;
    if (meteor > 12 && meteor < 22) {
      const mx = x + 75 - (meteor - 12) * 5;
      const my = y + 10 + (meteor - 12) * 2;
      px(mx, my, C.white); px(mx + 4, my - 1, '#a8c4ff'); px(mx + 8, my - 2, '#6a86c4');
    }
    // 窗框 + 窗帘
    rect(x + 45, y, 2, 66, C.woodDark);
    rect(x, y + 32, 92, 2, C.woodDark);
    rect(x - 6, y - 6, 14, 78, '#a8436a');
    rect(x + 90, y - 6, 14, 78, '#a8436a');
    for (let i = 0; i < 5; i++) rect(x - 5 + i * 2, y + i * 12, 12, 3, '#c95b7f');
    for (let i = 0; i < 5; i++) rect(x + 91 + i * 2, y + i * 12, 12, 3, '#c95b7f');
    rect(x - 14, y + 72, 120, 4, C.woodLight);
  }

  function drawMap() {
    const x = 440, y = 30;
    rect(x, y, 84, 50, '#e8dcc0');
    rect(x + 2, y + 2, 80, 46, '#d8c8a4');
    rect(x + 8, y + 10, 24, 16, '#8fae7a');
    rect(x + 16, y + 26, 12, 10, '#8fae7a');
    rect(x + 46, y + 8, 28, 18, '#8fae7a');
    rect(x + 54, y + 26, 16, 12, '#8fae7a');
    const dots = [[x + 20, y + 18], [x + 56, y + 16], [x + 64, y + 34]];
    dots.forEach(([dx, dy], i) => {
      if ((Math.floor(frame / 18) + i) % 3 !== 0) px(dx, dy, C.pink, 3);
    });
    // 图钉连线
    rect(x + 22, y + 20, 34, 1, 'rgba(255,92,138,0.4)');
  }

  function drawPhotoWall() {
    const x = 548, y = 30;
    const colors = [C.pink, C.violet, C.mint, C.gold, C.blue, C.pinkLight];
    for (let i = 0; i < 6; i++) {
      const fx = x + (i % 3) * 21 + 2;
      const fy = y + Math.floor(i / 3) * 25 + 2;
      rect(fx - 1, fy - 1, 19, 22, '#f5efe0');
      rect(fx, fy, 17, 16, colors[i]);
      // 像素情侣简笔画
      px(fx + 5, fy + 4, C.dark); px(fx + 11, fy + 4, C.dark);
      rect(fx + 5, fy + 8, 8, 2, C.dark);
      rect(fx + 3, fy + 12, 12, 2, 'rgba(255,255,255,0.5)');
    }
    // 心形挂饰
    const hx = x + 32, hy = y + 56;
    px(hx - 3, hy - 2, C.pink, 2); px(hx + 2, hy - 2, C.pink, 2);
    rect(hx - 4, hy, 11, 3, C.pink); rect(hx - 2, hy + 3, 7, 2, C.pink); px(hx, hy + 5, C.pink, 2);
  }

  function drawBookshelf() {
    const x = 548, y = 100;
    rect(x, y, 66, 82, C.woodDark);
    rect(x + 2, y + 2, 62, 78, C.wood);
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = y + 4 + shelf * 26;
      rect(x + 2, sy + 22, 62, 3, C.woodDark);
      const bookColors = [C.pink, C.violet, C.mint, C.gold, C.blue, '#f0a060'];
      for (let i = 0; i < 9; i++) {
        const bx = x + 4 + i * 6;
        const bookH = 12 + ((i * 3 + shelf) % 7);
        rect(bx, sy + 22 - bookH, 5, bookH, bookColors[(i + shelf) % bookColors.length]);
        px(bx + 2, sy + 23 - bookH, '#fff6f8');
      }
    }
    // 顶部摆件：玩偶、奖杯、相框
    rect(x + 6, y - 12, 12, 12, '#e8a0b8');
    px(x + 9, y - 9, C.dark); px(x + 15, y - 9, C.dark);
    rect(x + 9, y - 5, 6, 2, C.dark);
    rect(x + 26, y - 10, 10, 10, C.gold);
    rect(x + 25, y - 12, 12, 2, C.gold);
    rect(x + 30, y - 2, 2, 2, C.gold);
    rect(x + 46, y - 12, 14, 12, '#f5efe0');
    rect(x + 48, y - 10, 10, 8, C.pinkLight);
  }

  function drawTV() {
    const x = 40, y = 84;
    rect(x - 3, y - 3, 112, 72, C.black);
    rect(x, y, 106, 66, '#1a2740');
    // 心形动画
    const beat = Math.floor(frame / 20) % 2;
    const hx = x + 53, hy = y + 34 + beat;
    const heart = [
      '   XX   XX   ',
      ' XXXX XXXXX  ',
      'XXXXXXXXXXXX',
      ' XXXXXXXXXX ',
      '  XXXXXXXX  ',
      '   XXXXXX   ',
      '    XXXX    ',
      '     XX     '
    ];
    heart.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === 'X') px(hx - 6 + rx * 1.5, hy - 6 + ry * 2, C.pink, 2);
      }
    });
    for (let ly = y; ly < y + 66; ly += 5) rect(x, ly, 106, 1, 'rgba(0,0,0,0.18)');
    // 电视柜
    rect(x + 2, y + 70, 102, 8, C.woodDark);
    rect(x + 4, y + 72, 98, 4, C.wood);
    rect(x + 20, y + 78, 4, 6, C.woodDark);
    rect(x + 78, y + 78, 4, 6, C.woodDark);
    // 游戏机 + 手柄
    rect(x + 42, y + 72, 18, 5, '#2a2a42');
    px(x + 45, y + 74, C.mint); px(x + 56, y + 74, C.pink);
  }

  function drawArcade() {
    const x = 40, y = 174;
    rect(x, y, 48, 62, '#2a2a42');
    rect(x + 3, y + 3, 42, 30, '#141b36');
    rect(x + 8, y + 8, 32, 20, '#1a2740');
    // 小游戏画面：像素爱心
    px(x + 20, y + 14, C.pink, 3); px(x + 26, y + 14, C.pink, 3);
    rect(x + 19, y + 17, 10, 3, C.pink);
    // 按钮
    circle(x + 13, y + 42, 3, C.pink);
    circle(x + 24, y + 42, 3, C.mint);
    circle(x + 35, y + 42, 3, C.gold);
    rect(x + 8, y + 50, 32, 4, '#44445e');
    // 招贴
    rect(x + 8, y - 10, 32, 10, C.gold);
    // 闪烁文字用点代替
    for (let i = 0; i < 8; i++) px(x + 10 + i * 3, y - 6, (Math.floor(frame / 10) % 2) ? C.dark : C.pink);
  }

  function drawSofa() {
    const x = 60, y = 178;
    // 靠背
    rect(x, y, 140, 34, '#c95b7f');
    rect(x + 3, y + 3, 134, 28, '#e06a90');
    rect(x + 5, y + 5, 62, 24, '#eb7a9e');
    rect(x + 73, y + 5, 62, 24, '#eb7a9e');
    // 扶手
    rect(x - 6, y + 24, 16, 42, '#c95b7f');
    rect(x + 130, y + 24, 16, 42, '#c95b7f');
    // 坐垫
    rect(x + 8, y + 38, 124, 22, '#f08cab');
    rect(x + 8, y + 58, 124, 6, '#c95b7f');
    // 情侣抱枕
    rect(x + 14, y + 28, 20, 20, C.gold);
    px(x + 20, y + 36, C.dark); px(x + 28, y + 36, C.dark);
    rect(x + 22, y + 41, 5, 2, C.dark);
    rect(x + 106, y + 28, 20, 20, C.violet);
    px(x + 112, y + 36, C.dark); px(x + 120, y + 36, C.dark);
    rect(x + 114, y + 41, 5, 2, C.dark);
    // 中间爱心毯子
    rect(x + 48, y + 44, 44, 16, '#fff0b3');
    for (let i = 0; i < 5; i++) px(x + 56 + i * 8, y + 48, C.pink, 2);
    // 腿
    rect(x + 12, y + 64, 8, 6, C.woodDark);
    rect(x + 120, y + 64, 8, 6, C.woodDark);
  }

  function drawTable() {
    const x = 236, y = 226;
    rect(x, y, 56, 5, C.woodLight);
    rect(x + 5, y + 5, 46, 4, C.woodDark);
    rect(x + 8, y + 9, 5, 16, C.woodDark);
    rect(x + 43, y + 9, 5, 16, C.woodDark);
    // 日记本
    rect(x + 8, y - 8, 22, 12, '#fff6f8');
    rect(x + 10, y - 6, 18, 9, '#f0d8e4');
    rect(x + 14, y - 6, 1, 9, C.pink);
    px(x + 24, y - 2, C.pink, 2);
  }

  function drawCoffee() {
    const x = 300, y = 222;
    // 两张小圆桌垫
    rect(x - 2, y + 12, 24, 3, '#d4789e');
    rect(x + 26, y + 12, 24, 3, '#9b8fd6');
    // 左边杯子（粉）
    rect(x, y, 12, 12, '#fff6f8');
    rect(x + 12, y + 3, 4, 5, '#fff6f8');
    rect(x + 2, y + 2, 8, 3, '#c96a8a');
    // 右边杯子（蓝）
    rect(x + 28, y, 12, 12, '#e8f4ff');
    rect(x + 40, y + 3, 4, 5, '#e8f4ff');
    rect(x + 30, y + 2, 8, 3, '#6ba8e8');
    // 中间小爱心
    px(x + 22, y + 4, C.pink, 3);
    // 小碟子和饼干
    rect(x + 12, y + 14, 18, 2, '#fff');
    px(x + 16, y + 13, '#c89a5a', 2); px(x + 22, y + 13, '#c89a5a', 2);
  }

  function drawPlant() {
    const x = 372, y = 192;
    rect(x + 8, y + 36, 28, 26, '#c8724a');
    rect(x + 5, y + 32, 34, 6, '#e08a5e');
    const sway = Math.floor(frame / 18) % 2;
    rect(x + 20, y + 8 + sway, 4, 26, '#4c9a6a');
    rect(x + 8, y + 18, 14, 5, '#5eb87a');
    rect(x + 24, y + 16 + sway, 14, 5, '#5eb87a');
    rect(x + 12, y + 8, 9, 5, '#6fc98a');
    rect(x + 28, y + 8, 9, 5, '#6fc98a');
    // 小花
    px(x + 20, y + 4, C.pink, 3);
    px(x + 17, y + 7, C.gold); px(x + 23, y + 7, C.gold);
  }

  function drawCat() {
    const x = 462, y = 224;
    // 猫窝
    rect(x - 6, y + 26, 54, 14, '#7a5a8a');
    rect(x - 3, y + 24, 48, 6, '#9a7aae');
    // 身体
    rect(x + 8, y + 8, 26, 20, C.cat);
    rect(x + 4, y + 2, 20, 16, C.cat);
    rect(x + 5, y - 2, 5, 6, C.cat);
    rect(x + 18, y - 2, 5, 6, C.cat);
    px(x + 6, y - 1, C.pink); px(x + 19, y - 1, C.pink);
    const blink = Math.floor(frame / 60) % 8 === 0;
    px(x + 9, y + 7, C.black); px(x + 16, y + 7, C.black);
    if (blink) { rect(x + 8, y + 7, 3, 1, C.cat); rect(x + 15, y + 7, 3, 1, C.cat); }
    px(x + 13, y + 11, C.pink);
    const tail = Math.floor(frame / 12) % 4;
    rect(x + 34, y + 18 - tail, 4, 4, C.catDark);
    rect(x + 38, y + 14 - tail, 4, 4, C.catDark);
    // 猫碗
    rect(x + 52, y + 30, 14, 6, C.blue);
    rect(x + 54, y + 28, 10, 3, '#8ac4f8');
    // 逗猫棒
    rect(x - 12, y + 6, 2, 24, C.woodLight);
    rect(x - 14, y + 4, 6, 2, C.pink);
  }

  function drawRadio() {
    const x = 196, y = 272;
    rect(x, y, 38, 28, '#3a3a52');
    rect(x + 2, y + 2, 34, 24, '#555570');
    rect(x + 4, y + 4, 16, 16, '#22223a');
    const bar = 4 + (Math.floor(frame / 8) % 10);
    for (let i = 0; i < 5; i++) {
      const h = Math.max(1, Math.min(12, bar - i * 2));
      rect(x + 6 + i * 3, y + 18 - h, 2, h, C.mint);
    }
    rect(x + 24, y + 6, 10, 4, C.gold);
    rect(x + 24, y + 14, 10, 4, C.pink);
    px(x + 29, y + 22, C.white, 2);
  }

  function drawFridge() {
    const x = 548, y = 196;
    rect(x, y, 62, 96, '#d9dde8');
    rect(x + 2, y + 2, 58, 40, '#eef1f7');
    rect(x + 2, y + 44, 58, 50, '#e4e8f0');
    rect(x + 54, y + 12, 3, 18, '#9aa3b5');
    rect(x + 54, y + 54, 3, 22, '#9aa3b5');
    // 便签
    rect(x + 8, y + 8, 20, 18, '#fff3a8');
    rect(x + 10, y + 11, 14, 2, '#c9b44a');
    rect(x + 10, y + 16, 12, 2, '#c9b44a');
    rect(x + 34, y + 12, 16, 14, '#ffc4d6');
    px(x + 42, y + 19, C.pink, 3);
    rect(x + 12, y + 54, 24, 20, '#c6f0e2');
    rect(x + 14, y + 58, 18, 2, '#5aa88a');
    rect(x + 14, y + 64, 14, 2, '#5aa88a');
    // 冰箱贴：心形和照片
    px(x + 46, y + 54, C.pink, 3);
    rect(x + 44, y + 58, 7, 3, C.pink);
  }

  function drawDoor() {
    const x = 326, y = 116;
    rect(x - 3, y - 3, 54, 86, C.woodDark);
    rect(x, y, 48, 80, '#7a4a34');
    rect(x + 4, y + 4, 40, 32, '#8b5a3c');
    rect(x + 4, y + 42, 40, 34, '#8b5a3c');
    rect(x + 38, y + 38, 5, 5, C.gold);
    // 门上的情侣贴纸
    px(x + 22, y + 20, C.pink, 3); px(x + 28, y + 20, C.pink, 3);
    rect(x + 21, y + 23, 10, 3, C.pink);
    // 门缝光
    if (Math.floor(frame / 40) % 5 === 0) rect(x + 47, y + 2, 1, 76, C.gold);
    // 门口两双拖鞋
    rect(x + 6, y + 84, 14, 7, C.pinkLight);
    rect(x + 22, y + 84, 14, 7, C.violet);
    rect(x + 40, y + 84, 12, 7, '#8ac4f8');
  }

  function drawTrivia() {
    const x = 130, y = 288;
    // 小桌牌
    rect(x, y, 54, 34, C.woodDark);
    rect(x + 2, y + 2, 50, 30, '#f5efe0');
    rect(x + 6, y + 6, 42, 4, C.pink);
    rect(x + 6, y + 14, 34, 3, '#c9bfae');
    rect(x + 6, y + 20, 28, 3, '#c9bfae');
    px(x + 44, y + 22, C.violet, 3);
  }

  function drawRug() {
    rect(170, 256, 180, 66, '#8b4a6a');
    rect(176, 262, 168, 54, '#a85a7e');
    rect(184, 270, 152, 38, '#b86288');
    // 花纹
    for (let x = 190; x < 340; x += 18) {
      px(x, 282, '#d4789e', 2);
      px(x + 9, 274, 'rgba(255,255,255,0.25)', 2);
    }
    // 地毯上的爱心
    const hx = 260, hy = 290;
    px(hx - 4, hy - 3, C.pink, 3); px(hx + 2, hy - 3, C.pink, 3);
    rect(hx - 5, hy, 11, 4, C.pink);
    rect(hx - 3, hy + 4, 7, 2, C.pink);
    px(hx, hy + 6, C.pink, 2);
  }

  function drawBalloons() {
    // 角落爱心气球
    const bx = 580, by = 52;
    const sway = Math.sin(frame / 30) * 2;
    const colors = [C.pink, C.violet, C.gold];
    colors.forEach((color, i) => {
      const cx = bx + (i - 1) * 16 + sway;
      const cy = by + i * 8;
      px(cx - 3, cy - 2, color, 3); px(cx + 2, cy - 2, color, 3);
      rect(cx - 4, cy, 11, 4, color);
      rect(cx - 2, cy + 4, 7, 2, color);
      px(cx, cy + 6, color, 2);
      rect(cx, cy + 8, 1, 40, 'rgba(255,255,255,0.25)');
    });
  }

  function drawPlayer() {
    const pxX = Math.round(player.x);
    const pxY = Math.round(player.y);
    const bounce = player.moving ? (Math.floor(player.step / 4) % 2) : 0;
    rect(pxX - 7, pxY + 12, 14, 3, 'rgba(0,0,0,0.3)');
    rect(pxX - 6, pxY + 5 + bounce, 5, 8, C.pants);
    rect(pxX + 1, pxY + 5 - bounce, 5, 8, C.pants);
    rect(pxX - 7, pxY - 5, 14, 13, C.shirt);
    rect(pxX - 9, pxY - 3 + bounce, 2, 8, C.skin);
    rect(pxX + 7, pxY - 3 - bounce, 2, 8, C.skin);
    rect(pxX - 6, pxY - 16, 12, 11, C.skin);
    rect(pxX - 7, pxY - 18, 14, 5, C.hair);
    rect(pxX - 7, pxY - 15, 2, 6, C.hair);
    if (player.dir !== 'up') {
      if (player.dir === 'left') px(pxX - 4, pxY - 12, C.black);
      else if (player.dir === 'right') px(pxX + 3, pxY - 12, C.black);
      else { px(pxX - 3, pxY - 12, C.black); px(pxX + 3, pxY - 12, C.black); }
    }
    if (Math.floor(frame / 30) % 4 === 0) px(pxX + 8, pxY - 22, C.pink);
  }

  function drawHighlight(zone) {
    if (!zone) return;
    const pulse = Math.floor(frame / 12) % 2;
    const color = pulse ? C.gold : C.white;
    const x = zone.x, y = zone.y, w = zone.w, h = zone.h;
    rect(x - 3, y - 3, 10, 2, color); rect(x - 3, y - 3, 2, 10, color);
    rect(x + w - 7, y - 3, 10, 2, color); rect(x + w - 3, y - 3, 2, 10, color);
    rect(x - 3, y + h - 3, 10, 2, color); rect(x - 3, y + h - 7, 2, 10, color);
    rect(x + w - 7, y + h - 3, 10, 2, color); rect(x + w - 3, y + h - 7, 2, 10, color);
  }

  const isSolid = (x, y) => {
    if (x < 10 || x > W - 10 || y < 26 || y > H - 10) return true;
    if (y > 178 && y < 250 && x > 54 && x < 214) return true;  // 沙发
    if (y > 222 && y < 256 && x > 232 && x < 298) return true; // 茶几
    if (y > 192 && y < 256 && x > 370 && x < 418) return true; // 盆栽
    if (y > 116 && y < 198 && x > 322 && x < 376) return true; // 门
    if (y > 100 && y < 184 && x > 544 && x < 616) return true; // 书架
    if (y > 196 && y < 294 && x > 544 && x < 612) return true; // 冰箱
    if (y > 224 && y < 272 && x > 458 && x < 514) return true; // 猫
    if (y > 174 && y < 240 && x > 36 && x < 92) return true;   // 街机
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
      const speed = 1.6;
      player.moving = true;
      player.step++;
      if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
      else player.dir = dy < 0 ? 'up' : 'down';
      const nx = player.x + dx * speed;
      const ny = player.y + dy * speed;
      if (!isSolid(nx, player.y)) player.x = nx;
      if (!isSolid(player.x, ny)) player.y = ny;
    } else player.moving = false;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawRoom();
    drawLamp && drawLamp();
    drawNeon();
    drawCalendar();
    drawClock();
    drawWindow();
    drawMap();
    drawPhotoWall();
    drawBookshelf();
    drawTV();
    drawArcade();
    drawFridge();
    drawDoor();
    drawBalloons();
    drawRug();
    drawSofa();
    drawTable();
    drawCoffee();
    drawPlant();
    drawCat();
    drawRadio();
    drawTrivia();
    drawHighlight(currentZone());
    drawPlayer();
  }

  function drawLamp() {
    const x = 320;
    rect(x - 2, 0, 4, 18, C.woodDark);
    rect(x - 12, 18, 24, 3, C.black);
    rect(x - 9, 21, 18, 6, C.gold);
    rect(x - 6, 27, 12, 3, '#ffe9a8');
    const glow = 0.04 + Math.sin(frame / 30) * 0.015;
    rect(x - 50, 30, 100, 90, `rgba(255,209,102,${glow})`);
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
    const x = (event.clientX - bounds.left) * (W / bounds.width);
    const y = (event.clientY - bounds.top) * (H / bounds.height);
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