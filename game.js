// ===== 像素情侣小屋 · 多房间引擎 =====
const PIXEL = (() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 720, H = 405;
  let scale = 1;
  let currentRoom = 'living';

  function resize() {
    const availW = Math.min(window.innerWidth - 24, 1400);
    const availH = Math.min(window.innerHeight - 200, 900);
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
  const partner = { x: 384, y: 352, dir: 'down', moving: false, step: 0, trail: [] };
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
      { id: 'coffee', x: 284, y: 226, w: 20, h: 14, label: '两杯咖啡', hint: '一起喝杯咖啡' },
      { id: 'plant', x: 400, y: 192, w: 44, h: 64, label: '盆栽', hint: '留言板' },
      { id: 'cat', x: 506, y: 224, w: 48, h: 42, label: '小猫', hint: '摸摸猫' },
      { id: 'radio', x: 252, y: 296, w: 38, h: 26, label: '音响', hint: '我们的音乐盒' },
      { id: 'trivia', x: 310, y: 300, w: 54, h: 30, label: '默契问答', hint: '情侣问答小游戏' },
      // 通往其他房间的门
      { id: 'door-bedroom', x: 348, y: 116, w: 48, h: 80, label: '卧室门', hint: '进入卧室', door: 'bedroom' },
      { id: 'door-kitchen', x: 676, y: 276, w: 36, h: 76, label: '厨房门', hint: '进入厨房', door: 'kitchen' },
      { id: 'door-bathroom', x: 676, y: 76, w: 36, h: 76, label: '卫生间门', hint: '进入卫生间', door: 'bathroom' }
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
    const entry = { living: [360, 380], bedroom: [620, 330], kitchen: [620, 350], bathroom: [620, 350] }[room];
    player.x = entry[0]; player.y = entry[1];
    partner.x = entry[0] + 26; partner.y = entry[1] + 10; partner.trail = [];
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

  // 像素主角：崇新（黑发大眼镜 + 吉他）、艺萌（长发 + 米色毛衣）
  function drawGuy(x, y, dir, bounce) {
    rect(x - 8, y + 13, 16, 3, 'rgba(0,0,0,0.28)');
    rect(x - 6, y + 6 + bounce, 5, 7, '#3c4258');
    rect(x + 1, y + 6 - bounce, 5, 7, '#3c4258');
    rect(x - 7, y - 4, 14, 12, '#f0f0f0');
    rect(x - 7, y - 4, 14, 2, '#d0d0d0');
    rect(x - 9, y - 2 + bounce, 2, 8, C.skin);
    rect(x + 7, y - 2 - bounce, 2, 8, C.skin);
    rect(x - 6, y - 17, 12, 11, C.skin);
    rect(x - 8, y - 19, 16, 6, '#24202a');
    rect(x - 7, y - 22, 14, 4, '#24202a');
    rect(x - 4, y - 17, 3, 3, '#24202a'); rect(x + 1, y - 17, 3, 3, '#24202a');
    rect(x - 5, y - 16, 5, 4, C.black); rect(x + 1, y - 16, 5, 4, C.black);
    rect(x - 1, y - 15, 2, 2, '#24202a');
    if (dir === 'down') { px(x - 2, y - 12, C.black); px(x + 2, y - 12, C.black); }
    // 斜挎吉他
    rect(x - 10, y - 2, 16, 4, '#8b5a3c');
    rect(x - 9, y - 5, 10, 10, '#b4784f');
    circle(x - 4, y, 3, '#5e3a2a');
    rect(x + 4, y - 8, 3, 16, '#5e3a2a');
  }

  function drawGirl(x, y, dir, bounce) {
    rect(x - 8, y + 13, 16, 3, 'rgba(0,0,0,0.28)');
    rect(x - 5, y + 6 + bounce, 4, 7, '#f6d3dd');
    rect(x + 1, y + 6 - bounce, 4, 7, '#f6d3dd');
    rect(x - 7, y - 4, 14, 12, '#f5e6d0');
    rect(x - 7, y - 3, 14, 3, '#e8d6bd');
    rect(x - 7, y + 6, 14, 3, '#e8d6bd');
    rect(x + 7, y - 2 - bounce, 2, 8, C.skin);
    rect(x - 8, y - 19, 16, 6, '#2e2430');
    rect(x - 6, y - 17, 12, 11, C.skin);
    rect(x - 9, y - 16, 3, 16, '#2e2430');
    rect(x + 6, y - 16, 3, 16, '#2e2430');
    rect(x - 5, y - 17, 4, 5, '#2e2430'); rect(x + 2, y - 17, 4, 5, '#2e2430');
    px(x - 3, y - 12, C.black); px(x + 3, y - 12, C.black);
    rect(x - 2, y - 8, 4, 1, '#c96b80');
    if (Math.floor(frame / 40) % 3 === 0) px(x + 9, y - 21, C.pink, 2);
  }

  function drawPlayers() {
    const guyBounce = player.moving ? (Math.floor(player.step / 4) % 2) : 0;
    const girlBounce = partner.moving ? (Math.floor(partner.step / 4) % 2) : 0;
    const guyFirst = player.y <= partner.y;
    const drawOne = (who, isGuy) => {
      const x = Math.round(who.x), y = Math.round(who.y);
      const bounce = isGuy ? guyBounce : girlBounce;
      if (isGuy) drawGuy(x, y, who.dir, bounce);
      else drawGirl(x, y, who.dir, bounce);
    };
    if (guyFirst) { drawOne(partner, false); drawOne(player, true); }
    else { drawOne(player, true); drawOne(partner, false); }
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

  // ===== 客厅（规整布局：墙面装饰对称，家具沿墙，中央留走道）=====
  function drawLiving() {
    drawBase();
    // 墙面横向装饰线（护墙板）
    rect(0, 96, W, 2, '#5a4878');
    rect(0, 100, W, 1, '#6a5688');
    for (let x = 16; x < W; x += 96) {
      rect(x, 104, 2, 22, '#4a3a68');
      rect(x, 104, 56, 2, '#4a3a68');
    }
    // ---- 墙面装饰（对称排列）----
    // LOVE 霓虹灯牌（左）
    rect(48, 16, 100, 38, '#241b35'); rect(50, 18, 96, 34, '#120e1c');
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
        for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') rect(58 + li * 18 + rx * 3, 22 + ry * 4, 3, 3, neonColor);
      });
    });
    // 日历（中左）
    rect(276, 12, 66, 44, C.woodDark); rect(278, 14, 62, 40, '#f5efe0');
    rect(278, 14, 62, 10, C.pink); rect(282, 16, 20, 3, '#fff');
    for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) px(282 + col * 8, 27 + row * 8, '#c9bfae');
    rect(334, 27, 9, 9, C.pink); rect(335, 28, 7, 7, '#f5efe0');
    // 挂钟（中）
    circle(390, 32, 15, C.woodDark); circle(390, 32, 12, '#f5efe0'); px(390, 32, C.dark, 2);
    const sec = Date.now() / 1000;
    px(390 + Math.sin(sec/3600*6.28)*5, 32 - Math.cos(sec/3600*6.28)*5, C.dark);
    px(390 + Math.sin(sec/60*6.28)*8, 32 - Math.cos(sec/60*6.28)*8, C.pink);
    // 地图（右）
    rect(486, 20, 82, 48, '#e8dcc0'); rect(488, 22, 78, 44, '#d8c8a4');
    rect(494, 30, 24, 14, '#8fae7a'); rect(502, 44, 12, 8, '#8fae7a');
    rect(532, 28, 28, 16, '#8fae7a'); rect(540, 44, 16, 10, '#8fae7a');
    [[506,38],[542,36],[550,54]].forEach(([dx,dy],i)=>{ if((Math.floor(frame/18)+i)%3!==0) px(dx,dy,C.pink,3); });
    // 照片墙（最右，2x3 整齐排列）
    const colors = [C.pink, C.violet, C.mint, C.gold, C.blue, C.pinkLight];
    for (let i = 0; i < 6; i++) {
      const fx = 596 + (i % 3) * 22, fy = 20 + Math.floor(i / 3) * 26;
      rect(fx - 1, fy - 1, 20, 23, '#f5efe0'); rect(fx, fy, 18, 17, colors[i]);
      px(fx + 5, fy + 4, C.dark); px(fx + 12, fy + 4, C.dark); rect(fx + 6, fy + 9, 7, 2, C.dark);
    }
    // 窗户（居中偏左，带窗帘）
    rect(170, 22, 100, 74, C.woodDark); rect(174, 26, 92, 66, '#141b36');
    for (let i = 0; i < 34; i++) {
      const sx = 178 + (i * 37) % 84, sy = 30 + (i * 19) % 56;
      px(sx, sy, (Math.floor(frame / 22) + i) % 4 === 0 ? C.white : '#8a9cc4');
    }
    circle(242, 42, 9, '#ffe9a8'); rect(247, 34, 9, 18, '#141b36');
    const meteor = Math.floor(frame / 6) % 120;
    if (meteor > 12 && meteor < 22) {
      const mx = 250 - (meteor - 12) * 5, my = 40 + (meteor - 12) * 2;
      px(mx, my, C.white); px(mx + 4, my - 1, '#a8c4ff');
    }
    rect(174, 58, 92, 2, C.woodDark); rect(219, 26, 2, 66, C.woodDark);
    rect(164, 20, 14, 80, '#a8436a'); rect(262, 20, 14, 80, '#a8436a');
    for (let i = 0; i < 6; i++) { rect(165 + i*2, 26 + i*12, 12, 3, '#c95b7f'); rect(263 + i*2, 26 + i*12, 12, 3, '#c95b7f'); }
    // ---- 地面家具（沿墙整齐摆放）----
    // 电视柜 + 电视（左侧墙面）
    rect(36, 86, 112, 76, C.black); rect(40, 90, 104, 66, '#1a2740');
    const beat = Math.floor(frame / 20) % 2;
    const heart = ['  XXX  XXX  ',' XXXXX XXXXX ','XXXXXXXXXXX',' XXXXXXXXX ','  XXXXXXX  ','   XXXXX   ','    XXX    ','     X     '];
    heart.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === 'X') px(93 + rx*1.5, 118 + beat + ry*2, C.pink, 2); });
    rect(42, 158, 102, 8, C.woodDark); rect(42, 166, 102, 4, C.wood);
    // 电视柜上的摆件
    rect(50, 150, 8, 8, C.violet); rect(120, 150, 8, 8, C.gold);
    // 街机（电视右侧，紧挨着）
    rect(36, 186, 48, 62, '#2a2a42'); rect(39, 189, 42, 30, '#141b36');
    px(56, 198, C.pink, 3); px(64, 198, C.pink, 3); rect(55, 201, 11, 3, C.pink);
    circle(49, 228, 3, C.pink); circle(60, 228, 3, C.mint); circle(71, 228, 3, C.gold);
    // 沙发（左侧，与电视相对）
    rect(60, 186, 140, 34, '#c95b7f'); rect(64, 190, 132, 26, '#e06a90');
    rect(54, 212, 16, 42, '#c95b7f'); rect(190, 212, 16, 42, '#c95b7f');
    rect(68, 224, 124, 22, '#f08cab'); rect(68, 244, 124, 6, '#c95b7f');
    rect(74, 214, 20, 20, C.gold); rect(166, 214, 20, 20, C.violet);
    rect(108, 230, 44, 16, '#fff0b3');
    // 茶几（沙发前，居中）
    rect(248, 236, 56, 5, C.woodLight); rect(256, 241, 40, 18, C.woodDark);
    rect(252, 226, 22, 11, '#fff6f8'); rect(254, 228, 18, 8, '#f0d8e4');
    // 茶几上的咖啡杯
    rect(284, 228, 10, 9, '#fff'); rect(292, 230, 3, 4, '#fff');
    // 音响（茶几下方整齐摆放）
    rect(252, 296, 38, 26, '#3a3a52'); rect(256, 300, 16, 16, '#22223a');
    const bar = 4 + (Math.floor(frame / 8) % 10);
    for (let i = 0; i < 5; i++) rect(258 + i*3, 314 - Math.max(1, Math.min(12, bar-i*2)), 2, Math.max(1, Math.min(12, bar-i*2)), C.mint);
    rect(280, 302, 8, 4, C.gold); rect(280, 310, 8, 4, C.pink);
    // 问答桌牌（音响右侧）
    rect(310, 300, 54, 30, C.woodDark); rect(312, 302, 50, 26, '#f5efe0');
    rect(316, 306, 42, 4, C.pink); rect(316, 314, 34, 3, '#c9bfae');
    // 中央地毯（走道区，明确分区）
    rect(180, 292, 200, 62, '#8b4a6a'); rect(186, 298, 188, 50, '#a85a7e');
    for (let x = 194; x < 370; x += 18) px(x, 322, 'rgba(255,255,255,0.15)', 2);
    // 盆栽（地毯右侧对称位置）
    rect(402, 234, 28, 26, '#c8724a'); const sway = Math.floor(frame / 18) % 2;
    rect(414, 206 + sway, 4, 26, '#4c9a6a'); rect(402, 216, 14, 5, '#5eb87a'); rect(418, 214 + sway, 14, 5, '#5eb87a');
    px(416, 202, C.pink, 3);
    // 猫窝（右侧，整齐靠墙）
    rect(500, 238, 54, 14, '#7a5a8a'); rect(492, 232, 54, 20, C.cat);
    rect(488, 226, 20, 16, C.cat); rect(489, 222, 5, 6, C.cat); rect(502, 222, 5, 6, C.cat);
    const blink = Math.floor(frame / 60) % 8 === 0;
    px(493, 233, C.black); px(500, 233, C.black);
    // 猫碗
    rect(560, 246, 14, 6, C.blue); rect(562, 244, 10, 3, '#8ac4f8');
    // 书架（右侧墙面）
    rect(596, 108, 70, 82, C.woodDark); rect(598, 110, 66, 78, C.wood);
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 114 + shelf * 26;
      rect(598, sy + 22, 66, 3, C.woodDark);
      for (let i = 0; i < 9; i++) {
        const bx = 600 + i * 7, bookH = 12 + ((i*3+shelf)%7);
        rect(bx, sy + 22 - bookH, 6, bookH, [C.pink,C.violet,C.mint,C.gold,C.blue,'#f0a060'][(i+shelf)%6]);
      }
    }
    // 书架顶摆件
    rect(606, 98, 12, 10, '#e8a0b8'); rect(630, 96, 10, 12, C.gold); rect(648, 98, 14, 10, '#f5efe0');
    // 冰箱（右侧墙面，带便签）
    rect(596, 204, 66, 148, '#d9dde8'); rect(599, 207, 60, 72, '#eef1f7'); rect(599, 281, 60, 68, '#e4e8f0');
    rect(650, 222, 3, 18, '#9aa3b5'); rect(650, 296, 3, 22, '#9aa3b5');
    rect(604, 214, 20, 18, '#fff3a8'); rect(630, 218, 16, 14, '#ffc4d6');
    rect(604, 292, 24, 20, '#c6f0e2');
    px(636, 296, C.pink, 3);
    // 三扇门（顶部居中 + 右侧，均匀分布）
    drawDoorBase(348, 116, 48, 80);
    rect(356, 132, 32, 4, C.pink);
    drawDoorBase(676, 76, 36, 76, '#6a8fd6');
    rect(688, 108, 12, 8, C.white);
    drawDoorBase(676, 276, 36, 76, '#8b5a3c');
    rect(688, 306, 12, 8, C.mint);
    // 吊灯（居中）
    rect(359, 0, 3, 18, C.woodDark); rect(350, 18, 22, 3, C.black);
    rect(354, 21, 14, 6, C.gold); rect(357, 27, 8, 3, '#ffe9a8');
    rect(340, 30, 42, 60, 'rgba(255,209,102,0.05)');
    // 角落气球（不遮挡）
    const bx = 690, by = 40;
    [C.pink, C.violet, C.gold].forEach((color, i) => {
      const cx = bx + (i-1)*13 + Math.sin(frame/30)*2, cy = by + i*8;
      px(cx-3, cy-2, color, 3); rect(cx-4, cy, 11, 4, color);
      rect(cx, cy+8, 1, 30, 'rgba(255,255,255,0.2)');
    });
    // 墙角绿植（填补空白）
    rect(340, 92, 22, 20, '#c8724a');
    rect(348, 78, 3, 14, '#4c9a6a'); rect(341, 82, 10, 4, '#5eb87a'); rect(352, 80, 10, 4, '#5eb87a');
  }
  function render() {
    ctx.clearRect(0, 0, W, H);
    if (currentRoom === 'living') drawLiving();
    else if (currentRoom === 'bedroom') drawBedroom();
    else if (currentRoom === 'kitchen') drawKitchen();
    else if (currentRoom === 'bathroom') drawBathroom();
    drawHighlight(currentZone());
    drawPlayers();
  }

  // ===== 卧室（对称墙面、床居中、衣物收纳靠墙）=====
  function drawBedroom() {
    drawBase('#7b5a68', '#423553');
    rect(0, 96, W, 2, '#5b4a70'); rect(0, 100, W, 1, '#6d5a84');
    for (let x = 20; x < W; x += 100) { rect(x, 104, 2, 20, '#514064'); rect(x, 104, 52, 2, '#514064'); }
    // 卧室窗户（左上，星月夜景）
    rect(92, 18, 100, 72, C.woodDark); rect(96, 22, 92, 64, '#101a38');
    for (let i = 0; i < 28; i++) { const sx = 100 + (i * 31) % 84, sy = 26 + (i * 17) % 54; px(sx, sy, (Math.floor(frame / 20) + i) % 4 === 0 ? C.white : '#8296c4'); }
    circle(160, 38, 8, '#ffe9a8'); rect(166, 31, 8, 16, '#101a38');
    rect(96, 54, 92, 2, C.woodDark); rect(141, 22, 2, 64, C.woodDark);
    rect(86, 16, 14, 78, '#b6507c'); rect(184, 16, 14, 78, '#b6507c');
    for (let i = 0; i < 6; i++) { rect(87 + i * 2, 22 + i * 12, 12, 3, '#d46c94'); rect(185 + i * 2, 22 + i * 12, 12, 3, '#d46c94'); }
    // 捕梦网（中上）
    circle(322, 40, 18, 'none');
    ctx.strokeStyle = '#e8d9b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(322, 40, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(306, 40); ctx.lineTo(322, 56); ctx.lineTo(338, 40); ctx.lineTo(322, 24); ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 5; i++) rect(313 + i * 4, 58 + (i % 2) * 6, 1, 10 + (i % 3) * 4, '#e8d9b0');
    // 照片灯（右上）
    rect(388, 20, 52, 46, C.woodDark); rect(390, 22, 48, 42, '#f5efe0');
    [C.pink, C.gold, C.mint, C.blue].forEach((color, i) => { const fx = 393 + (i % 2) * 23, fy = 25 + Math.floor(i / 2) * 20; rect(fx, fy, 20, 17, color); px(fx + 6, fy + 5, C.dark); px(fx + 13, fy + 5, C.dark); rect(fx + 7, fy + 11, 6, 2, C.dark); });
    rect(400, 66, 28, 3, '#ffd98a');
    // 天花板小吊灯（居中）
    rect(358, 0, 3, 16, C.woodDark); rect(348, 16, 22, 4, C.black); rect(352, 20, 14, 7, C.gold);
    rect(342, 27, 34, 50, 'rgba(255,209,102,0.04)');
    // 床（居中偏左，床头靠墙）
    rect(88, 112, 208, 22, '#6d4260'); rect(92, 116, 200, 16, '#925677');
    rect(88, 132, 208, 110, '#b06a8a'); rect(94, 138, 196, 96, '#d98aa7');
    rect(98, 142, 188, 26, '#f6e7ef');
    rect(104, 146, 74, 18, C.pinkLight); rect(206, 146, 74, 18, C.violet);
    px(130, 152, C.white, 3); px(248, 152, C.white, 3);
    rect(100, 174, 184, 54, '#f3d9e4'); rect(104, 178, 176, 46, '#fbeaf1');
    rect(100, 178, 184, 8, '#e8b8cd');
    rect(110, 232, 164, 6, '#a85a7e');
    // 床尾毯子上的心形
    const heartRows = [' XX XX ', 'XXXXXXX', ' XXXXX ', '  XXX  ', '   X   '];
    heartRows.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === 'X') px(168 + rx * 6, 188 + ry * 6, C.pink, 6); });
    // 床头柜（床右侧）
    rect(304, 176, 56, 66, C.woodDark); rect(308, 180, 48, 58, C.wood);
    rect(308, 198, 48, 3, C.woodDark); rect(308, 220, 48, 3, C.woodDark);
    rect(326, 184, 12, 12, '#e8a0b8'); rect(342, 188, 6, 8, C.gold);
    rect(310, 170, 16, 8, '#f5efe0'); px(314, 172, C.pink, 2);
    // 衣柜（右上靠墙）
    rect(466, 88, 118, 164, C.woodDark); rect(470, 92, 110, 156, '#7a4c36');
    rect(474, 96, 48, 148, '#8d5a40'); rect(528, 96, 48, 148, '#8d5a40');
    rect(518, 160, 4, 12, C.gold); rect(524, 160, 4, 12, C.gold);
    rect(480, 104, 36, 40, '#a06a4d'); rect(534, 104, 36, 40, '#a06a4d');
    rect(480, 152, 36, 40, '#a06a4d'); rect(534, 152, 36, 40, '#a06a4d');
    // 衣柜旁的穿衣镜
    rect(600, 108, 38, 112, C.gold); rect(604, 112, 30, 104, '#bcd8e8');
    rect(608, 120, 10, 30, 'rgba(255,255,255,0.3)');
    // 地毯 + 情侣拖鞋（中央走道）
    rect(330, 268, 130, 62, '#8b4a6a'); rect(336, 274, 118, 50, '#a85a7e');
    rect(354, 300, 22, 12, C.pink); rect(360, 296, 12, 6, C.pinkLight);
    rect(392, 300, 22, 12, C.blue); rect(398, 296, 12, 6, '#8ac4f8');
    // 回客厅的门（右侧，与其他房间一致）
    drawDoorBase(640, 240, 48, 82);
    rect(650, 258, 28, 4, C.pink);
    // 门边的收纳篮与绿植
    rect(606, 286, 30, 28, '#a87a52'); rect(610, 290, 22, 20, '#c99a6c');
    rect(614, 286, 14, 4, C.woodDark);
    rect(556, 256, 24, 22, '#c8724a'); rect(566, 240 + Math.floor(frame / 20) % 2, 3, 16, '#4c9a6a');
    rect(556, 246, 12, 4, '#5eb87a'); rect(568, 244, 12, 4, '#5eb87a');
    // 墙角爱心灯串（不遮挡）
    for (let i = 0; i < 5; i++) { const lx = 268 + i * 14, ly = 84 + Math.sin(i) * 4; px(lx, ly, i % 2 ? C.pink : C.gold, 3); }
  }

  // ===== 厨房（操作台靠墙、餐桌居中、动线清晰）=====
  function drawKitchen() {
    drawBase('#8a6a72', '#3c4a5a');
    rect(0, 96, W, 2, '#566475'); rect(0, 100, W, 1, '#6a7888');
    for (let x = 16; x < W; x += 92) { rect(x, 104, 2, 20, '#4a5868'); rect(x, 104, 52, 2, '#4a5868'); }
    // 冰箱（左侧靠墙）
    rect(36, 86, 72, 166, '#c9d4e0'); rect(40, 90, 64, 80, '#eef3f8'); rect(40, 174, 64, 74, '#dce5ee');
    rect(94, 110, 4, 20, '#9aa8b8'); rect(94, 190, 4, 24, '#9aa8b8');
    rect(46, 98, 20, 18, '#fff3a8'); rect(72, 104, 20, 16, '#ffc4d6');
    rect(46, 186, 26, 18, '#c6f0e2'); px(84, 190, C.pink, 3);
    // 橱柜（上墙整齐排列）
    rect(132, 52, 150, 68, '#6d4634'); rect(136, 56, 142, 60, '#8b5a3c');
    for (let i = 0; i < 3; i++) { const cx = 138 + i * 47; rect(cx, 56, 44, 60, '#9d6949'); rect(cx + 38, 80, 3, 12, C.gold); rect(cx + 6, 62, 32, 4, '#b47a54'); }
    // 灶台（橱柜下方）
    rect(140, 190, 126, 64, '#4a4a5a'); rect(144, 194, 118, 56, '#626274');
    circle(172, 212, 12, '#303040'); circle(172, 212, 7, C.pink);
    circle(234, 212, 12, '#303040'); circle(234, 212, 7, C.mint);
    rect(160, 236, 86, 4, '#8a8a9a');
    // 抽油烟机
    rect(158, 132, 90, 16, '#9aa8b8'); rect(166, 148, 74, 10, '#c9d4e0'); rect(176, 158, 54, 6, '#eef3f8');
    // 咖啡机（右侧操作台）
    rect(514, 100, 64, 74, '#3a3a52'); rect(518, 104, 56, 66, '#5a5a72');
    rect(524, 112, 44, 18, '#8ac4f8'); rect(532, 134, 28, 20, C.woodDark);
    rect(540, 154, 12, 12, '#f5efe0');
    // 食谱架（右上）
    rect(608, 58, 72, 96, C.woodDark); rect(612, 62, 64, 88, C.wood);
    [C.pink, C.gold, C.mint, C.blue].forEach((color, i) => { rect(616 + (i % 2) * 30, 66 + Math.floor(i / 2) * 42, 26, 36, color); px(622 + (i % 2) * 30, 74 + Math.floor(i / 2) * 42, C.dark, 2); });
    // 餐桌（中央，带桌布和两套餐具）
    rect(316, 204, 136, 12, '#6d4634'); rect(322, 216, 124, 8, C.wood);
    rect(328, 224, 112, 46, '#8b5a3c');
    rect(334, 226, 100, 42, '#f5efe0');
    rect(336, 228, 96, 8, C.pinkLight);
    rect(346, 240, 20, 14, '#fff'); rect(370, 240, 3, 6, '#fff');
    rect(416, 240, 20, 14, '#fff'); rect(440, 240, 3, 6, '#fff');
    rect(378, 238, 24, 18, '#e8a0b8'); px(384, 244, C.pink, 3);
    // 餐椅（餐桌两侧对称）
    rect(306, 220, 18, 58, '#6d4634'); rect(310, 224, 12, 24, '#8b5a3c');
    rect(444, 220, 18, 58, '#6d4634'); rect(448, 224, 12, 24, '#8b5a3c');
    // 情侣围裙（挂在墙上的衣钩）
    rect(496, 186, 40, 52, '#e8a0b8'); rect(502, 194, 28, 36, '#f6c8d8');
    rect(506, 186, 20, 8, '#e8a0b8');
    rect(506, 202, 20, 14, C.pink); rect(510, 206, 12, 6, C.white);
    rect(500, 178, 32, 4, C.woodDark);
    // 中央地砖花纹
    rect(190, 274, 120, 70, '#9a7880'); rect(196, 280, 108, 58, '#a98a90');
    for (let x = 204; x < 300; x += 24) px(x, 306, 'rgba(255,255,255,0.18)', 2);
    // 回客厅的门（右侧）
    drawDoorBase(652, 292, 44, 82);
    rect(662, 312, 24, 4, C.mint);
    // 垃圾桶和绿植（角落）
    rect(584, 288, 26, 38, '#7a8a9a'); rect(588, 292, 18, 30, '#9aa8b8');
    rect(590, 274 + Math.floor(frame / 24) % 2, 4, 14, '#4c9a6a'); rect(582, 280, 12, 4, '#5eb87a');
    // 挂钩上的小杯子
    [C.pink, C.mint, C.gold].forEach((color, i) => rect(132 + i * 22, 130, 14, 12, color));
  }

  // ===== 卫生间（洗漱台左侧、浴缸靠墙、毛巾整齐）=====
  function drawBathroom() {
    drawBase('#7c8b96', '#42586a');
    rect(0, 96, W, 2, '#5c7284'); rect(0, 100, W, 1, '#70889a');
    for (let x = 16; x < W; x += 92) { rect(x, 104, 2, 20, '#4f6678'); rect(x, 104, 52, 2, '#4f6678'); }
    // 墙面瓷砖纹理
    for (let y = 108; y < 130; y += 10) for (let x = 0; x < W; x += 30) rect(x, y, 28, 1, '#5e7486');
    // 镜子（左上）
    rect(66, 30, 96, 96, C.woodDark); rect(70, 34, 88, 88, '#bcd8e8');
    rect(76, 40, 26, 50, 'rgba(255,255,255,0.28)');
    rect(82, 100, 64, 8, '#d8ecf5');
    // 洗手台（镜子下方）
    rect(52, 176, 124, 16, '#e7eef4'); rect(58, 192, 112, 48, '#b8c8d4');
    rect(66, 200, 96, 32, '#d8e3ea');
    rect(106, 174, 12, 26, '#9aa8b8'); rect(102, 170, 20, 6, '#c9d4e0');
    px(112, 180, '#8ac4f8', 2);
    // 双色情侣牙刷杯
    rect(74, 162, 14, 14, C.pink); rect(94, 162, 14, 14, C.mint);
    rect(78, 150, 3, 12, C.white); rect(98, 150, 3, 12, C.white);
    // 浴缸（中右靠墙）
    rect(226, 188, 190, 118, '#d8e3ea'); rect(234, 196, 174, 102, '#eef4f8');
    rect(242, 204, 158, 86, '#b8d8e8');
    rect(242, 204, 158, 12, '#9ac4dc');
    // 泡泡
    for (let i = 0; i < 7; i++) circle(254 + i * 22, 208 + (i % 3) * 8, 6 + (i % 2) * 3, '#ffffff');
    // 小黄鸭
    const duckY = 206 + Math.sin(frame / 20) * 2;
    circle(268, duckY, 9, C.gold); circle(276, duckY - 7, 5, C.gold); px(279, duckY - 8, C.black);
    rect(260, duckY + 6, 16, 3, '#e8a020');
    // 浴缸边缘高光
    rect(234, 290, 174, 8, '#c9d8e2');
    // 毛巾架（右上整齐挂放）
    rect(456, 62, 78, 6, C.gold);
    rect(464, 68, 30, 56, C.pinkLight); rect(498, 68, 30, 56, '#8ac4f8');
    rect(466, 74, 26, 44, '#f6c8d8'); rect(500, 74, 26, 44, '#b8dcf8');
    rect(466, 98, 26, 4, C.white); rect(500, 98, 26, 4, C.white);
    // 浴室便签（镜子旁）
    rect(580, 52, 66, 60, '#fff3a8'); rect(584, 56, 58, 52, '#fff8d8');
    rect(590, 64, 46, 3, '#c9bfae'); rect(590, 74, 38, 3, '#c9bfae'); rect(590, 84, 42, 3, '#c9bfae');
    px(598, 96, C.pink, 4);
    // 绿植（角落）
    rect(560, 258, 34, 36, '#c8724a'); rect(574, 238 + Math.floor(frame / 22) % 2, 3, 20, '#4c9a6a');
    rect(562, 244, 14, 5, '#5eb87a'); rect(578, 242, 14, 5, '#5eb87a');
    // 中央浴室垫
    rect(190, 310, 110, 46, '#b884a0'); rect(196, 316, 98, 34, '#d7a6bf');
    for (let x = 204; x < 290; x += 18) px(x, 332, 'rgba(255,255,255,0.22)', 2);
    // 回客厅的门（右侧）
    drawDoorBase(652, 292, 44, 82, '#6a8fd6');
    rect(662, 312, 24, 4, C.white);
    // 墙角小灯
    rect(424, 20, 3, 14, C.woodDark); rect(418, 34, 15, 6, C.gold);
    rect(412, 40, 27, 34, 'rgba(255,209,102,0.05)');
  }

  const solidAreas = {
    living: [[36,86,148,170],[36,186,84,248],[60,186,206,250],[248,226,304,259],[252,296,290,322],[310,300,364,330],[400,206,432,260],[488,226,562,256],[596,108,666,190],[596,204,662,352],[340,92,362,112]],
    bedroom: [[88,112,296,242],[304,176,360,242],[466,88,584,252],[600,108,638,220],[606,286,636,314],[556,256,580,278],[640,240,688,322]],
    kitchen: [[36,86,108,252],[132,52,282,120],[140,190,266,254],[158,132,248,164],[514,100,578,174],[608,58,680,154],[316,204,462,278],[306,220,324,278],[444,220,462,278],[496,186,536,238],[584,288,610,326],[652,292,696,374]],
    bathroom: [[66,30,162,126],[52,176,176,240],[226,188,416,306],[456,62,534,124],[580,52,646,112],[560,258,594,294],[652,292,696,374]]
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
      // 艺萌跟随：沿着崇新走过的路走，保持一点距离
      if (dx || dy) {
        partner.trail.push([player.x, player.y]);
        if (partner.trail.length > 36) partner.trail.shift();
      }
      const target = partner.trail.length ? partner.trail[0] : [player.x - 24, player.y + 8];
      const pdx = target[0] - partner.x, pdy = target[1] - partner.y;
      const pdist = Math.hypot(pdx, pdy);
      if (pdist > 3) {
        const pspeed = Math.min(2.0, pdist);
        const nx2 = partner.x + pdx / pdist * pspeed;
        const ny2 = partner.y + pdy / pdist * pspeed;
        if (!isSolid(nx2, partner.y)) partner.x = nx2;
        if (!isSolid(partner.x, ny2)) partner.y = ny2;
        partner.dir = Math.abs(pdx) > Math.abs(pdy) ? (pdx < 0 ? 'left' : 'right') : (pdy < 0 ? 'up' : 'down');
        partner.moving = true; partner.step++;
        if (pdist < 8 && partner.trail.length) partner.trail.shift();
      } else partner.moving = false;
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
