// ============================================================
//  GitHub Cloud Storage Config
//  請在這裡填入你的 GitHub 倉庫資訊
//  步驟：
//  1. 在 GitHub 建立一個倉庫（例如 anpu-archive）
//  2. 到 Settings → Developer settings → Personal access tokens 建立 token（選 repo 權限）
//  3. 把 token 和 repo 資訊貼到下面
// ============================================================

window.GITHUB_CONFIG = {
  // 倉庫擁有者（你的 GitHub 用戶名）
  owner: '',
  // 倉庫名稱
  repo: '',
  // 個人存取權杖（Personal Access Token）
  // 請勿將此檔案提交到公開倉庫！
  token: '',
  // 分支
  branch: 'main',
  // 數據檔案路徑
  dataPath: 'data/archive.json',
};

// 判斷是否已設定 GitHub
window.hasGitHub = function() {
  const c = window.GITHUB_CONFIG;
  return !!(c.owner && c.repo && c.token);
};
