// ===== 像素情侣小屋 · 多房间引擎 =====
const PIXEL = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 720, H = 405;
  let scale = 1;
  let currentRoom = 'living';

  function resize() {
    const availW = Math.min(window.innerWidth - 40, 1080);
    const availH = Math.min(window.innerHeight - 250, 680);
    scale = Math.max(0.4, Math.min(availW / W, availH / H));
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
    ctx.fillStyle = color; ctx.beginPath();
    ctx.arc(Math.round(cx), Math.round(cy), r, 0, Math.PI * 2); ctx.fill();
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
  let player = { x: 360, y: 340, dir: 'down', moving: false, step: 0 };
  const keys = {};
  const roomDoors = {};
  const zoneSets = {};

  // ===== 房间定义 =====
  function defineRooms() {
    zoneSets.living = [
      { id: 'neon', x: 48, y: 18, w: 96, h: 34, label: 'LOVE 灯牌', hint: '我们的爱情宣言' },
      { id: 'calendar', x: 280, y: 14, w: 66, h: 44, label: '墙上日历', hint: '重要的日子' },
      { id: 'clock', x: 376, y: 18, w: 30, h: 30, label: '挂钟', hint: '一起走过的时间' },
      { id: 'window', x: 176, y: 34, w: 92, h: 66, label: '窗户', hint: '窗外的寄语' },
      { id: 'map', x: 486, y: 30, w: 84, h: 50, label: '足迹地图', hint: '我们去过的地方' },
      { id: 'photo', x: 596, y: 30, w: 70, h: 52, label: '照片墙', hint: '我们的相册' },
      { id: 'bookshelf', x: 596, y: 100, w: 70, h: 82, label: '书架', hint: '给你的情书' },
      { id: 'tv', x: 40, y: 84, w: 106, h: 66, label: '电视', hint: '照片轮播' },
      { id: 'arcade', x: 40, y: 174, w: 48, h: 62, label: '街机', hint: '记忆翻牌小游戏' },
      { id: 'sofa', x: 60, y: 178, w: 140, h: 70, label: '情侣沙发', hint: '收一句情话' },
      { id: 'diary', x: 252, y: 226, w: 56, h: 34, label: '茶几日记', hint: '翻开我们的故事' },
      { id: 'coffee', x: 320, y: 222, w: 46, h: 38, label: '两杯咖啡', hint: '一起喝杯咖啡' },
      { id: 'plant', x: 400, y: 192, w: 44, h: 64, label: '盆栽', hint: '留言板' },
      { id: 'cat', x: 506, y: 224, w: 48, h: 42, label: '小猫', hint: '摸摸猫' },
      { id: 'radio', x: 216, y: 286, w: 38, h: 28, label: '音响', hint: '我们的音乐盒' },
      { id: 'trivia', x: 146, y: 304, w: 54, h: 34, label: '默契问答', hint: '情侣问答小游戏' },
      // 通往其他房间的门
      { id: 'door-bedroom', x: 348, y: 116, w: 48, h: 80, label: '卧室门', hint: '进入卧室', door: 'bedroom' },
      { id: 'door-kitchen', x: 676, y: 200, w: 36, h: 100, label: '厨房门', hint: '进入厨房', door: 'kitchen' },
      { id: 'door-bathroom', x: 676, y: 60, w: 36, h: 80, label: '卫生间门', hint: '进入卫生间', door: 'bathroom' }
    ];
    zoneSets.bedroom = [
      { id: 'bed', x: 92, y: 130, w: 200, h: 130, label: '我们的床', hint: '躺一会儿吧' },
      { id: 'pillowtalk', x: 120, y: 148, w: 70, h: 40, label: '情侣抱枕', hint: '枕边悄悄话' },
      { id: 'nightstand', x: 308, y: 190, w: 54, h: 60, label: '床头柜', hint: '睡前故事' },
      { id: 'wardrobe', x: 470, y: 80, w: 110, h: 170, label: '衣柜', hint: '看看我们的衣服' },
      { id: 'bedwindow', x: 96, y: 34, w: 92, h: 60, label: '卧室窗户', hint: '看星星' },
      { id: 'dreamcatcher', x: 320, y: 30, w: 50, h: 50, label: '捕梦网', hint: '做个好梦' },
      { id: 'photo-lamp', x: 400, y: 40, w: 44, h: 44, label: '照片灯', hint: '暖暖的回忆' },
      { id: 'slippers', x: 380, y: 344, w: 60, h: 30, label: '情侣拖鞋', hint: '一起回家' },
      { id: 'door-living', x: 640, y: 236, w: 44, h: 90, label: '回客厅', hint: '回到客厅', door: 'living' }
    ];
    zoneSets.kitchen = [
      { id: 'fridge', x: 40, y: 96, w: 66, h: 150, label: '冰箱', hint: '冰箱贴留言' },
      { id: 'stove', x: 156, y: 210, w: 90, h: 70, label: '灶台', hint: '一起做饭' },
      { id: 'cabinet', x: 130, y: 60, w: 140, h: 70, label: '橱柜', hint: '我们的碗筷' },
      { id: 'dining', x: 330, y: 210, w: 120, h: 80, label: '餐桌', hint: '一起吃饭吧' },
      { id: 'menu', x: 350, y: 222, w: 80, h: 50, label: '今日菜单', hint: '想吃什么' },
      { id: 'coffee-machine', x: 530, y: 100, w: 60, h: 70, label: '咖啡机', hint: '一杯咖啡的温暖' },
      { id: 'recipe', x: 620, y: 70, w: 60, h: 80, label: '食谱架', hint: '我们的拿手菜' },
      { id: 'apron', x: 500, y: 250, w: 50, h: 60, label: '情侣围裙', hint: '厨房里的我们' },
      { id: 'door-living-k', x: 660, y: 300, w: 44, h: 80, label: '回客厅', hint: '回到客厅', door: 'living' }
    ];
    zoneSets.bathroom = [
      { id: 'mirror', x: 70, y: 40, w: 90, h: 90, label: '镜子', hint: '照照镜子' },
      { id: 'sink', x: 56, y: 180, w: 110, h: 60, label: '洗手台', hint: '洗漱时光' },
      { id: 'bathtub', x: 240, y: 200, w: 180, h: 100, label: '浴缸', hint: '泡泡浴时间' },
      { id: 'rubberduck', x: 270, y: 218, w: 40, h: 30, label: '小黄鸭', hint: '浴缸里的朋友' },
      { id: 'towels', x: 470, y: 70, w: 70, h: 90, label: '毛巾架', hint: '情侣毛巾' },
      { id: 'plant-bath', x: 570, y: 260, w: 50, h: 70, label: '绿植', hint: '浴室里的小生命' },
      { id: 'notes-bath', x: 590, y: 60, w: 70, h: 60, label: '浴室便签', hint: '小秘密' },
      { id: 'door-living-b', x: 660, y: 300, w: 44, h: 80, label: '回客厅', hint: '回到客厅', door: 'living' }
    ];
  }
  defineRooms();

  const zones = () => zoneSets[currentRoom] || [];
  function inside(zone, x, y) {
    return x >= zone.x - 12 && x <= zone.x + zone.w + 12 && y >= zone.y - 12 && y <= zone.y + zone.h + 12;
  }
  function currentZone() { return zones().find(zone => inside(zone, player.x, player.y + 12)) || null; }

  function setRoom(room) {
    if (!zoneSets[room]) return;
    currentRoom = room;
    // 根据房间设置入场位置（在门口附近）
    const entry = { living: [360, 380], bedroom: [660, 300], kitchen: [680, 340], bathroom: [680, 340] }[room];
    player.x = entry[0]; player.y = entry[1];
    playTone(660, 0.08);
    setTimeout(() => playTone(880, 0.12), 90);
    window.dispatchEvent(new CustomEvent('room-change', { detail: room }));
  }

  function playTone(freq, duration = 0.1) {
    try {
      const audioCtx = window.audioCtx || (window.audioCtx = new (window.AudioContext || window.webkitAudioContext)());
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  // ===== 通用绘制 =====
  function drawBase(floorColor = C.floor, wallColor = C.wall) {
    rect(0, 0, W, 130, wallColor);
    rect(0, 130, W, H - 130, floorColor);
    for (let x = 0; x < W; x += 20) rect(x, 0, 1, 130, C.wallDark);
    for (let y = 136; y < H; y += 14) {
      rect(0, y, W, 1, C.floorDark);
      const shift = ((y - 136) / 14) % 2 ? 0 : 20;
      for (let x = shift; x < W; x += 40) rect(x, y, 1, 14, C.floorDark);
    }
    rect(0, 124, W, 6, C.wallLight);
    rect(0, 128, W, 3, C.woodDark);
  }

  function drawDoorBase(x, y, w, h, color = '#7a4a34') {
    rect(x - 3, y - 3, w + 6, h + 6, C.woodDark);
    rect(x, y, w, h, color);
    rect(x + 4, y + 4, w - 8, h / 2 - 6, '#8b5a3c');
    rect(x + 4, y + h / 2 + 2, w - 8, h / 2 - 6, '#8b5a3c');
    rect(x + w - 8, y + h / 2 - 3, 5, 5, C.gold);
  }

  function drawPlayer() {
    const pxX = Math.round(player.x), pxY = Math.round(player.y);
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
    const { x, y, w, h } = zone;
    rect(x - 3, y - 3, 10, 2, color); rect(x - 3, y - 3, 2, 10, color);
    rect(x + w - 7, y - 3, 10, 2, color); rect(x + w - 3, y - 3, 2, 10, color);
    rect(x - 3, y + h - 3, 10, 2, color); rect(x - 3, y + h - 7, 2, 10, color);
    rect(x + w - 7, y + h - 3, 10, 2, color); rect(x + w - 3, y + h - 7, 2, 10, color);
  }

  // ===== 客厅绘制（沿用上一版细节，坐标微调）=====
  function drawLiving() {
    drawBase();
    // LOVE 灯牌
    rect(46, 16, 100, 38, '#241b35'); rect(48, 18, 96, 34, '#120e1c');
    const pulse = Math.floor(frame / 18) % 2;
    const neonColor = pulse ? C.pink : C.pinkLight;
    const glyphs = {
      L: ['#....','#....','#....','#....','#....','#....','#####'],
      O: ['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
      V: ['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
      E: ['#####','#....','#....','####.','#....','#....','#####']
    };
    'LOVE'.split('').forEach((letter, li) => {
      glyphs[letter].forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '#') rect(56 + li * 18 + rx * 3, 22 + ry * 4, 3, 3, neonColor);
        }
      });
    });
    // 日历
    rect(278, 12, 70, 48, C.woodDark); rect(280, 14, 66, 44, '#f5efe0');
    rect(280, 14, 66, 12, C.pink); rect(284, 17, 22, 3, '#fff');
    for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) px(284 + col * 8, 30 + row * 8, '#c9bfae');
    rect(340, 30, 10, 10, C.pink); rect(341, 31, 8, 8, '#f5efe0'); px(344, 34, C.pink, 2);
    // 挂钟
    circle(391, 33, 14, C.woodDark); circle(391, 33, 11, '#f5efe0'); px(391, 33, C.dark, 2);
    const seconds = Date.now() / 1000;
    px(391 + Math.sin(seconds / 3600 * 6.28) * 5, 33 - Math.cos(seconds / 3600 * 6.28) * 5, C.dark);
    px(391 + Math.sin(seconds / 60 * 6.28) * 8, 33 - Math.cos(seconds / 60 * 6.28) * 8, C.pink);
    px(391, 23, C.woodDark); px(400, 33, C.woodDark); px(391, 43, C.woodDark); px(382, 33, C.woodDark);
    // 窗户
    rect(173, 31, 98, 72, C.woodDark); rect(176, 34, 92, 66, '#141b36');
    for (let i = 0; i < 34; i++) {
      const sx = 180 + (i * 37) % 84, sy = 38 + (i * 19) % 56;
      px(sx, sy, (Math.floor(frame / 22) + i) % 4 === 0 ? C.white : '#8a9cc4');
    }
    circle(244, 50, 9, '#ffe9a8'); rect(249, 42, 9, 18, '#141b36');
    rect(176, 66, 92, 2, C.woodDark); rect(221, 34, 2, 66, C.woodDark);
    rect(167, 28, 14, 78, '#a8436a'); rect(262, 28, 14, 78, '#a8436a');
    for (let i = 0; i < 5; i++) { rect(168 + i * 2, 34 + i * 12, 12, 3, '#c95b7f'); rect(263 + i * 2, 34 + i * 12, 12, 3, '#c95b7f'); }
    // 地图
    rect(486, 30, 84, 50, '#e8dcc0'); rect(488, 32, 80, 46, '#d8c8a4');
    rect(494, 40, 24, 16, '#8fae7a'); rect(502, 56, 12, 10, '#8fae7a');
    rect(532, 38, 28, 18, '#8fae7a'); rect(540, 56, 16, 12, '#8fae7a');
    [[506,48],[542,46],[550,64]].forEach(([dx,dy],i) => { if((Math.floor(frame/18)+i)%3!==0) px(dx,dy,C.pink,3); });
    // 照片墙
    const colors = [C.pink, C.violet, C.mint, C.gold, C.blue, C.pinkLight];
    for (let i = 0; i < 6; i++) {
      const fx = 598 + (i % 3) * 21, fy = 32 + Math.floor(i / 3) * 25;
      rect(fx - 1, fy - 1, 19, 22, '#f5efe0'); rect(fx, fy, 17, 16, colors[i]);
      px(fx + 5, fy + 4, C.dark); px(fx + 11, fy + 4, C.dark); rect(fx + 6, fy + 8, 6, 2, C.dark);
    }
    // 书架
    rect(596, 100, 70, 82, C.woodDark); rect(598, 102, 66, 78, C.wood);
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 106 + shelf * 26;
      rect(598, sy + 22, 66, 3, C.woodDark);
      const bookColors = [C.pink, C.violet, C.mint, C.gold, C.blue, '#f0a060'];
      for (let i = 0; i < 9; i++) {
        const bx = 600 + i * 7, bookH = 12 + ((i * 3 + shelf) % 7);
        rect(bx, sy + 22 - bookH, 6, bookH, bookColors[(i + shelf) % 6]);
      }
    }
    // 电视
    rect(37, 81, 112, 72, C.black); rect(40, 84, 106, 66, '#1a2740');
    const beat = Math.floor(frame / 20) % 2;
    const heart = ['  XXX  XXX  ',' XXXXX XXXXX ','XXXXXXXXXXX',' XXXXXXXXX ','  XXXXXXX  ','   XXXXX   ','    XXX    ','     X     '];
    heart.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === 'X') px(93 + rx * 1.5, 112 + beat + ry * 2, C.pink, 2); });
    rect(42, 154, 102, 8, C.woodDark);
    // 街机
    rect(40, 174, 48, 62, '#2a2a42'); rect(43, 177, 42, 30, '#141b36');
    px(60, 188, C.pink, 3); px(68, 188, C.pink, 3); rect(59, 191, 11, 3, C.pink);
    circle(53, 216, 3, C.pink); circle(64, 216, 3, C.mint); circle(75, 216, 3, C.gold);
    // 沙发
    rect(60, 178, 140, 34, '#c95b7f'); rect(63, 181, 134, 28, '#e06a90');
    rect(54, 202, 16, 42, '#c95b7f'); rect(190, 202, 16, 42, '#c95b7f');
    rect(68, 216, 124, 22, '#f08cab'); rect(68, 236, 124, 6, '#c95b7f');
    rect(74, 206, 20, 20, C.gold); rect(166, 206, 20, 20, C.violet);
    rect(108, 222, 44, 16, '#fff0b3');
    // 茶几 + 日记
    rect(252, 226, 56, 5, C.woodLight); rect(260, 231, 40, 18, C.woodDark);
    rect(260, 218, 22, 12, '#fff6f8'); rect(262, 220, 18, 9, '#f0d8e4');
    // 咖啡
    rect(320, 222, 12, 12, '#fff6f8'); rect(348, 222, 12, 12, '#e8f4ff');
    rect(332, 226, 3, 3, C.pink);
    // 盆栽
    rect(380, 228, 28, 26, '#c8724a'); const sway = Math.floor(frame / 18) % 2;
    rect(392, 200 + sway, 4, 26, '#4c9a6a'); rect(380, 210, 14, 5, '#5eb87a'); rect(396, 208 + sway, 14, 5, '#5eb87a');
    px(394, 196, C.pink, 3);
    // 猫
    rect(500, 232, 54, 14, '#7a5a8a'); rect(470, 226, 26, 20, C.cat); rect(466, 220, 20, 16, C.cat);
    rect(467, 216, 5, 6, C.cat); rect(480, 216, 5, 6, C.cat);
    const blink = Math.floor(frame / 60) % 8 === 0;
    px(471, 227, C.black); px(478, 227, C.black);
    if (blink) { rect(470, 227, 3, 1, C.cat); rect(477, 227, 3, 1, C.cat); }
    // 音响
    rect(216, 286, 38, 28, '#3a3a52'); rect(220, 290, 16, 16, '#22223a');
    const bar = 4 + (Math.floor(frame / 8) % 10);
    for (let i = 0; i < 5; i++) rect(222 + i * 3, 304 - Math.max(1, Math.min(12, bar - i * 2)), 2, Math.max(1, Math.min(12, bar - i * 2)), C.mint);
    rect(244, 292, 8, 4, C.gold); rect(244, 300, 8, 4, C.pink);
    // 问答桌牌
    rect(146, 304, 54, 34, C.woodDark); rect(148, 306, 50, 30, '#f5efe0');
    rect(152, 310, 42, 4, C.pink); rect(152, 318, 34, 3, '#c9bfae');
    // 地毯
    rect(180, 286, 200, 66, '#8b4a6a'); rect(186, 292, 188, 54, '#a85a7e');
    // 三扇门
    drawDoorBase(348, 116, 48, 80);
    px(371, 135, C.pink, 3); px(377, 135, C.pink, 3);
    drawDoorBase(676, 200, 36, 100, '#8b5a3c');
    rect(690, 240, 8, 8, C.mint);
    drawDoorBase(676, 60, 36, 80, '#6a8fd6');
    rect(690, 95, 8, 8, C.white);
    // 门牌
    rect(352, 100, 40, 12, C.pink);
    // 气球
    const bx = 630, by = 60;
    ['♥','♥','♥'].forEach((_, i) => {
      const cx = bx + (i - 1) * 16 + Math.sin(frame / 30) * 2, cy = by + i * 8;
      px(cx - 3, cy - 2, [C.pink, C.violet, C.gold][i], 3);
      rect(cx - 4, cy, 11, 4, [C.pink, C.violet, C.gold][i]);
      rect(cx, cy + 8, 1, 30, 'rgba(255,255,255,0.2)');
    });
  }

  // ===== 卧室 =====
  function drawBedroom() {
    drawBase('#7a5a72', '#463a5e');
    // 卧室窗户 + 星空
    rect(93, 31, 98, 66, C.woodDark); rect(96, 34, 92, 60, '#101a35');
    for (let i = 0; i < 30; i++) px(100 + (i * 31) % 84, 38 + (i * 17) % 52, (Math.floor(frame/20)+i)%4===0 ? C.white : '#8a9cc4');
    circle(166, 48, 8, '#ffe9a8'); rect(170, 41, 8, 15, '#101a35');
    rect(96, 63, 92, 2, C.woodDark); rect(141, 34, 2, 60, C.woodDark);
    rect(87, 27, 12, 74, '#c95b7f'); rect(191, 27, 12, 74, '#c95b7f');
    // 捕梦网
    circle(345, 55, 22, 'rgba(255,255,255,0.1)');
    ctx.strokeStyle = '#d9c8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(345, 55, 22, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(345, 55);
      ctx.lineTo(345 + Math.cos(a) * 20, 55 + Math.sin(a) * 20); ctx.stroke();
    }
    rect(345, 76, 1, 20, '#d9c8f0');
    px(345, 96, C.pink, 3);
    // 照片灯串
    for (let i = 0; i < 5; i++) {
      const lx = 400 + i * 18, ly = 40 + (i % 2) * 8;
      rect(lx, ly - 8, 1, 8, '#8a7aa0');
      rect(lx - 4, ly, 9, 11, '#f5efe0');
      rect(lx - 3, ly + 1, 7, 8, [C.pink, C.violet, C.gold, C.mint, C.blue][i]);
      if ((Math.floor(frame / 15) + i) % 3 === 0) rect(lx - 6, ly - 2, 13, 16, 'rgba(255,220,150,0.15)');
    }
    // 大床
    rect(92, 130, 200, 130, '#5e3a6a');
    rect(98, 136, 188, 118, '#7a4a86');
    // 床头板
    rect(88, 118, 208, 24, '#8b5a9c'); rect(92, 122, 200, 16, '#a06ab0');
    // 被子
    rect(104, 176, 176, 74, '#e88ab0');
    rect(110, 182, 164, 62, '#f2a0c0');
    // 格子花纹
    for (let x = 116; x < 274; x += 18) rect(x, 182, 2, 62, 'rgba(255,255,255,0.12)');
    for (let y = 190; y < 244; y += 14) rect(110, y, 164, 1, 'rgba(255,255,255,0.12)');
    // 枕头
    rect(112, 146, 56, 28, '#fff6f8'); rect(216, 146, 56, 28, '#fff6f8');
    // 情侣抱枕
    rect(124, 150, 30, 22, C.gold); px(134, 160, C.dark); px(144, 160, C.dark);
    rect(228, 150, 30, 22, C.violet); px(238, 160, C.dark); px(248, 160, C.dark);
    // 心形抱枕
    rect(176, 158, 28, 16, C.pink); px(180, 153, C.pink, 5); px(195, 153, C.pink, 5);
    // 床头柜
    rect(308, 190, 54, 60, C.woodDark); rect(311, 193, 48, 54, C.wood);
    rect(311, 210, 48, 3, C.woodDark); rect(311, 230, 48, 3, C.woodDark);
    // 台灯
    rect(330, 172, 8, 18, '#c9a86a'); rect(322, 160, 24, 12, '#ffe9a8');
    rect(320, 172, 28, 3, '#c9a86a');
    rect(318, 160, 32, 30, 'rgba(255,233,168,0.12)');
    // 闹钟
    rect(316, 214, 12, 12, C.pink); circle(322, 220, 6, '#fff'); px(322, 220, C.dark, 2);
    // 衣柜
    rect(470, 80, 110, 170, C.woodDark); rect(474, 84, 102, 162, C.wood);
    rect(524, 84, 2, 162, C.woodDark);
    rect(514, 150, 4, 10, C.gold); rect(532, 150, 4, 10, C.gold);
    // 衣柜上的小心
    px(505, 120, C.pink, 3); px(540, 120, C.pink, 3);
    // 情侣拖鞋
    rect(380, 344, 24, 12, C.pinkLight); rect(410, 344, 24, 12, C.violet);
    // 地毯
    rect(330, 330, 140, 40, '#5a4a7a');
    // 回客厅门
    drawDoorBase(640, 236, 44, 90);
    rect(650, 250, 24, 10, C.pink);
  }

  // ===== 厨房 =====
  function drawKitchen() {
    drawBase('#8a7a72', '#4a5a62');
    // 瓷砖墙
    for (let x = 0; x < W; x += 24) rect(x, 0, 1, 130, 'rgba(255,255,255,0.08)');
    for (let y = 0; y < 130; y += 20) rect(0, y, W, 1, 'rgba(255,255,255,0.08)');
    // 冰箱
    rect(40, 96, 66, 150, '#d9dde8'); rect(42, 98, 62, 70, '#eef1f7'); rect(42, 170, 62, 74, '#e4e8f0');
    rect(98, 110, 3, 18, '#9aa3b5'); rect(98, 190, 3, 22, '#9aa3b5');
    rect(48, 104, 20, 18, '#fff3a8'); rect(50, 108, 14, 2, '#c9b44a'); rect(50, 114, 12, 2, '#c9b44a');
    rect(74, 110, 14, 14, '#ffc4d6'); px(81, 117, C.pink, 3);
    rect(48, 184, 24, 18, '#c6f0e2');
    // 橱柜
    rect(130, 60, 140, 70, C.woodDark); rect(134, 64, 132, 62, C.wood);
    rect(198, 64, 2, 62, C.woodDark);
    rect(150, 90, 8, 3, C.gold); rect(240, 90, 8, 3, C.gold);
    // 橱柜上的碗
    for (let i = 0; i < 4; i++) { rect(140 + i * 14, 48, 10, 12, ['#fff','#ffe0e8','#e0f0ff','#fff0c0'][i]); }
    // 灶台
    rect(156, 210, 90, 70, '#3a3a52'); rect(160, 214, 82, 62, '#4a4a62');
    circle(180, 240, 14, '#222'); circle(222, 240, 14, '#222');
    rect(180, 226, 2, 10, '#ff8a3c'); rect(222, 226, 2, 10, '#ff8a3c');
    // 锅
    rect(172, 232, 16, 12, '#888'); rect(214, 232, 16, 12, '#888');
    // 抽油烟机
    rect(160, 170, 82, 20, '#9aa3b5'); rect(190, 190, 22, 12, '#6a7a8a');
    // 餐桌
    rect(330, 210, 120, 12, C.woodLight);
    rect(340, 222, 10, 50, C.woodDark); rect(430, 222, 10, 50, C.woodDark);
    // 桌布
    rect(336, 206, 108, 6, '#f0a0b8');
    // 桌上餐盘
    rect(350, 198, 24, 8, '#fff'); rect(400, 198, 24, 8, '#fff');
    rect(354, 194, 16, 4, '#c96a4a'); rect(404, 194, 16, 4, '#6a9c5a');
    // 花瓶
    rect(378, 184, 14, 20, '#8ac4f8'); px(385, 178, C.pink, 3); rect(382, 180, 6, 3, '#5eb87a');
    // 椅子
    rect(352, 274, 32, 8, C.wood); rect(358, 282, 6, 34, C.woodDark);
    rect(396, 274, 32, 8, C.wood); rect(402, 282, 6, 34, C.woodDark);
    // 咖啡机
    rect(530, 100, 60, 70, '#3a3a52'); rect(534, 104, 52, 62, '#555570');
    rect(540, 112, 24, 20, '#22223a'); rect(556, 138, 8, 16, '#c9a86a');
    rect(548, 154, 24, 6, '#fff');
    // 咖啡杯
    rect(540, 164, 10, 10, '#fff'); rect(556, 164, 10, 10, '#fff');
    // 食谱架
    rect(620, 70, 60, 80, C.woodDark);
    for (let i = 0; i < 3; i++) rect(624, 74 + i * 25, 52, 22, ['#fff3c0','#ffd8e4','#d8f0e4'][i]);
    // 情侣围裙
    rect(500, 250, 50, 60, C.pinkLight);
    rect(508, 258, 34, 30, '#fff');
    px(525, 270, C.pink, 3);
    rect(504, 244, 12, 8, C.pinkLight); rect(534, 244, 12, 8, C.pinkLight);
    // 回客厅门
    drawDoorBase(660, 300, 44, 80);
    rect(670, 315, 24, 10, C.mint);
  }

  // ===== 卫生间 =====
  function drawBathroom() {
    drawBase('#9aa8b8', '#6a7a8a');
    // 瓷砖
    for (let x = 0; x < W; x += 22) rect(x, 0, 1, 130, 'rgba(255,255,255,0.12)');
    for (let y = 0; y < 130; y += 22) rect(0, y, W, 1, 'rgba(255,255,255,0.12)');
    // 镜子
    rect(70, 40, 90, 90, C.woodDark); rect(74, 44, 82, 82, '#b8d4e8');
    rect(78, 48, 74, 74, '#c8e0f0');
    // 镜中反光
    rect(84, 54, 20, 40, 'rgba(255,255,255,0.25)');
    rect(120, 100, 26, 14, 'rgba(255,255,255,0.15)');
    // 洗手台
    rect(56, 180, 110, 60, '#e8e4e0'); rect(60, 184, 102, 20, '#f5f2ee');
    rect(100, 172, 8, 14, '#b8b0a8');
    // 水龙头
    rect(98, 164, 12, 6, '#b8b8c0'); rect(102, 170, 4, 6, '#b8b8c0');
    // 牙膏牙刷
    rect(70, 176, 20, 4, C.pink); rect(72, 172, 4, 6, C.mint); rect(78, 172, 4, 6, C.blue);
    // 浴缸
    rect(240, 200, 180, 100, '#e8e4e8'); rect(250, 210, 160, 80, '#b8d8e8');
    rect(256, 216, 148, 68, '#8ac4e0');
    // 泡泡
    for (let i = 0; i < 12; i++) {
      const bx = 262 + (i * 23) % 136, by = 224 + (i * 17) % 54;
      circle(bx, by, 3 + (i % 3) * 2, 'rgba(255,255,255,0.6)');
    }
    // 小黄鸭
    rect(270, 218, 20, 14, C.gold); circle(290, 220, 8, C.gold);
    px(292, 218, C.dark); rect(296, 222, 6, 3, '#ff8a3c');
    // 毛巾架
    rect(470, 70, 70, 90, '#b8b8c0');
    rect(478, 76, 24, 60, C.pinkLight); rect(508, 76, 24, 60, C.mint);
    rect(478, 76, 24, 8, C.pink); rect(508, 76, 24, 8, '#3ab8a0');
    // 绿植
    rect(570, 260, 50, 70, '#c8724a');
    rect(578, 240, 4, 22, '#4c9a6a'); rect(568, 246, 14, 5, '#5eb87a'); rect(586, 244, 14, 5, '#5eb87a');
    // 浴室便签
    rect(590, 60, 70, 60, '#fff3a8'); rect(596, 66, 58, 48, '#fff8d0');
    rect(600, 74, 44, 3, '#c9b44a'); rect(600, 84, 38, 3, '#c9b44a'); rect(600, 94, 42, 3, '#c9b44a');
    px(650, 112, C.pink, 3);
    // 回客厅门
    drawDoorBase(660, 300, 44, 80, '#6a8fd6');
    rect(670, 315, 24, 10, C.white);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (currentRoom === 'living') drawLiving();
    else if (currentRoom === 'bedroom') drawBedroom();
    else if (currentRoom === 'kitchen') drawKitchen();
    else if (currentRoom === 'bathroom') drawBathroom();
    drawHighlight(currentZone());
    drawPlayer();
  }

  const solidAreas = {
    living: [[60,178,200,250],[252,218,310,256],[380,190,428,256],[344,112,400,198],[592,96,670,184],[40,170,92,240]],
    bedroom: [[88,118,300,262],[304,186,366,254],[466,76,584,254],[636,232,690,330]],
    kitchen: [[36,92,110,250],[126,56,274,132],[152,166,250,282],[326,204,454,236],[526,96,594,174],[616,66,684,154],[656,296,708,384]],
    bathroom: [[66,36,164,134],[52,176,170,244],[236,196,424,304],[466,66,544,164],[566,256,624,334],[656,296,708,384]]
  };

  function isSolid(x, y) {
    if (x < 10 || x > W - 10 || y < 26 || y > H - 10) return true;
    return (solidAreas[currentRoom] || []).some(([x1, y1, x2, y2]) => x > x1 && x < x2 && y > y1 && y < y2);
  }

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
      const speed = 1.9;
      player.moving = true; player.step++;
      if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
      else player.dir = dy < 0 ? 'up' : 'down';
      const nx = player.x + dx * speed, ny = player.y + dy * speed;
      if (!isSolid(nx, player.y)) player.x = nx;
      if (!isSolid(player.x, ny)) player.y = ny;
    } else player.moving = false;
  }

  function loop() { update(); render(); requestAnimationFrame(loop); }
  loop();

  window.addEventListener('keydown', (event) => { keys[event.code] = true; });
  window.addEventListener('keyup', (event) => { keys[event.code] = false; });

  canvas.addEventListener('click', (event) => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (W / bounds.width);
    const y = (event.clientY - bounds.top) * (H / bounds.height);
    const zone = zones().find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);
    if (zone) window.dispatchEvent(new CustomEvent('zone-interact', { detail: zone.id }));
  });

  return {
    getZone: currentZone,
    getPlayer: () => player,
    setKey: (code, value) => { keys[code] = value; },
    setRoom,
    getRoom: () => currentRoom,
    W, H
  };
})();