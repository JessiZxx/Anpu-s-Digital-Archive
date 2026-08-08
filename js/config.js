/* ============================================================
   安溥的數字藏館 · 素材配置入口
   ------------------------------------------------------------
   ✨ 使用方法：
   1. 把照片放到  /photos/  資料夾（支援 .jpg .jpeg .png .webp .gif）
   2. 把音檔放到  /assets/audio/  資料夾（支援 .mp3 .wav .ogg）
   3. 在下方 ARCHIVE_PHOTOS / ARCHIVE_QUOTES 陣列中，按範例新增項目
   4. 存檔重新整理網頁即可看到變更，不需要改其他程式碼
   ============================================================ */

window.ARCHIVE_CONFIG = {

  /* =============== 照片卡片 ===============
     每個物件代表一張照片卡片，會出現在球體與平鋪視圖
     - id:       唯一辨識字串（英文/數字，不要重複）
     - src:      圖片路徑（建議放在 /photos/ 資料夾）
     - title:    卡片標題（滑動/詳情頁會顯示）
  */
  photos: [
    {
      id: 'photo_001',
      src: 'photos/sample_01.jpg',
      title: '關於我愛你'
    },
    {
      id: 'photo_002',
      src: 'photos/sample_02.jpg',
      title: '玫瑰色的你'
    },
    {
      id: 'photo_003',
      src: 'photos/sample_03.jpg',
      title: '南國的孩子'
    },
    {
      id: 'photo_004',
      src: 'photos/sample_04.jpg',
      title: '年輕時的相片'
    },
    {
      id: 'photo_005',
      src: 'photos/sample_05.jpg',
      title: '我想你要走了'
    },
    {
      id: 'photo_006',
      src: 'photos/sample_06.jpg',
      title: '喜歡'
    },
    {
      id: 'photo_007',
      src: 'photos/sample_07.jpg',
      title: '城市'
    },
    {
      id: 'photo_008',
      src: 'photos/sample_08.jpg',
      title: '人事已非'
    },
    {
      id: 'photo_009',
      src: 'photos/sample_09.jpg',
      title: '日常'
    },
    {
      id: 'photo_010',
      src: 'photos/sample_010.jpg',
      title: '凝視'
    },
    {
      id: 'photo_011',
      src: 'photos/sample_011.jpg',
      title: '現場'
    },
    {
      id: 'photo_012',
      src: 'photos/sample_012.jpg',
      title: '光影'
    },
  ],

  /* =============== 文字語錄卡片 ===============
     每個物件代表一張語錄卡片
     - id:       唯一辨識字串
     - text:     語錄文字（會顯示在卡片上 + 彈窗內完整顯示）
     - audio:    對應音檔路徑（可選，放在 /assets/audio/ 資料夾）
                 若有填寫，彈窗會顯示播放按鈕
                 若留空字串，彈窗不顯示播放按鈕
  */
  quotes: [
    {
      id: 'quote_001',
      text: '我擁有的都是僥倖，我失去的都是人生。',
      audio: 'assets/audio/quote_001.mp3'
    },
    {
      id: 'quote_002',
      text: '在所有人事已非的景色裡，我最喜歡你。',
      audio: 'assets/audio/quote_002.mp3'
    },
    {
      id: 'quote_003',
      text: '你是我在這個世界上，唯一的唯一。',
      audio: ''
    },
    {
      id: 'quote_004',
      text: '關於我愛你。',
      audio: ''
    },
    {
      id: 'quote_005',
      text: '我想你要走了。',
      audio: ''
    },
    {
      id: 'quote_006',
      text: '南國的孩子。',
      audio: ''
    },
    {
      id: 'quote_007',
      text: '日子。',
      audio: ''
    },
    {
      id: 'quote_008',
      text: '留下來，或者我跟你走。',
      audio: ''
    },
    {
      id: 'quote_009',
      text: '如果這就是最後了，謝謝你曾經來過。',
      audio: ''
    },
    {
      id: 'quote_010',
      text: '愛我。一次兩遍。',
      audio: ''
    },
  ],

  /* =============== 頁面背景圖 ===============
     兩張首頁背景圖路徑（放在 /assets/pages/ 資料夾）
     使用者自行替換檔案即可，不需要改這裡
  */
  backgrounds: {
    home:    'assets/pages/home-bg-user.jpg',
    welcome: 'assets/pages/welcome-bg-user.jpg'
  }
};
