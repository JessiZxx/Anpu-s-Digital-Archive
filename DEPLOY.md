# 🚀 GitHub Pages 部署指南

把「安溥的數字藏館」部署到 GitHub Pages，讓任何裝置都能打開。

---

## 方案 A：使用自動部署腳本（推薦）

### 1. 把程式碼拿到本機

從沙盒下載這些檔案到本機任意資料夾：

```
anpu-archive/
├── index.html
├── css/style.css
├── js/main.js
├── assets/
├── deploy.sh       ← 一鍵部署腳本
├── DEPLOY.md
├── README.md
└── .gitignore
```

### 2. 準備 GitHub Token

1. 開啟 https://github.com/settings/tokens
2. 點 **Generate new token** → **Classic**
3. Note: 填 `anpu-archive-deploy`
4. Expiration: 選 **No expiration**（或自訂）
5. Scopes: 勾選 **`repo`**（完整）
6. 點 **Generate token**
7. **複製 token**（只會顯示一次！）

### 3. 執行部署

打開終端機（macOS Terminal / Windows PowerShell）：

```bash
cd anpu-archive
bash deploy.sh
```

或用一行命令直接推（替換 `YOUR_TOKEN`）：

```bash
git push https://YOUR_TOKEN@github.com/JessiZxx/Anpu-s-Digital-Archive.git main
```

---

## 方案 B：完全手動部署

```bash
# 1. 進入資料夾
cd anpu-archive

# 2. 初始化 git
git init
git config user.name "你的名字"
git config user.email "你的郵箱"

# 3. 加入所有檔案
git add .

# 4. 提交
git commit -m "init: 安溥的數字藏館"

# 5. 設定主分支
git branch -M main

# 6. 連接遠端
git remote add origin https://github.com/JessiZxx/Anpu-s-Digital-Archive.git

# 7. 推送（會要求輸入 GitHub 用戶名 + Token）
git push -u origin main
```

---

## 方案 C：使用 GitHub Desktop（最簡單，無命令列）

1. 下載 [GitHub Desktop](https://desktop.github.com/)
2. 登入 GitHub
3. File → Add Local Repository → 選擇 `anpu-archive` 資料夾
4. 點 **Publish repository**
5. 在跳出視窗選擇 `JessiZxx/Anpu-s-Digital-Archive`
6. 完成！

---

## 開啟 GitHub Pages

無論用哪個方案推送完成後：

1. 前往 https://github.com/JessiZxx/Anpu-s-Digital-Archive/settings/pages
2. **Source** 選擇：`Deploy from a branch`
3. **Branch** 選擇：`main` / `(root)`
4. 點 **Save**
5. 等 1–2 分鐘重新整理頁面

✅ 完成後你的網址會是：

```
https://JessiZxx.github.io/Anpu-s-Digital-Archive/
```

用任何裝置（手機/平板/電腦）打開都能看到。

---

## 自訂歡迎照片

進入首頁需要一張背景照。支援以下任一檔名：

| 檔名 | 用途 |
|------|------|
| `assets/welcome.jpg` | 最常用 |
| `assets/welcome.png` | PNG 格式 |
| `assets/anpu.jpg` | 簡寫 |
| `assets/anpu.png` | PNG 簡寫 |

把照片放到 `assets/` 資料夾，**commit 並 push** 即可。

或：開啟網站後，點右上加號 → 上傳照片 → 按 ★ 設為歡迎照片（僅本機有效）。

---

## 常見問題

### Q: 推送時出現 `Permission denied`
**A:** 沒用 token。改用方案 A 或 B 的 token 方式。

### Q: 出現 `fatal: refusing to merge unrelated histories`
**A:** 遠端有舊檔。執行：
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Q: 推送成功但網站還是 404
**A:** 
1. 確認 Settings → Pages 已啟用
2. 確認 branch 是 `main` 不是 `master`
3. 等待 1–2 分鐘讓 GitHub 部署

### Q: 想自訂網址（不要 github.io）
**A:** 在 repo 根目錄放一個 `CNAME` 檔，內容是你的網域，然後到 DNS 設定 CNAME 指到 `JessiZxx.github.io`

---

## 後續更新

每次改了檔案，執行：

```bash
bash deploy.sh
```

或：

```bash
git add -A
git commit -m "更新內容"
git push
```

---

## QR Code

網址穩定後，到 https://www.qrcode-monkey.com/ 將網址轉成 QR Code，即可印在周邊上 🎁
