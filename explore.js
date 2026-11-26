/* ===== 探索扩展：阳台 / 书房 / 秘密阁楼 + 隐藏收藏 + 暗门 =====
   借鉴 GitHub 上像素探索游戏常用的“找隐藏物件 → 拿钥匙 → 解锁新区域”玩法。 */
(() => {
  'use strict';

  const SAVE_KEY = 'love-explore-v1';
  const S = (() => {
    const empty = { found: {}, atticOpen: false, steps: 0 };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(empty, JSON.parse(raw));
    } catch {}
    return empty;
  })();
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };
  const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const COLLECTIBLES = [
    { id: 'ticket', icon: '🎬', name: '电影票根', room: 'living', x: 148, y: 290, story: '第一场一起看的电影，票根我一直夹在书里。' },
    { id: 'shell', icon: '🐚', name: '海边贝壳', room: 'living', x: 470, y: 330, story: '那天海风很大，你弯腰捡起它，说要把海带回家。' },
    { id: 'note', icon: '📝', name: '手写便签', room: 'living', x: 560, y: 260, story: '“记得买草莓牛奶。”——你的字，一眼就认得。' },
    { id: 'hairpin', icon: '🎀', name: '小发卡', room: 'bedroom', x: 528, y: 302, story: '你落在沙发上的那只发卡，我偷偷收进了抽屉。' },
    { id: 'key', icon: '🗝️', name: '阁楼钥匙', room: 'bedroom', x: 596, y: 336, story: '藏在收纳篮后面的一把小钥匙，上面系着粉色丝带。' },
    { id: 'recipe-card', icon: '🍓', name: '草莓食谱', room: 'kitchen', x: 308, y: 120, story: '你说要做给我吃的草莓蛋糕，配方还贴在橱柜上。' },
    { id: 'duckling', icon: '🦆', name: '小黄鸭队伍', room: 'bathroom', x: 200, y: 356, story: '洗澡时你总把小黄鸭排成一队，说它们是我们的家人。' },
    { id: 'star-jar', icon: '⭐', name: '星星玻璃瓶', room: 'balcony', x: 214, y: 330, story: '我们一起把捡到的“星星”装进瓶子，说这是我们的银河。' },
    { id: 'plant-tag', icon: '🌱', name: '植物名牌', room: 'balcony', x: 524, y: 336, story: '你给每盆植物都取了名字，最大的那盆叫“崇新”。' },
    { id: 'pen', icon: '🖊️', name: '你的旧钢笔', room: 'study', x: 486, y: 304, story: '笔帽上有小小的牙印，是你在想事情时的习惯。' },
    { id: 'photo-corner', icon: '📸', name: '照片边角', room: 'study', x: 300, y: 320, story: '一张被裁下来的照片边角，背面写着“要一直在一起”。' },
    { id: 'letter', icon: '💌', name: '泛黄的信', room: 'attic', x: 388, y: 364, story: '很多年前写给未来的信，原来未来真的如约而至。' }
  ];

  const byId = id => COLLECTIBLES.find(item => item.id === id);
  const toast = text => {
    const el = document.getElementById('toast-text');
    const box = document.getElementById('zone-toast');
    if (!el || !box) return;
    el.textContent = text;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('show'), 2200);
  };

  function collect(id) {
    const item = byId(id);
    if (!item) return;
    const isNew = !S.found[id];
    S.found[id] = true;
    if (id === 'key') S.atticOpen = true;
    save();
    if (window.Quest) {
      window.Quest.burst(window.innerWidth / 2, window.innerHeight / 2, 36, { size: 8, power: 4, up: 2 });
      if (isNew) window.Quest.notify('collect-' + id);
    }
    playTone(880); setTimeout(() => playTone(1175), 110);
    const isKey = id === 'key';
    openModal({
      badge: item.icon,
      eyebrow: isKey ? 'KEY FOUND · 新区域解锁' : (isNew ? 'COLLECTIBLE FOUND' : '已收集'),
      title: `${item.name}${isNew ? ' ♥' : ''}`,
      body: `<p class="quote">${escapeHtml(item.story)}</p>
        <p style="color:var(--gold);font-size:0.8rem">${isKey ? '卧室的暗门打开了！书架后面藏着通往阁楼的楼梯。' : `已收集 ${Object.keys(S.found).length} / ${COLLECTIBLES.length} 件小物`}</p>`
    });
    refreshBadge();
  }

  function register() {
    // 每个房间放几件可捡的小物，只有走近才会发光并可互动。
    const roomItems = {};
    COLLECTIBLES.forEach(item => {
      (roomItems[item.room] || (roomItems[item.room] = [])).push(item);
    });
    Object.entries(roomItems).forEach(([room, items]) => {
      PIXEL.registerZones(room, items.map(item => ({
        id: 'collect-' + item.id,
        x: item.x - 12, y: item.y - 12, w: 24, h: 24,
        label: item.icon + ' ' + item.name,
        hint: S.found[item.id] ? '已经收好了' : '好像藏着什么小东西…'
      })));
      PIXEL.registerDraw(room, () => {
        const frame = PIXEL.draw.frame;
        items.forEach((item, index) => {
          if (S.found[item.id] && item.id !== 'key' && item.id !== 'letter') return;
          const bounce = Math.sin(frame / 12 + index) * 2;
          const glow = 0.35 + 0.25 * Math.sin(frame / 9 + index);
          PIXEL.draw.circle(item.x, item.y + bounce, 13, `rgba(255,209,102,${glow})`);
          PIXEL.draw.rect(item.x - 7, item.y - 8 + bounce, 14, 14, '#fff6f8');
          PIXEL.draw.rect(item.x - 6, item.y - 7 + bounce, 12, 12, '#ffd166');
          PIXEL.draw.px(item.x - 2, item.y - 3 + bounce, '#1a1426', 2);
          PIXEL.draw.px(item.x + 2, item.y - 3 + bounce, '#1a1426', 2);
        });
      });
    });

    // 阳台：客厅左下新增玻璃门区域。
    PIXEL.registerZones('living', [
      { id: 'door-balcony', x: 40, y: 268, w: 44, h: 92, label: '阳台玻璃门', hint: '推开阳台门', door: 'balcony' },
      { id: 'door-study', x: 676, y: 176, w: 36, h: 76, label: '书房门', hint: '进入书房', door: 'study' }
    ]);

    // 阳台场景：夜空、城市灯、花盆、星星瓶、两把椅子。
    PIXEL.registerDraw('balcony', () => {
      const d = PIXEL.draw, C = d.colors, frame = d.frame;
      d.rect(0, 0, 720, 130, '#101a38');
      for (let i = 0; i < 56; i++) {
        const x = (i * 83) % 706 + 7, y = (i * 37) % 112 + 8;
        const twinkle = (Math.floor(frame / 18) + i) % 5 === 0;
        d.px(x, y, twinkle ? C.white : '#8fa8d8', twinkle ? 2 : 1);
      }
      d.circle(590, 44, 24, '#ffe9a8');
      d.rect(580, 30, 28, 28, '#101a38');
      for (let x = 0; x < 720; x += 44) {
        const h = 30 + ((x * 7) % 58);
        d.rect(x, 130 - h, 40, h, '#263256');
        for (let wy = 138 - h; wy < 126; wy += 12) for (let wx = x + 5; wx < x + 36; wx += 11) {
          if ((wx + wy + Math.floor(frame / 24)) % 4 !== 0) d.px(wx, wy, '#ffd166', 2);
        }
      }
      d.rect(0, 130, 720, 4, C.woodDark);
      d.rect(0, 134, 720, 271, '#6a5a6a');
      for (let x = 10; x < 720; x += 40) d.rect(x, 140, 2, 260, '#7a6a7a');
      for (let y = 170; y < 405; y += 34) d.rect(0, y, 720, 2, '#7a6a7a');
      d.rect(0, 26, 14, 379, C.woodDark); d.rect(706, 26, 14, 379, C.woodDark);
      d.rect(14, 28, 692, 3, '#bcd8e8');
      // 两把椅子和小圆桌
      d.rect(100, 242, 70, 12, C.pink); d.rect(108, 254, 8, 44, C.woodDark); d.rect(154, 254, 8, 44, C.woodDark);
      d.rect(260, 242, 70, 12, C.blue); d.rect(268, 254, 8, 44, C.woodDark); d.rect(314, 254, 8, 44, C.woodDark);
      d.rect(212, 236, 6, 52, C.woodDark); d.circle(215, 232, 22, C.wood); d.circle(215, 232, 18, '#b4784f');
      // 花盆区
      for (let i = 0; i < 4; i++) {
        const x = 440 + i * 62;
        d.rect(x, 280, 34, 34, '#c8724a'); d.rect(x + 4, 284, 26, 26, '#e0946c');
        d.rect(x + 15, 260 + Math.floor(frame / 22) % 2, 3, 22, '#4c9a6a');
        d.rect(x + 6, 264, 12, 5, '#5eb87a'); d.rect(x + 20, 262, 12, 5, '#5eb87a');
      }
      // 回客厅的门
      d.rect(644, 186, 52, 94, C.woodDark); d.rect(648, 190, 44, 86, '#9d6949');
      d.rect(656, 200, 28, 66, '#b8dcf8'); d.rect(660, 204, 20, 58, 'rgba(255,255,255,0.25)');
      d.px(688, 236, C.gold, 3);
    });
    PIXEL.registerZones('balcony', [
      { id: 'door-living-balcony', x: 644, y: 186, w: 52, h: 94, label: '回客厅', hint: '回到客厅', door: 'living' },
      { id: 'balcony-chairs', x: 100, y: 236, w: 230, h: 62, label: '阳台小桌椅', hint: '坐下来看看夜景' },
      { id: 'balcony-railing', x: 14, y: 130, w: 692, h: 20, label: '阳台栏杆', hint: '看看远处的灯火' }
    ]);
    PIXEL.registerSolids('balcony', [[100, 236, 170, 298], [260, 236, 330, 298], [193, 210, 237, 288], [440, 260, 690, 314], [644, 186, 696, 280]]);

    // 书房：书架、书桌、地球仪、照片墙。
    PIXEL.registerDraw('study', () => {
      const d = PIXEL.draw, C = d.colors, frame = d.frame;
      d.rect(0, 0, 720, 130, '#3c3550');
      d.rect(0, 96, 720, 2, '#5b4d6a');
      d.rect(0, 130, 720, 275, '#7a5a4a');
      for (let x = 0; x < 720; x += 36) d.rect(x, 134, 2, 267, '#8a6a58');
      // 整面书架
      d.rect(30, 30, 220, 186, C.woodDark); d.rect(36, 36, 208, 174, '#8b5a3c');
      for (let shelf = 0; shelf < 3; shelf++) {
        const sy = 48 + shelf * 54;
        d.rect(36, sy + 46, 208, 4, C.woodDark);
        const palette = [C.pink, C.gold, C.mint, C.blue, C.violet];
        for (let i = 0; i < 13; i++) d.rect(42 + i * 15, sy + (i % 3) * 4, 11, 38 - (i % 3) * 4, palette[(i + shelf) % palette.length]);
      }
      // 书桌与台灯
      d.rect(400, 216, 190, 14, C.woodDark); d.rect(408, 230, 174, 56, '#8b5a3c');
      d.rect(470, 184, 6, 32, C.woodDark); d.rect(452, 172, 42, 12, C.gold);
      d.rect(446, 184, 54, 40, 'rgba(255,209,102,0.07)');
      // 地球仪
      d.circle(634, 232, 26, '#5aa0d8'); d.circle(626, 224, 8, '#5eb87a'); d.rect(630, 258, 8, 18, C.woodDark);
      // 照片墙
      for (let i = 0; i < 6; i++) {
        const x = 286 + (i % 3) * 56, y = 40 + Math.floor(i / 3) * 58;
        d.rect(x, y, 46, 48, '#fff6f8'); d.rect(x + 3, y + 3, 40, 42, [C.pink, C.blue, C.mint, C.gold, C.violet, C.pinkLight][i]);
        d.px(x + 18, y + 16, C.dark, 3); d.rect(x + 14, y + 26, 18, 9, 'rgba(0,0,0,0.25)');
      }
      // 回客厅的门
      d.rect(654, 288, 44, 82, C.woodDark); d.rect(658, 292, 36, 74, '#9d6949'); d.px(686, 332, C.gold, 3);
      // 暗门：收集钥匙后才会显现
      if (S.atticOpen) {
        const pulse = 0.4 + 0.3 * Math.sin(frame / 8);
        d.rect(262, 132, 60, 80, `rgba(167,139,250,${pulse})`);
        d.rect(268, 138, 48, 68, '#2e2645');
        d.rect(282, 152, 20, 40, C.gold); d.px(292, 172, C.dark, 3);
      }
    });
    PIXEL.registerZones('study', [
      { id: 'door-living-study', x: 654, y: 288, w: 44, h: 82, label: '回客厅', hint: '回到客厅', door: 'living' },
      { id: 'study-desk', x: 400, y: 176, w: 190, h: 106, label: '书桌', hint: '写点什么吧' },
      { id: 'study-globe', x: 608, y: 204, w: 52, h: 70, label: '地球仪', hint: '想去的地方' },
      { id: 'study-books', x: 30, y: 30, w: 220, h: 186, label: '书架', hint: '我们的书和回忆' }
    ]);
    PIXEL.registerSolids('study', [[30, 30, 250, 216], [400, 166, 590, 286], [608, 204, 660, 276], [654, 288, 698, 370]]);
    if (S.atticOpen) PIXEL.registerZones('study', [
      { id: 'door-attic', x: 262, y: 132, w: 60, h: 80, label: '秘密阁楼入口', hint: '推开暗门，上楼', door: 'attic' }
    ]);

    // 阁楼：旧时光、星星灯、藏着信的木箱。
    PIXEL.registerDraw('attic', () => {
      const d = PIXEL.draw, C = d.colors, frame = d.frame;
      d.rect(0, 0, 720, 405, '#2e2645');
      // 木梁与斜屋顶
      d.rect(0, 0, 720, 8, C.woodDark);
      for (let x = 40; x < 720; x += 140) { d.rect(x, 0, 8, 120, '#5e3a2a'); d.rect(x, 120, 8, 100, '#5e3a2a'); }
      d.rect(0, 112, 720, 6, '#5e3a2a');
      // 星星灯串
      for (let i = 0; i < 18; i++) {
        const x = 20 + i * 40, y = 124 + Math.sin(i * 1.4 + frame / 30) * 8;
        d.px(x, y, i % 2 ? C.pink : C.gold, 3);
        d.rect(x, y + 3, 1, 8, 'rgba(255,255,255,0.15)');
      }
      // 地板
      d.rect(0, 250, 720, 155, '#6d4b5a');
      for (let x = 10; x < 720; x += 46) d.rect(x, 250, 2, 155, '#5a3d49');
      // 旧木箱与泛黄的信
      d.rect(300, 290, 170, 60, C.woodDark); d.rect(308, 296, 154, 46, '#8b5a3c');
      d.rect(308, 314, 154, 4, C.woodDark); d.px(382, 318, C.gold, 4);
      // 摇椅
      d.rect(90, 240, 90, 12, '#a06a4d'); d.rect(98, 252, 10, 42, '#7a4c36'); d.rect(162, 252, 10, 42, '#7a4c36');
      // 旧相册堆
      for (let i = 0; i < 4; i++) d.rect(548 + i * 3, 300 - i * 5, 60, 8, ['#fff6f8', C.pinkLight, C.gold, C.violet][i]);
      // 阁楼细节：窗、旧纸箱、乐器、灯串、猫窝
      d.rect(232, 22, 76, 82, C.woodDark); d.rect(238, 28, 64, 70, '#101a38');
      for (let i = 0; i < 18; i++) d.px(242 + (i * 29) % 56, 32 + (i * 17) % 60, i % 4 === 0 ? C.white : '#8296c4');
      d.circle(280, 48, 9, '#ffe9a8'); d.rect(286, 42, 18, 18, '#101a38');
      d.rect(266, 28, 2, 70, C.woodDark); d.rect(238, 60, 64, 2, C.woodDark);
      [384, 422, 460].forEach((x, i) => {
        d.rect(x, 188, 30, 26, ['#a87a52', '#c99a6c', '#8b5a3c'][i]);
        d.rect(x + 2, 190, 26, 4, '#d9b58c'); d.rect(x + 12, 200, 6, 14, C.woodDark);
      });
      d.rect(508, 214, 8, 40, '#8b5a3c'); d.rect(500, 204, 24, 14, '#6d4634');
      d.rect(512, 180, 5, 30, '#c9a46a'); d.rect(508, 174, 14, 10, '#e0bc82');
      d.rect(88, 296, 62, 26, '#c47a96'); d.circle(118, 300, 13, '#e8a0b8');
      d.px(112, 298, C.dark, 2); d.px(124, 298, C.dark, 2);
      // 回书房的梯子口
      d.rect(634, 288, 52, 82, '#5e3a2a'); d.rect(642, 296, 36, 66, '#2e2645');
      d.rect(650, 304, 20, 50, 'rgba(167,139,250,0.25)'); d.px(668, 334, C.gold, 3);
    });
    PIXEL.registerZones('attic', [
      { id: 'door-study-attic', x: 634, y: 288, w: 52, h: 82, label: '回书房', hint: '下楼回书房', door: 'study' },
      { id: 'attic-chest', x: 300, y: 290, w: 170, h: 60, label: '旧木箱', hint: '藏着一封泛黄的信' },
      { id: 'attic-chair', x: 90, y: 240, w: 90, h: 54, label: '旧摇椅', hint: '坐一会儿吧' },
      { id: 'attic-albums', x: 548, y: 280, w: 78, h: 46, label: '旧相册', hint: '翻翻从前的照片' }
    ]);
    PIXEL.registerSolids('attic', [[300, 290, 470, 350], [90, 240, 180, 294], [548, 280, 626, 326], [634, 288, 686, 370]]);
  }

  register();

  // 把新房间和彩蛋接进现有的房间名和彩蛋计数。
  const ROOM_NAMES = {
    balcony: '阳台 · BALCONY', study: '书房 · STUDY', attic: '秘密阁楼 · SECRET ATTIC'
  };
  window.addEventListener('room-change', event => {
    const name = ROOM_NAMES[event.detail];
    if (!name) return;
    const roomLabel = name.split(' · ')[0];
    const toast = document.getElementById('zone-toast');
    const text = document.getElementById('toast-text');
    if (toast && text) {
      text.textContent = `欢迎来到${roomLabel} ♡`;
      toast.classList.add('show');
      clearTimeout(window.roomToastTimer);
      window.roomToastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    }
    const roomName = document.getElementById('room-name');
    if (roomName) roomName.textContent = name;
  });

  const EXTRA_HANDLERS = {
    'door-balcony': () => PIXEL.setRoom('balcony'),
    'door-study': () => PIXEL.setRoom('study'),
    'door-attic': () => PIXEL.setRoom('attic'),
    'door-living-balcony': () => PIXEL.setRoom('living'),
    'door-living-study': () => PIXEL.setRoom('living'),
    'door-study-attic': () => PIXEL.setRoom('study'),
    'balcony-chairs': () => openModal({ badge: '☕', title: '阳台上的两个座位',
      body: `<p class="quote">晚风吹过来的时候，我们坐着聊了很久。</p><p>你说这里适合放两杯热可可，我说适合和你一起发呆。</p>` }),
    'balcony-railing': () => openModal({ badge: '✦', title: '远处的灯火',
      body: `<p class="quote">城市那么大，幸好我一眼就能找到你。</p><p>每一盏亮着的窗后面，都是一个普通又珍贵的夜晚。</p>` }),
    'study-desk': () => openModal({ badge: '✎', title: '书房的书桌',
      body: `<p class="quote">这张桌子上，写过我们的计划，也写过停电时的小纸条。</p><p>以后我们的故事，也继续在这里慢慢写下去吧。</p>` }),
    'study-globe': () => openModal({ badge: '🌍', title: '地球仪',
      body: `<p class="quote">想去的地方很多，但最想去的，是你所在的方向。</p><p>以后我们去一个一个地方，把这个地球仪转满一圈 ♥</p>` }),
    'study-books': () => openModal({ badge: '📚', title: '我们的书架',
      body: `<p class="quote">书页里夹着票根、便签和你的小秘密。</p><p>等以后，我们把一起读过的每一本书都摆上来。</p>` }),
    'attic-chest': () => openModal({ badge: '📦', title: '阁楼里的旧木箱',
      body: `<p class="quote">原来有些东西，放着放着就变成了宝贝。</p><p>角落里那封泛黄的信，好像在等我们拆开。</p>` }),
    'attic-chair': () => openModal({ badge: '☾', title: '旧摇椅',
      body: `<p class="quote">你坐上去的时候，笑着说像是old movie里的主角。</p><p>我说，那我们就是这部电影里，一直在一起的两个人。</p>` }),
    'attic-albums': () => openModal({ badge: '📖', title: '旧相册',
      body: `<p class="quote">照片会旧，但那天的心情还是新的。</p><p>以后每一年，我们都要拍很多很多张 ♥</p>` })
  };
  COLLECTIBLES.forEach(item => {
    EXTRA_HANDLERS['collect-' + item.id] = () => collect(item.id);
  });
  Object.assign(handlers, EXTRA_HANDLERS);

  // 房间名表用 Object.assign，避免覆盖脚本里已定义的名字。
  Object.assign(zoneNames, {
    'door-balcony': '阳台玻璃门', 'door-study': '书房门', 'door-attic': '秘密阁楼入口',
    'door-living-balcony': '回客厅', 'door-living-study': '回客厅', 'door-study-attic': '回书房',
    'balcony-chairs': '阳台小桌椅', 'balcony-railing': '阳台栏杆',
    'study-desk': '书桌', 'study-globe': '地球仪', 'study-books': '书架',
    'attic-chest': '旧木箱', 'attic-chair': '旧摇椅', 'attic-albums': '旧相册'
  });
  COLLECTIBLES.forEach(item => { zoneNames['collect-' + item.id] = item.name; });

  function refreshBadge() {
    const count = Object.keys(S.found).length;
    const el = document.getElementById('found-count');
    if (!el) return;
    el.textContent = `✦ 已发现 ${found.size} / ${Object.keys(zoneNames).length} 个彩蛋 · 🧩 ${count}/${COLLECTIBLES.length} 收藏`;
  }

  function openCollection() {
    openModal({
      badge: '🧩', eyebrow: 'HIDDEN COLLECTIBLES', title: '我们的收藏册',
      body: `<p class="quote">那些不起眼的小东西，都是我们故事的证据 ♥</p>
        <div class="collect-grid">${COLLECTIBLES.map(item => {
          const got = Boolean(S.found[item.id]);
          return `<div class="collect-item ${got ? 'got' : ''}">
            <span class="collect-icon">${got ? item.icon : '◌'}</span>
            <strong>${got ? escapeHtml(item.name) : '???'}</strong>
            <small>${got ? escapeHtml(item.story) : '藏在某个角落'}</small>
          </div>`;
        }).join('')}</div>`
    });
    playTone(880);
  }

  window.Explore = { openCollection, collectibles: COLLECTIBLES, state: S, refreshBadge };

  // 收藏册入口（收藏 HUD 之外，也放一个在客厅里，走近按互动键即可打开）。

  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', () => setTimeout(() => {
    if (document.getElementById('hud-collect')) return;
    const btn = document.createElement('button');
    btn.id = 'hud-collect';
    btn.className = 'hud-btn collect-btn';
    btn.title = '隐藏收藏册';
    btn.innerHTML = '🧩 <span>收藏</span>';
    btn.addEventListener('click', openCollection);
    const level = document.getElementById('hud-level');
    if (level) level.before(btn);
    refreshBadge();
  }, 160));

  // 客厅里的书架旁挂一本收藏册，走近也能打开。
  PIXEL.registerZones('living', [
    { id: 'open-collection', x: 560, y: 196, w: 30, h: 30, label: '收藏册', hint: '查看收集到的小物' }
  ]);
  PIXEL.registerDraw('living', () => {
    const d = PIXEL.draw, C = d.colors, frame = d.frame;
    d.rect(572, 204, 18, 22, C.pink); d.rect(575, 207, 12, 16, '#fff6f8');
    d.px(581, 212, C.dark, 2); d.px(581, 216, C.dark, 2);
    d.circle(581, 214, 16 + Math.sin(frame / 10) * 3, `rgba(255,92,138,${0.2 + 0.1 * Math.sin(frame / 10)})`);
  });
  EXTRA_HANDLERS['open-collection'] = openCollection;
  zoneNames['open-collection'] = '收藏册';
})();
