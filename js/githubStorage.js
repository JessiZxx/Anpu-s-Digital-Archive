// ============================================================
//  GitHub Cloud Storage Module
//  所有用戶的上傳都儲存到 GitHub 倉庫，實現跨設備共享
// ============================================================

class GitHubStorage {
  constructor() {
    this.config = window.GITHUB_CONFIG || {};
    this.enabled = !!(this.config.owner && this.config.repo && this.config.token);
    this.baseUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
    this.localFallback = new LocalFallback();
  }

  async fetchData() {
    if (!this.enabled) {
      console.log('[Storage] GitHub 未配置，使用本地儲存');
      return this.localFallback.load();
    }

    try {
      const url = `${this.baseUrl}/contents/${this.config.dataPath}?ref=${this.config.branch}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 404) {
        // 檔案不存在，返回空數據
        console.log('[Storage] GitHub 上還沒有數據，使用本地');
        return this.localFallback.load();
      }

      if (!res.ok) {
        throw new Error(`GitHub API 錯誤: ${res.status}`);
      }

      const fileData = await res.json();
      const decoded = atob(fileData.content);
      const data = JSON.parse(decoded);
      console.log('[Storage] 從 GitHub 載入數據成功');
      this.localFallback.save(data);
      return data;
    } catch (err) {
      console.warn('[Storage] GitHub 讀取失敗，回退到本地:', err);
      return this.localFallback.load();
    }
  }

  async saveData(data) {
    // 同時保存到本地（快取）
    this.localFallback.save(data);

    if (!this.enabled) {
      console.log('[Storage] 僅本地保存（未配置 GitHub）');
      return true;
    }

    try {
      // 取得當前檔案的 SHA（用於更新）
      let sha = null;
      try {
        const url = `${this.baseUrl}/contents/${this.config.dataPath}?ref=${this.config.branch}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const fileData = await res.json();
          sha = fileData.sha;
        }
      } catch (e) { /* 檔案不存在 */ }

      const content = btoa(JSON.stringify(data, null, 2));
      const body = {
        message: `update archive - ${new Date().toISOString()}`,
        content,
        branch: this.config.branch,
      };
      if (sha) body.sha = sha;

      const createUrl = `${this.baseUrl}/contents/${this.config.dataPath}`;
      const res = await fetch(createUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`GitHub 寫入失敗: ${res.status}`);
      console.log('[Storage] 保存到 GitHub 成功');
      return true;
    } catch (err) {
      console.warn('[Storage] GitHub 保存失敗:', err);
      return false;
    }
  }

  async uploadImage(file, filename) {
    // 上傳圖片到 GitHub倉庫
    if (!this.enabled) {
      // 未配置 GitHub，回傳 base64（用於本地預覽）
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result, sha: null });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    try {
      const content = await this.fileToBase64(file);
      const path = `images/${Date.now()}_${filename}`;

      // 取得現有文件 SHA
      let sha = null;
      try {
        const url = `${this.baseUrl}/contents/${path}?ref=${this.config.branch}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) sha = (await res.json()).sha;
      } catch (e) { /* 忽略 */ }

      const body = {
        message: `upload ${path} - ${new Date().toISOString()}`,
        content,
        branch: this.config.branch,
      };
      if (sha) body.sha = sha;

      const url = `${this.baseUrl}/contents/${path}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`上傳失敗: ${res.status}`);
      const result = await res.json();
      return {
        url: result.content?.download_url || result.content?.url || '',
        sha: result.content?.sha || null,
        path,
      };
    } catch (err) {
      console.warn('[Storage] 圖片上傳失敗，回退到 base64:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result, sha: null });
        reader.readAsDataURL(file);
      });
    }
  }

  async deleteImage(path, sha) {
    if (!this.enabled || !path) return true;
    try {
      const url = `${this.baseUrl}/contents/${path}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `delete ${path}`,
          branch: this.config.branch,
          sha,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[Storage] 圖片刪除失敗:', err);
      return false;
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // 去掉 data:image/xxx;base64, 前綴
        const b64 = reader.result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// ============================================================
//  Local Fallback（沒有 GitHub 配置時使用）
// ============================================================
class LocalFallback {
  constructor() {
    this.KEY = 'anpu-archive-cloud-v1';
  }

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : { photos: [], quotes: [], meta: { updated: null } };
    } catch (e) {
      return { photos: [], quotes: [], meta: { updated: null } };
    }
  }

  save(data) {
    try {
      data.meta = data.meta || {};
      data.meta.updated = new Date().toISOString();
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Local save failed:', e);
      return false;
    }
  }

  clear() {
    localStorage.removeItem(this.KEY);
  }
}

// ============================================================
//  Global Storage Instance
// ============================================================
window.GitHubStorage = new GitHubStorage();
window.LocalFallback = LocalFallback;
