# Anpu's Digital Archive · 安溥的數字檔案

一個純靜態、無需後端的沉浸式線上空間。託管於 GitHub Pages，透過 QR Code 連接實體周邊與虛擬記憶。

## 結構

```
anpu-archive/
├── index.html          # 主頁面
├── css/
│   └── style.css       # 樣式
├── js/
│   └── main.js         # 核心邏輯（珠簾 + 3D 球體 + 彈窗 + 音頻）
└── assets/
    └── audio/          # 放置語音檔（.mp3）
```

## 使用方式

### 1. 替換照片
在 `js/main.js` 中的 `ARCHIVE_DATA.photos` 陣列替換為真實照片：
- 將照片放入 `assets/images/` 目錄
- 修改 `createPhotoTexture()` 函數，載入真實圖片而非生成佔位圖

### 2. 替換語錄與音頻
在 `js/main.js` 中的 `ARCHIVE_DATA.quotes` 陣列修改：
- `text`: 語錄文字
- `audio`: 音頻檔案路徑（如 `assets/audio/q1.mp3`）

### 3. 部署
將整個資料夾推送至 GitHub，在 Repository Settings 中啟用 GitHub Pages。

## 技術棧
- Three.js（3D 球體渲染）
- Canvas API（珠簾動畫）
- Web Audio API（語音播放）
- 純 HTML/CSS/JS，無框架，無後端