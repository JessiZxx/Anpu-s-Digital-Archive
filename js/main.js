// ====================================================================
//  Anpu's Digital Archive · 安溥的數字藏館
//  核心入口模組
// ====================================================================

import * as THREE from 'three';

const LS_KEY_ITEMS  = 'ADAR_ITEMS_v1';
const LS_KEY_PREFIX = 'ADAR_IMG_';

// ==============================================================
//  1. 讀取 items  —— 優先使用 localStorage 自訂內容，否則用 CONFIG 預設
// ==============================================================
function loadItems() {
  try {
    const raw = localStorage.getItem(LS_KEY_ITEMS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (e) { console.warn('[Load] localStorage 解析失敗，使用預設資料', e); }

  // 使用 CONFIG 預設（為了純靜態 demo，用預設圖當臨時展示；
  // 之後用戶把圖片放進 /photos/ 資料夾，直接改 config.js 的 src 即可）
  const cfg = (window.ARCHIVE_CONFIG || {});
  const out = [];
  (cfg.photos || []).forEach(p => out.push({
    id: p.id,
    type: 'photo',
    src: p.src,
    title: p.title || ''
  }));
  (cfg.quotes || []).forEach(q => out.push({
    id: q.id,
    type: 'text',
    text: q.text || '',
    title: (q.text || '').slice(0, 12),
    audio: q.audio || ''
  }));
  return out;
}

function saveItems(items) {
  try { localStorage.setItem(LS_KEY_ITEMS, JSON.stringify(items)); }
  catch (e) { console.warn('[Save] localStorage 失敗（可能配額滿）', e); }
}

// ==============================================================
//  2. 頁面切換 & 過渡動畫
// ==============================================================
const stages = {
  home:    document.getElementById('home-stage'),
  welcome: document.getElementById('welcome-stage'),
  globe:   document.getElementById('globe-stage')
};
let currentStage = 'home';

function goTo(target, direction = 'forward') {
  if (target === currentStage) return Promise.resolve();

  const wipe = document.getElementById('trans-wipe');
  const dirClass = direction === 'forward' ? 'active-down' : 'active-up';

  return new Promise(resolve => {
    wipe.classList.add(dirClass);
    setTimeout(() => {
      // Switch active
      Object.entries(stages).forEach(([k, el]) => {
        el.classList.toggle('stage-active', k === target);
      });
      currentStage = target;
      if (target === 'globe') {
        if (!globeApp.inited) globeApp.init();
        else globeApp.onShow();
      }
      setTimeout(() => {
        wipe.classList.remove('active-down', 'active-up');
        resolve();
      }, 650);
    }, 850);
  });
}

// Home / Welcome 透明熱區
document.getElementById('home-hotzone').addEventListener('click', () => goTo('welcome', 'forward'));
document.getElementById('enter-hotzone').addEventListener('click', () => goTo('globe', 'forward'));

// 允許 ESC 返回上一頁
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (detailPanel.open) { detailPanel.close(); return; }
    if (uploadModal.open) { uploadModal.close(); return; }
    if (currentStage === 'globe') goTo('welcome', 'backward');
    else if (currentStage === 'welcome') goTo('home', 'backward');
  }
});

// ==============================================================
//  3. Audio 播放器 (語錄卡片用)
// ==============================================================
const audioPlayer = {
  audioEl: document.getElementById('archive-audio'),
  playBtn: document.getElementById('audio-play-btn'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  seekInput: document.getElementById('audio-seek'),
  curSpan: document.getElementById('audio-cur'),
  totalSpan: document.getElementById('audio-total'),
  onTimeUpdateBound: null,
  onEndedBound: null,
  onLoadedBound: null,

  fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  },

  bindEvents() {
    this.onTimeUpdateBound = () => {
      if (!this.audioEl.duration) return;
      const pct = (this.audioEl.currentTime / this.audioEl.duration) * 100;
      this.seekInput.value = String(pct);
      this.curSpan.textContent = this.fmt(this.audioEl.currentTime);
    };
    this.onLoadedBound = () => {
      this.totalSpan.textContent = this.fmt(this.audioEl.duration);
      this.seekInput.value = '0';
    };
    this.onEndedBound = () => this.setPlaying(false);

    this.audioEl.addEventListener('timeupdate', this.onTimeUpdateBound);
    this.audioEl.addEventListener('loadedmetadata', this.onLoadedBound);
    this.audioEl.addEventListener('ended', this.onEndedBound);

    this.playBtn.addEventListener('click', () => this.togglePlay());

    this.seekInput.addEventListener('input', () => {
      if (!this.audioEl.duration) return;
      this.audioEl.currentTime = (parseFloat(this.seekInput.value) / 100) * this.audioEl.duration;
    });
  },

  setSource(src) {
    this.reset();
    if (src) this.audioEl.src = src;
  },

  setPlaying(playing) {
    this.iconPlay.style.display  = playing ? 'none' : '';
    this.iconPause.style.display = playing ? '' : 'none';
  },

  togglePlay() {
    if (!this.audioEl || !this.audioEl.src) return;
    if (this.audioEl.paused) {
      const p = this.audioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          console.warn('[Audio] 播放失敗:', err?.message || err);
          this.setPlaying(false);
        });
      }
      this.setPlaying(true);
    } else {
      this.audioEl.pause();
      this.setPlaying(false);
    }
  },

  reset() {
    try { this.audioEl.pause(); } catch (_) {}
    try { this.audioEl.removeAttribute('src'); this.audioEl.load(); } catch (_) {}
    this.setPlaying(false);
    this.curSpan.textContent = '0:00';
    this.totalSpan.textContent = '0:00';
    this.seekInput.value = '0';
  }
};
audioPlayer.bindEvents();

// ==============================================================
//  4a. Photo Lightbox (全屏大圖預覽)
// ==============================================================
const photoLightbox = {
  el: document.getElementById('photo-lightbox'),
  img: document.getElementById('lightbox-img-el'),
  closeBtn: document.getElementById('lightbox-close'),

  bind() {
    const close = () => this.close();
    this.closeBtn.addEventListener('click', close);
    this.el.addEventListener('click', e => {
      if (e.target === this.el) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.el.classList.contains('open')) close();
    });
  },

  show(src) {
    this.img.src = src;
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el.classList.remove('open');
    this.img.removeAttribute('src');
    document.body.style.overflow = '';
  }
};
photoLightbox.bind();

// ==============================================================
//  4b. Quote Modal (語錄彈窗)
// ==============================================================
const detailPanel = {
  el: document.getElementById('detail-panel'),
  backdrop: document.getElementById('detail-backdrop'),
  closeBtn: document.getElementById('detail-close'),
  body: document.querySelector('.dp-body'),
  audioBox: document.getElementById('detail-audio'),
  editBtn: document.getElementById('detail-edit'),
  deleteBtn: document.getElementById('detail-delete'),
  titleEditor: document.getElementById('detail-title-editor'),
  titleInput: document.getElementById('detail-title-input'),
  saveTitleBtn: document.getElementById('detail-save-title'),

  currentItem: null,
  open: false,

  bind() {
    const close = () => this.close();
    this.closeBtn.addEventListener('click', close);
    this.backdrop.addEventListener('click', close);

    this.editBtn.addEventListener('click', () => {
      if (!this.currentItem) return;
      this.titleInput.value = this.currentItem.title || '';
      this.titleEditor.classList.add('open');
      this.titleInput.focus();
    });

    this.saveTitleBtn.addEventListener('click', () => {
      if (!this.currentItem) return;
      const newTitle = this.titleInput.value.trim();
      if (!newTitle) return;
      this.currentItem.title = newTitle;
      saveItems(appData.items);
      globeApp.updateCardTitle(this.currentItem);
      flatView.render();
      this.titleEditor.classList.remove('open');
    });

    this.deleteBtn.addEventListener('click', () => {
      if (!this.currentItem) return;
      if (!confirm('確定要從藏館中刪除這個內容嗎？（此動作無法復原）')) return;
      const id = this.currentItem.id;
      appData.items = appData.items.filter(it => it.id !== id);
      if (this.currentItem._imgLsKey) {
        try { localStorage.removeItem(this.currentItem._imgLsKey); } catch (_) {}
      }
      saveItems(appData.items);
      globeApp.removeCardById(id);
      flatView.render();
      this.close();
    });
  },

  show(item) {
    this.currentItem = item;
    this.open = true;
    this.body.textContent = item.text || '';

    if (item.type === 'text' && item.audio) {
      this.audioBox.style.display = 'flex';
      audioPlayer.setSource(item.audio);
    } else {
      this.audioBox.style.display = 'none';
      audioPlayer.setSource(null);
    }

    this.titleEditor.classList.remove('open');
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.open = false;
    this.el.classList.remove('open');
    audioPlayer.reset();
    this.currentItem = null;
    document.body.style.overflow = '';
  }
};
detailPanel.bind();

// ==============================================================
//  5. Upload Modal (照片 / 文字 雙頁籤)
// ==============================================================
const uploadModal = {
  el: document.getElementById('upload-modal'),
  open: false,
  backdrop: null, closeBtn: null,
  photoInput: null, photoDrop: null, photoPreview: null, photoSubmit: null,
  photoPending: [],   // {title, dataUrl, file}
  textInput: null, audioInput: null, audioName: null, textSubmit: null,
  pendingAudioDataUrl: null,

  bind() {
    this.backdrop = this.el.querySelector('.modal-backdrop');
    this.closeBtn = document.getElementById('upload-close');
    this.photoInput = document.getElementById('photo-input');
    this.photoDrop = document.getElementById('photo-drop');
    this.photoPreview = document.getElementById('photo-preview');
    this.photoSubmit = document.getElementById('photo-submit');
    this.textInput = document.getElementById('text-input');
    this.audioInput = document.getElementById('text-audio-input');
    this.audioName = document.getElementById('text-audio-name');
    this.textSubmit = document.getElementById('text-submit');

    document.getElementById('add-button').addEventListener('click', () => this.openModal());
    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());

    // 頁籤切換
    document.querySelectorAll('.upload-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.upload-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(p => {
          p.classList.toggle('active', p.dataset.pane === tab);
        });
      });
    });

    // 照片
    this.photoDrop.addEventListener('click', e => {
      if (e.target === this.photoInput) return;
      this.photoInput.click();
    });
    this.photoInput.addEventListener('change', e => this.handlePhotoFiles(e.target.files));
    ['dragenter', 'dragover'].forEach(evt => this.photoDrop.addEventListener(evt, e => {
      e.preventDefault(); this.photoDrop.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(evt => this.photoDrop.addEventListener(evt, e => {
      e.preventDefault(); this.photoDrop.classList.remove('dragover');
    }));
    this.photoDrop.addEventListener('drop', e => {
      if (e.dataTransfer && e.dataTransfer.files) this.handlePhotoFiles(e.dataTransfer.files);
    });

    this.photoSubmit.addEventListener('click', () => this.submitPhotos());

    // 文字
    this.audioInput.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) { this.audioName.textContent = '＋ 配對錄音檔（可選）'; this.pendingAudioDataUrl = null; return; }
      this.audioName.textContent = '已選：' + f.name;
      const r = new FileReader();
      r.onload = () => { this.pendingAudioDataUrl = r.result; };
      r.readAsDataURL(f);
    });
    this.textSubmit.addEventListener('click', () => this.submitText());
  },

  openModal() {
    this.open = true;
    this.el.classList.add('open');
    this.resetPhotoPane();
    this.resetTextPane();
  },

  close() {
    this.open = false;
    this.el.classList.remove('open');
  },

  resetPhotoPane() {
    this.photoPending = [];
    this.photoInput.value = '';
    this.photoPreview.innerHTML = '';
    this.photoSubmit.style.display = 'none';
  },

  resetTextPane() {
    this.textInput.value = '';
    this.audioInput.value = '';
    this.audioName.textContent = '＋ 配對錄音檔（可選）';
    this.pendingAudioDataUrl = null;
  },

  handlePhotoFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    let loaded = 0;
    files.forEach((file, idx) => {
      const r = new FileReader();
      r.onload = () => {
        const dataUrl = r.result;
        const defaultTitle = (file.name || '照片').replace(/\.[^/.]+$/, '');
        const pending = { file, dataUrl, title: defaultTitle };
        this.photoPending.push(pending);
        this.renderPhotoPreview(pending);
        loaded++;
        if (loaded === files.length) this.photoSubmit.style.display = '';
      };
      r.readAsDataURL(file);
    });
  },

  renderPhotoPreview(pending) {
    const idx = this.photoPreview.children.length;
    const div = document.createElement('div');
    div.className = 'pv-item';
    div.innerHTML = `
      <img src="${pending.dataUrl}" alt="">
      <button class="pv-remove" title="移除">×</button>
      <input type="text" placeholder="標題" value="${pending.title.replace(/"/g, '&quot;')}">
    `;
    div.querySelector('.pv-remove').addEventListener('click', e => {
      e.stopPropagation();
      const i = this.photoPending.indexOf(pending);
      if (i > -1) this.photoPending.splice(i, 1);
      div.remove();
      if (this.photoPending.length === 0) this.photoSubmit.style.display = 'none';
    });
    div.querySelector('input').addEventListener('input', e => {
      pending.title = e.target.value;
    });
    this.photoPreview.appendChild(div);
  },

  submitPhotos() {
    if (!this.photoPending.length) return;
    const added = [];
    this.photoPending.forEach(p => {
      const id = 'p_upload_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const lsKey = LS_KEY_PREFIX + id;
      // 嘗試存 base64 到 localStorage
      try { localStorage.setItem(lsKey, p.dataUrl); }
      catch (e) {
        console.warn('[Upload] 照片無法存入 localStorage:', e);
        alert('瀏覽器儲存空間不足，此張圖片無法保留（關閉瀏覽器後會遺失）。可改採用將圖片放入 /photos/ 資料夾並編輯 config.js 的方式。');
      }
      const item = {
        id,
        type: 'photo',
        src: p.dataUrl,
        title: p.title || '未命名照片',
        _imgLsKey: lsKey
      };
      added.push(item);
    });
    appData.items = appData.items.concat(added);
    saveItems(appData.items);
    globeApp.addCards(added);
    flatView.render();
    this.close();
  },

  submitText() {
    const text = this.textInput.value.trim();
    if (!text) { alert('請輸入文字內容'); this.textInput.focus(); return; }
    const id = 'q_upload_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const item = {
      id,
      type: 'text',
      text,
      title: text.slice(0, 14),
      audio: this.pendingAudioDataUrl || ''
    };
    appData.items.push(item);
    saveItems(appData.items);
    globeApp.addCards([item]);
    flatView.render();
    this.close();
  }
};
uploadModal.bind();

// ==============================================================
//  6. 應用全域資料
// ==============================================================
const appData = { items: loadItems() };

// 如為 localStorage 讀回的照片項目，檢查是否有分離儲存的 base64
(function restoreImgFromLs() {
  appData.items.forEach(it => {
    if (it.type === 'photo' && it._imgLsKey && (!it.src || !it.src.startsWith('data:'))) {
      try {
        const stored = localStorage.getItem(it._imgLsKey);
        if (stored) it.src = stored;
      } catch (_) {}
    }
  });
})();

// ==============================================================
//  7. 球覽 / 平鋪 切換
// ==============================================================
document.querySelectorAll('.globe-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.globe-tab').forEach(b => b.classList.toggle('active', b === btn));
    const mode = btn.dataset.mode;
    if (mode === 'sphere') {
      document.getElementById('flat-container').classList.add('hidden');
      globeApp.onShow();
    } else {
      globeApp.onHide();
      document.getElementById('flat-container').classList.remove('hidden');
      flatView.render();
    }
  });
});

// ==============================================================
//  8. Flat View (平鋪)
// ==============================================================
const flatView = {
  track: document.getElementById('flat-track'),

  render() {
    if (!this.track) return;
    this.track.innerHTML = '';
    appData.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'flat-card';
      if (item.type === 'photo') {
        card.innerHTML = `<img src="${item.src}" alt="${(item.title||'').replace(/"/g,'&quot;')}" loading="lazy">`;
      } else {
        card.innerHTML = `
          <div class="flat-card-text">
            <q>${(item.text||'').replace(/</g,'&lt;').slice(0, 60)}</q>
            <div class="flat-card-title">${(item.title||'').replace(/</g,'&lt;').slice(0, 12)}</div>
          </div>`;
      }
      card.addEventListener('click', () => {
        if (item.type === 'photo') {
          photoLightbox.show(item.src);
        } else {
          detailPanel.show(item);
        }
      });
      this.track.appendChild(card);
    });
  }
};

// ==============================================================
//  9. Globe App (Becky Entertainment 風格 3D 球)
//     · 大型磨砂玻璃球 (透明發光)
//     · 360° 球面錯落拍立得卡
//     · 拖曳旋轉 + 慣性減速 + 滾輪 + 點擊
// ==============================================================
const globeApp = {
  container: null,
  renderer: null, scene: null, camera: null,
  sphereMesh: null, glow: null,
  cardsGroup: null,
  cardMeshes: [],            // [{mesh, item, normalMatrix}]
  raycaster: null, pointer: null,

  // 拖曳 & 慣性
  isPointerDown: false,
  lastX: 0, lastY: 0,
  rotVelX: 0, rotVelY: 0,
  rotX: 0, rotY: 0,
  autoYaw: 0.0009,           // 自動慢轉

  // 點擊判斷
  pointerDownX: 0, pointerDownY: 0,
  downTime: 0,
  hovered: null,

  inited: false,
  rafId: null,

  init() {
    if (this.inited) return;
    this.inited = true;

    this.container = document.getElementById('globe-container');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 0, 12);

    // Lighting: 柔和雙光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.55);
    dir.position.set(5, 6, 7);
    this.scene.add(dir);
    const rim = new THREE.DirectionalLight(0xaaaaee, 0.25);
    rim.position.set(-6, -4, -6);
    this.scene.add(rim);

    // --- 磨砂玻璃球體 (Becky 風格) ---
    this.buildCoreSphere();

    // Cards Group
    this.cardsGroup = new THREE.Group();
    this.scene.add(this.cardsGroup);

    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindInteraction();

    // Build initial cards
    this.buildCards(appData.items);

    // Start loop
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  },

  buildCoreSphere() {
    const R = 3.25;

    // Outer glass sphere (磨砂黑玻璃)
    const geo = new THREE.SphereGeometry(R, 80, 80);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x08080a,
      metalness: 0.05,
      roughness: 0.35,
      transmission: 0.55,
      thickness: 0.4,
      ior: 1.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.4,
      opacity: 0.72,
      transparent: true,
      side: THREE.FrontSide
    });
    this.sphereMesh = new THREE.Mesh(geo, mat);
    this.sphereMesh.renderOrder = 1;
    this.scene.add(this.sphereMesh);

    // Inner dark sphere
    const g2 = new THREE.SphereGeometry(R * 0.92, 48, 48);
    const m2 = new THREE.MeshBasicMaterial({
      color: 0x060608,
      side: THREE.BackSide
    });
    const inner = new THREE.Mesh(g2, m2);
    this.scene.add(inner);
  },

  cardTextureForPhoto(src) {
    // Becky 風格：直接用原圖作為紋理，不加白底邊框
    return new Promise(resolve => {
      const loader = new THREE.TextureLoader();
      loader.load(
        src,
        tex => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          resolve(tex);
        },
        undefined,
        () => {
          resolve(fallbackPhotoTexture(512, 512));
        }
      );
    });
  },

  cardTextureForText(text, title) {
    // 深色方形語錄卡
    const W = 512, H = 512;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    roundRect(ctx, 24, 24, W - 48, H - 48, 14);
    ctx.stroke();

    ctx.fillStyle = '#e8e8e8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = splitLines(text || '', 10);
    const baseSize = lines.length > 3 ? 36 : (lines.length > 2 ? 44 : 54);
    ctx.font = `500 ${baseSize}px -apple-system, "PingFang TC", "Microsoft JhengHei", serif`;
    const lineGap = baseSize * 1.55;
    const totalH = lines.length * lineGap;
    const startY = H / 2 - totalH / 2 + lineGap / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, W / 2, startY + i * lineGap);
    });

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  },

  buildCards(items) {
    if (!items || !items.length) return;
    // 球面 Fibonacci 均匀分布，卡片间距拉开
    const R = 3.45;
    const startIdx = this.cardMeshes.length;
    const total = startIdx + items.length;

    const job = items.map((item, i) => {
      const n = startIdx + i;
      const phi = Math.acos(1 - 2 * (n + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * n;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi);

      return (item.type === 'photo')
        ? this.cardTextureForPhoto(item.src).then(tex => ({ item, tex, x, y, z }))
        : Promise.resolve({ item, tex: this.cardTextureForText(item.text, item.title), x, y, z });
    });

    Promise.all(job).then(list => {
      list.forEach(({ item, tex, x, y, z }) => {
        this.addCardMesh(item, tex, new THREE.Vector3(x, y, z));
      });
    });
  },

  addCardMesh(item, tex, pos, isNew = true) {
    // 1:1 Becky 風格：小尺寸方形卡片
    const W = 0.95, H = 0.95;
    const geo = new THREE.PlaneGeometry(W, H);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);

    // 朝向球心
    const dir = pos.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), dir
    );
    mesh.quaternion.copy(q);

    mesh.userData.item = item;
    mesh.renderOrder = 10;
    this.cardsGroup.add(mesh);
    this.cardMeshes.push({ mesh, item });
  },

  addCards(items) {
    if (!items || !items.length) return;
    // 重新計算所有卡片位置 (維持 Fibonacci 球的錯落整齊)
    this.rebuildAll();
  },

  removeCardById(id) {
    const idx = this.cardMeshes.findIndex(c => c.item.id === id);
    if (idx < 0) return;
    const { mesh } = this.cardMeshes[idx];
    this.cardsGroup.remove(mesh);
    mesh.geometry.dispose();
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.dispose();
    this.cardMeshes.splice(idx, 1);
    // 重新排布
    this.rebuildAll();
  },

  rebuildAll() {
    // Clear
    this.cardMeshes.forEach(({ mesh }) => {
      this.cardsGroup.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material.map) mesh.material.map.dispose();
      mesh.material.dispose();
    });
    this.cardMeshes = [];
    this.buildCards(appData.items);
  },

  updateCardTitle(item) {
    // Rebuild the single card: 最簡單 -> 全部 rebuild (數量不多)
    this.rebuildAll();
  },

  bindInteraction() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', e => this.onPointerDown(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup',   e => this.onPointerUp(e));
    window.addEventListener('pointercancel', () => { this.isPointerDown = false; });
    el.addEventListener('wheel', e => this.onWheel(e), { passive: false });
  },

  setPointer(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  },

  pickCard() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.cardMeshes.map(c => c.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    return hits.length ? hits[0].object : null;
  },

  onPointerDown(e) {
    this.isPointerDown = true;
    this.lastX = e.clientX; this.lastY = e.clientY;
    this.pointerDownX = e.clientX; this.pointerDownY = e.clientY;
    this.downTime = performance.now();
    this.setPointer(e);
  },

  onPointerMove(e) {
    this.setPointer(e);
    if (this.isPointerDown) {
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.rotVelY = dx * 0.0045;
      this.rotVelX = dy * 0.0045;
      this.rotY += this.rotVelY;
      this.rotX += this.rotVelX;
      this.lastX = e.clientX; this.lastY = e.clientY;
      return;
    }
    // Hover
    const card = this.pickCard();
    if (this.hovered && this.hovered !== card) {
      this.hovered.scale.set(1, 1, 1);
    }
    if (card) {
      card.scale.set(1.08, 1.08, 1.08);
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'grab';
    }
    this.hovered = card;
  },

  onPointerUp(e) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const dt = performance.now() - this.downTime;
    const ddx = Math.abs(e.clientX - this.pointerDownX);
    const ddy = Math.abs(e.clientY - this.pointerDownY);
    if (dt < 280 && ddx < 6 && ddy < 6) {
      this.setPointer(e);
      const card = this.pickCard();
      if (card && card.userData.item) {
        const item = card.userData.item;
        if (item.type === 'photo') {
          photoLightbox.show(item.src);
        } else {
          detailPanel.show(item);
        }
      }
    }
  },

  onWheel(e) {
    e.preventDefault();
    const delta = Math.max(-1, Math.min(1, e.deltaY));
    this.camera.position.z = Math.min(18, Math.max(7.5, this.camera.position.z + delta * 0.45));
  },

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  onShow() {
    if (!this.inited) this.init();
    else {
      this.renderer.domElement.style.display = 'block';
      this.animate();
    }
  },

  onHide() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  },

  animate() {
    const self = this;
    function loop() {
      self.rafId = requestAnimationFrame(loop);
      self.tick();
    }
    if (this.rafId == null) loop();
  },

  tick() {
    // 慣性 + 自動慢轉
    if (!this.isPointerDown) {
      this.rotY += this.autoYaw + this.rotVelY;
      this.rotX += this.rotVelX;
      // damping
      this.rotVelX *= 0.955;
      this.rotVelY *= 0.955;
      // Clamp vertical (避免翻轉過頭)
      const lim = Math.PI / 2.2;
      if (this.rotX >  lim) { this.rotX =  lim; this.rotVelX *= -0.4; }
      if (this.rotX < -lim) { this.rotX = -lim; this.rotVelX *= -0.4; }
    }
    this.cardsGroup.rotation.x = this.rotX;
    this.cardsGroup.rotation.y = this.rotY;
    // 核心球同步旋轉 0.3x (營造層次)
    if (this.sphereMesh) {
      this.sphereMesh.rotation.x = this.rotX * 0.35;
      this.sphereMesh.rotation.y = this.rotY * 0.35;
    }
    this.renderer.render(this.scene, this.camera);
  }
};

// ==============================================================
//  10. 工具函式
// ==============================================================
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fallbackPhotoTexture(W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#666';
  ctx.font = '500 24px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('影像未載入', W / 2, H / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function splitLines(str, maxChars) {
  // 中文按字元切；英文按字數
  const out = [];
  let cur = '';
  for (const ch of (str || '')) {
    cur += ch;
    if (cur.length >= maxChars) { out.push(cur); cur = ''; }
  }
  if (cur) out.push(cur);
  return out.slice(0, 5);
}

// ==============================================================
//  11. 第一幀：確保 DOM 就緒 (Home 已是 stage-active，直接顯示)
// ==============================================================
if (document.readyState !== 'loading') {
  // 初始 home-bg / welcome-bg 實際路徑從 config 設定
  const bg = (window.ARCHIVE_CONFIG || {}).backgrounds || {};
  if (bg.home) {
    const h = document.getElementById('home-bg');
    if (h) h.style.backgroundImage = `url('${bg.home}')`;
  }
  if (bg.welcome) {
    const w = document.getElementById('welcome-bg');
    if (w) w.style.backgroundImage = `url('${bg.welcome}')`;
  }
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const bg = (window.ARCHIVE_CONFIG || {}).backgrounds || {};
    if (bg.home) {
      const h = document.getElementById('home-bg');
      if (h) h.style.backgroundImage = `url('${bg.home}')`;
    }
    if (bg.welcome) {
      const w = document.getElementById('welcome-bg');
      if (w) w.style.backgroundImage = `url('${bg.welcome}')`;
    }
  });
}
