/* ============================================================
 * 素材配置入口 —— 用戶可輕鬆新增照片 / 語錄
 *
 * ★ 重要：所有素材必須本地託管，禁止使用外部 URL
 *
 * 使用方式：
 *   1. 照片放入 uploads/photos/   → 在 photos 陣列新增一行
 *   2. 錄音放入 uploads/audio/    → 在 quotes 的 audio 填路徑
 *   3. 文字放入 uploads/texts/    → 在 texts 陣列新增一行
 *   4. 也可以在網頁內直接用 + 按鈕上傳（存瀏覽器 localStorage）
 * ============================================================ */
(function () {
  window.ARCHIVE_CONFIG = {

    backgrounds: {
      // Stage 1 & 2 的背景圖（用戶原圖，直接使用）
      home:    'assets/pages/home-bg-user.jpg',
      welcome: 'assets/pages/welcome-bg-user.jpg'
    },

    /* -------------------------------------------------------------
     * 照片：將安溥的照片放入 uploads/photos/ 目錄，然後按下方格式新增
     * src 填本地路徑，例如 'uploads/photos/anpu_01.jpg'
     * 後續陸續提供照片時，只需在這裡加一行即可
     * ----------------------------------------------------------- */
    photos: [
      { id: 'p_001', src: 'uploads/photos/sample_01.jpg', title: '琥珀色的光' },
      { id: 'p_002', src: 'uploads/photos/sample_02.jpg', title: '深藍色的夜' },
      { id: 'p_003', src: 'uploads/photos/sample_03.jpg', title: '暖褐色的回聲' },
      // 繼續新增：{ id: 'p_004', src: 'uploads/photos/your_photo.jpg', title: '您的標題' },
    ],

    /* -------------------------------------------------------------
     * 語錄：安溥的文字 + 可選配對錄音（放入 uploads/audio/）
     * audio 填本地路徑，例如 'uploads/audio/quote_001.mp3'
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
      },
      {
        id: 'q_006',
        text: '所有的失去，都是為了騰出空間給更好的到來。',
        audio: ''
      },
      {
        id: 'q_007',
        text: '如果你因為錯過太陽而哭泣，那麼你也將錯過群星。',
        audio: ''
      },
      {
        id: 'q_008',
        text: '世界很暗，但你來了。',
        audio: ''
      }
    ]
  };
})();
