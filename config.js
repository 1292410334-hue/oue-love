// ===== 想改内容，只改这个文件就够了 =====
const CONFIG = {
  // 两个人的名字
  nameA: "吕崇新",
  nameB: "项艺萌",

  // 在一起的日子：年, 月(从0开始，7月写6), 日, 时, 分
  startDate: [2025, 6, 8, 0, 0],

  // 首页打字机依次打出的文字
  typewriter: [
    "艺萌，遇见你的每一天都好可爱。",
    "这个小小网站，是我们的专属角落。"
  ],

  // 点按钮随机蹦出的情话
  loveLines: [
    "今天的你，也在我心里冒泡泡。🫧",
    "想和你吃很多顿饭，走很多条路。🍜",
    "你一笑，我的世界就放晴了。☀️",
    "偏爱你，不需要理由。💕",
    "艺萌，你是我最想分享日常的人。🧸",
    "和你在一起，平凡的日子也会发光。✨"
  ],

  // 时间轴：date 是显示文字，title 是小标题，text 是小故事
  timeline: [
    { date: "2025.07.08", title: "我们在一起啦", text: "从这一天起，柴米油盐和诗和远方，都想和你一起。", emoji: "🎉" },
    { date: "待填写", title: "第一次约会", text: "把那天的天气、吃的东西、你的样子，慢慢补在这里。", emoji: "🍦" },
    { date: "待填写", title: "一次难忘的旅行", text: "以后去哪里玩，回来就在这里留下一笔。", emoji: "🧳" },
    { date: "待填写", title: "我们的纪念日", text: "这里留给以后的每一个值得庆祝的日子。", emoji: "🎂" }
  ],

  // 相册：把图片放进 images 文件夹，改一下文件名即可
  // 例如 { src: "images/1.jpg", caption: "第一次一起看海" }
  photos: [
    { src: "images/placeholder-1.svg", caption: "第一张照片的位置" },
    { src: "images/placeholder-2.svg", caption: "第二张照片的位置" },
    { src: "images/placeholder-3.svg", caption: "第三张照片的位置" },
    { src: "images/placeholder-4.svg", caption: "第四张照片的位置" },
    { src: "images/placeholder-5.svg", caption: "第五张照片的位置" },
    { src: "images/placeholder-6.svg", caption: "第六张照片的位置" }
  ]
};
