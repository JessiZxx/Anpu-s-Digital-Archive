# GitHub Pages 部署指南

把「安溥的數字藏館」變成一個可被掃碼打開的鏈接。

## 一、建立 GitHub 倉庫

1. 註冊 / 登入 GitHub
2. 建立新倉庫：`Anpu-s-Digital-Archive`（與你已建的一致）
3. **不要**勾選 Initialize with README（保持空倉庫）

## 二、推送代碼

在終端機進入專案目錄：

```bash
cd anpu-archive
git init
git add .
git commit -m "init: 安溥的數字藏館"
git branch -M main
git remote add origin https://github.com/JessiZxx/Anpu-s-Digital-Archive.git
git push -u origin main
```

## 三、開啟 GitHub Pages

1. 進入倉庫頁面
2. **Settings** → **Pages**
3. Source 選擇：`Deploy from a branch`
4. Branch 選擇：`main` / `(root)`
5. 儲存後等 1–2 分鐘

你的鏈接會是：

```
https://JessiZxx.github.io/Anpu-s-Digital-Archive/
```

## 四、上傳照片 / 語錄 / 語音

網頁本身支援「**本地即時上傳**」：
- 進入球體場景後，點右下角「+」按鈕
- 三個分頁：照片 / 文字 / 語音
- 語音支援**瀏覽器內直接錄音**（手機也能用）
- 內容會存進該設備的 `localStorage`

### 想讓所有人都看到你上傳的內容？

按右下「**導出 JSON**」會下載：
- `user-photos.json` — 所有上傳的照片（dataURL）
- `user-quotes.json` — 所有語錄（含音頻 dataURL）

然後：

```bash
# 在倉庫根目錄
mkdir -p data
# 把下載的 JSON 放進 data/
git add data/
git commit -m "feat: 新增上傳的內容"
git push
```

再修改 `js/main.js` 開頭的 `getAllPhotos()` 與 `getAllQuotes()`，
加入從 `data/*.json` 載入的邏輯（範例見下方）。

```js
async function getAllPhotos() {
  const user = Storage.load();
  const remote = await fetch('data/user-photos.json')
    .then(r => r.json())
    .catch(() => []);
  return [...DEFAULT_DATA.photos, ...remote, ...user.photos];
}
```

## 五、放上你自己的照片

進入歡迎頁需要一張背景照片。支援以下任一檔名：

| 檔名 |
|------|
| `assets/welcome.jpg` |
| `assets/welcome.png` |
| `assets/anpu.jpg` |
| `assets/anpu.png` |

把照片放到 `assets/` 資料夾裡，推送上去即可。

## 六、生成 QR Code

1. 訪問 [QR Code Generator](https://www.qrcode-monkey.com/)
2. 貼上你的 GitHub Pages 鏈接
3. 下載 PNG，印在周邊上 → 完成 🎉

## 七、完整流程檢查

- [x] 珠簾左右滑動
- [x] 黑屏過渡
- [x] 歡迎照片 + 繁體「歡迎來到安溥的數字藏館」
- [x] Enter 按鈕
- [x] 3D 球體可旋轉
- [x] 右下「+」上傳通道
- [x] 照片 / 文字 / 語音 上傳
- [x] 瀏覽器內錄音
- [x] localStorage 持久化
- [x] 導出 JSON 同步到 GitHub
