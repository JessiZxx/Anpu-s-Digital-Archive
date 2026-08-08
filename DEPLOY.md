# 安溥的數字藏館 · 部署指南

> 順序強制：先推 GitHub → 再部署 Vercel，**不可顛倒**

---

## 📍 階段 ① 推送至 GitHub

### 1.1 確認本機狀態

打開終端機，進入專案資料夾，執行：

```bash
cd /path/to/Anpu-s-Digital-Archive
git status
```

**應該看到**：
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

如果 `vercel.json` 還沒新增，執行：

```bash
git add vercel.json
git commit -m "chore: 新增 vercel.json 部署配置"
```

### 1.2 推送到 main 分支

```bash
git push origin main
```

> 🔑 第一次推送會要求登入 GitHub：
> - 用戶名：`JessiZxx`
> - 密碼：使用 **Personal Access Token**（不是帳號密碼）
> - 取得位置：GitHub → 右上角頭像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
> - 權限勾選 `repo` 即可

### 1.3 驗證推送成功

1. 打開瀏覽器，進入：
   ```
   https://github.com/JessiZxx/Anpu-s-Digital-Archive
   ```
2. 切到 `main` 分支
3. 確認以下檔案都已上傳：
   - `index.html`
   - `vercel.json` ✅ **新檔案**
   - `css/style.css`
   - `js/main.js`
   - `js/config.js`
   - `js/githubStorage.js`
   - `images/` 資料夾（所有背景圖）
   - `assets/` 資料夾
4. 等待 1-2 分鐘，訪問 GitHub Pages 確認：
   ```
   https://jessizxx.github.io/Anpu-s-Digital-Archive/
   ```
   能看到首頁的「WELCOME TO Anpu's Digital Archive」即代表成功。

> ⚠️ **如果 GitHub 倉庫是空的或檔案沒上傳完成，後面 Vercel 一定失敗。**
> 一定要等到 GitHub Pages 網址能正常顯示，再進到階段 ②。

---

## 📍 階段 ② Vercel 部署

### 2.1 登入 Vercel

1. 打開 [https://vercel.com](https://vercel.com)
2. 點右上角 **Sign Up**（或 Log In）
3. 選擇 **Continue with GitHub**
4. 授權 Vercel 讀取你的 GitHub 倉庫

### 2.2 匯入專案

1. 登入後進入 Dashboard：https://vercel.com/dashboard
2. 點 **Add New…** → **Project**
3. 在「Import Git Repository」清單中找到 `JessiZxx/Anpu-s-Digital-Archive`
4. 點旁邊的 **Import**

### 2.3 配置專案（通常不用改）

| 項目 | 設定值 |
|---|---|
| Project Name | `anpu-s-digital-archive`（可改，建議保留） |
| Framework Preset | **Other**（純靜態網站不用選框架） |
| Root Directory | `./`（預設） |
| Build Command | **留空** |
| Output Directory | **留空或填 `.`** |
| Install Command | **留空** |

> 💡 純 HTML 站不需要 Build 步驟，Vercel 會直接拿倉庫根目錄當網站根目錄。

5. 點 **Deploy**

### 2.4 等待部署完成

- 約 30 秒 ~ 1 分鐘
- 看到「🎉 Congratulations!」就成功了
- Vercel 會給你一個網址，格式像這樣：
  ```
  https://anpu-s-digital-archive.vercel.app
  ```
  或
  ```
  https://anpu-s-digital-archive-jessizxx.vercel.app
  ```

> 🎯 **這就是你要拿來做 QR Code 的網址！**

---

## 📍 自動更新機制

部署完成後，**以後任何修改都只要推 GitHub 就行**：

```bash
git add .
git commit -m "說明改了什麼"
git push origin main
```

Vercel 會**自動偵測**到 main 分支有新的 commit，自動重新部署（通常 30 秒內完成）。

你可以隨時到這裡看部署紀錄：
```
https://vercel.com/dashboard
→ 點進你的專案
→ Deployments 分頁
```

每一次 push 都會產生一個新的 Deployment 編號，綠色勾勾代表成功。

---

## 📍 部署驗證清單

部署完成後，請逐項檢查：

- [ ] 開啟 `https://你的專案.vercel.app`
- [ ] 看到首頁背景圖 + 「WELCOME TO Anpu's Digital Archive」文字
- [ ] ENTER 按鈕在 3/4 高、2/6 寬的位置
- [ ] 點 ENTER 進入第二頁
- [ ] 進館按鈕在 3/4 高、1/6 第 4 格偏左的位置
- [ ] 點進館進入 3D 球體
- [ ] 球體可以拖曳旋轉
- [ ] 右上角有「球覽 / 平鋪」切換
- [ ] 切到平鋪模式可以看到 10 張預設卡片
- [ ] 切到管理模式可以看到「＋ 上傳媒體」「＋ 新增純文字條目」按鈕
- [ ] 點新增純文字條目，可以看到「標題 / 文字 / 簡介 / 上傳語音」四個欄位
- [ ] 隨意重新整理頁面（F5），不會出現 404

---

## 📍 常見故障排查

### ❌ 部署後網頁打開 404

**原因**：Vercel 沒找到 `index.html`（通常因為你選錯了 Root Directory）

**解決**：
1. Vercel Dashboard → 進入專案 → Settings → General
2. 把 **Root Directory** 改成 `.` 或留空
3. 然後到 Deployments 分頁，點最新一次部署右上角的「⋯」→ Redeploy

### ❌ 圖片都破圖看不到

**原因**：圖片路徑大小寫不一致，或倉庫裡少了 images 資料夾

**解決**：
1. 確認 GitHub 倉庫裡 `images/` 資料夾存在
2. 確認圖片檔名是 `.jpg` 小寫（不是 `.JPG`）
3. 重新推送：
   ```bash
   git add images/
   git commit -m "fix: 補上圖片資源"
   git push origin main
   ```

### ❌ 重新整理頁面出現 404

**原因**：直接訪問 `vercel.app/xxx` 子路徑時 Vercel 找不到檔案

**解決**：`vercel.json` 已配置 `cleanUrls: true`，把所有網址都視為單檔。**如果仍然 404**，確認 `vercel.json` 已成功推送到 main 分支。

### ❌ 改了檔案但 Vercel 沒更新

**原因**：本地 commit 了但沒 push，或 push 到別的分支

**解決**：
```bash
git branch            # 確認目前在 main
git log --oneline -3  # 確認有新的 commit
git push origin main  # 推送
```
然後到 Vercel Dashboard → Deployments 看是否有新的構建紀錄。

### ❌ Vercel 部署一直失敗（紅色叉叉）

**解決**：
1. 點進失敗的 Deployment 看錯誤訊息
2. 多半是 `vercel.json` 語法錯誤
3. 用 https://jsonlint.com 驗證 JSON 格式

### ❌ GitHub 推送時要求輸入帳號密碼

**原因**：GitHub 已不支援密碼推送，必須用 Token

**解決**：
1. 到 GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. 勾選 `repo` 權限，產生 token
3. 把 token 當密碼貼上

或者設定記住憑證（macOS）：
```bash
git config --global credential.helper osxkeychain
```
（Windows：`git config --global credential.helper wincred`）

---

## 📍 快速指令速查

| 動作 | 指令 |
|---|---|
| 看當前狀態 | `git status` |
| 看提交紀錄 | `git log --oneline -5` |
| 提交所有變更 | `git add . && git commit -m "說明"` |
| 推送到 GitHub | `git push origin main` |
| 拉取最新 | `git pull origin main` |

---

## 📁 新增的部署檔案

- `vercel.json` ✅（已新增到專案根目錄）

未修改任何網站原始檔（HTML / CSS / JS / 圖片），完全符合「只新增部署配置」的硬性約束。
