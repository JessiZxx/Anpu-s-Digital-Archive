#!/bin/bash
# ============================================
#  安溥的數字藏館 — GitHub Pages 部署腳本
#  用法：bash deploy.sh
# ============================================

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="https://github.com/JessiZxx/Anpu-s-Digital-Archive.git"
BRANCH="main"

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   安溥的數字藏館 · 部署到 GitHub    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# 確認在專案根目錄
if [ ! -f "index.html" ]; then
  echo -e "${RED}❌ 錯誤：請在 anpu-archive/ 目錄下執行此腳本${NC}"
  exit 1
fi

# 檢查 git
if ! command -v git &> /dev/null; then
  echo -e "${RED}❌ 找不到 git，請先安裝${NC}"
  exit 1
fi

# 詢問 GitHub 用戶名 / token（如果需要）
echo -e "${YELLOW}📋 推送資訊${NC}"
echo "  倉庫：$REPO_URL"
echo "  分支：$BRANCH"
echo ""

# 檢查 remote 是否已設定
if ! git remote get-url origin &> /dev/null; then
  echo "→ 設定 remote origin"
  git remote add origin "$REPO_URL"
fi

# 確認 main 分支
git branch -M "$BRANCH" 2>/dev/null || true

# 加入所有檔案
echo "→ 加入檔案 ..."
git add -A

# 詢問 commit 訊息
read -p "→ Commit 訊息（直接 Enter 用預設）： " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="deploy: 更新安溥的數字藏館 $(date '+%Y-%m-%d %H:%M')"
fi

git commit -m "$COMMIT_MSG" 2>/dev/null || echo "  (沒有新變更，跳過 commit)"

# 推送
echo ""
echo -e "${YELLOW}🚀 推送到 GitHub ...${NC}"
echo "  （如跳出登入視窗，請輸入你的 GitHub 帳號密碼 / Token）"
echo ""

if git push -u origin "$BRANCH" 2>&1; then
  echo ""
  echo -e "${GREEN}✅ 推送成功！${NC}"
  echo ""
  echo -e "${BLUE}📍 下一步：開啟 GitHub Pages${NC}"
  echo "  1. 前往 https://github.com/JessiZxx/Anpu-s-Digital-Archive/settings/pages"
  echo "  2. Source 選擇：Deploy from a branch"
  echo "  3. Branch 選擇：main / (root)"
  echo "  4. 儲存後等 1-2 分鐘"
  echo ""
  echo -e "${GREEN}🌐 你的網址會是：${NC}"
  echo "  https://JessiZxx.github.io/Anpu-s-Digital-Archive/"
else
  echo ""
  echo -e "${RED}❌ 推送失敗${NC}"
  echo ""
  echo "如果需要認證，請先："
  echo "  1. 建立 Personal Access Token: https://github.com/settings/tokens"
  echo "  2. 使用以下命令（替換 YOUR_TOKEN）："
  echo "     git push https://YOUR_TOKEN@github.com/JessiZxx/Anpu-s-Digital-Archive.git main"
fi
