/* ============================================================
 * 素材配置入口 —— 用戶可輕鬆新增照片 / 語錄
 * 如果 localStorage 有自訂存檔 (ADAR_ITEMS_v1)，會優先加載。
 * 音頻檔放 assets/audio/ 後，在 quotes 裡填對應路徑即可。
 * 圖片檔放 photos/ 後，在 photos 裡填對應路徑即可。
 * ============================================================ */
(function () {
  window.ARCHIVE_CONFIG = {

    backgrounds: {
      // Stage 1 & 2 的背景圖（用戶原圖）
      home:    'assets/pages/home-bg-user.jpg',
      welcome: 'assets/pages/welcome-bg-user.jpg'
    },

    /* -------------------------------------------------------------
     * 照片：在 photos/ 目錄放入圖片，然後依照下方格式新增即可
     * ----------------------------------------------------------- */
    photos: [
      {
        id: 'p_001',
        src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        title: '關於我愛你'
      },
      {
        id: 'p_002',
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        title: '風塵之中'
      },
      {
        id: 'p_003',
        src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
        title: '黑夜時'
      },
      {
        id: 'p_004',
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
        title: '不為誰而作的歌'
      },
      {
        id: 'p_005',
        src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        title: '寧夏'
      },
      {
        id: 'p_006',
        src: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80',
        title: '人間'
      },
      {
        id: 'p_007',
        src: 'https://images.unsplash.com/photo-1506863530036-1efeddceb9e4?auto=format&fit=crop&w=800&q=80',
        title: '思念'
      },
      {
        id: 'p_008',
        src: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
        title: '歲月'
      },
      {
        id: 'p_009',
        src: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?auto=format&fit=crop&w=800&q=80',
        title: '城市夜'
      },
      {
        id: 'p_010',
        src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
        title: '海邊'
      },
      {
        id: 'p_011',
        src: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80',
        title: '雨天'
      },
      {
        id: 'p_012',
        src: 'https://images.unsplash.com/photo-1475178622784-2e0f12018796?auto=format&fit=crop&w=800&q=80',
        title: '微光'
      },
      {
        id: 'p_013',
        src: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80',
        title: '旅程'
      },
      {
        id: 'p_014',
        src: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80',
        title: '回家'
      },
      {
        id: 'p_015',
        src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
        title: '時光'
      }
    ],

    /* -------------------------------------------------------------
     * 語錄：文字 + 可選音檔（放入 assets/audio/）
     * ----------------------------------------------------------- */
    quotes: [
      {
        id: 'q_001',
        text: '我擁有的都是僥倖，我失去的都是人生。',
        audio: ''
      },
      {
        id: 'q_002',
        text: '你要按你所想的去生活，否則，你遲早會按你所生活的去想。',
        audio: ''
      },
      {
        id: 'q_003',
        text: '愛我。一次兩遍。',
        audio: ''
      },
      {
        id: 'q_004',
        text: '最深的黑暗，往往來自最閃亮的記憶。',
        audio: ''
      },
      {
        id: 'q_005',
        text: '我們終將失散，而我還在想，我是否曾以愛，為你命名。',
        audio: ''
      }
    ]
  };
})();
