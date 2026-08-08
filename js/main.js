// ============================================================
// Anpu's Digital Archive · 安溥的數字藏館
// 球覽（3D 球體）+ 平鋪（滑動卡片）共享同一份資料
// 圖片可加簡介、純文字可上傳音檔
// ============================================================

import * as THREE from 'three';

// ============================================================
// 0. 預設素材（圖片佔位，上傳圖片即覆蓋預設）
// ============================================================
const DEFAULT_PHOTOS = [
  { id: 'p01', src: 'images/photo-01.jpg', title: 'PAVILION 2024' },
  { id: 'p02', src: 'images/photo-02.jpg', title: 'INDIE LIVE' },
  { id: 'p03', src: 'images/photo-03.jpg', title: 'CONCERT TAI' },
  { id: 'p04', src: 'images/photo-04.jpg', title: 'STAGE MOMENT' },
  { id: 'p05', src: 'images/photo-05.jpg', title: 'BRAND SHOOT' },
  { id: 'p06', src: 'images/photo-06.jpg', title: 'FESTIVAL' },
];

// ============================================================
// 1. 頁面切換
// ============================================================
const stages = {
  home:    document.getElementById('home-stage'),
  welcome: document.getElementById('welcome-stage'),
  globe:   document.getElementById('globe-stage'),
  media:   document.getElementById('media-stage'),
};
const wipe = document.getElementById('trans-wipe');
let currentStage = 'home';

function goTo(target, direction = 'forward') {
  if (target === currentStage) return Promise.resolve();
  if (!stages[target]) return Promise.resolve();

  const dirClass = direction === 'forward' ? 'active-down' : 'active-up';
  wipe.classList.add(dirClass);

  return new Promise(resolve => {
    setTimeout(() => {
      Object.entries(stages).forEach(([key, el]) => {
        el.classList.toggle('stage-active', key === target);
      });
      currentStage = target;

      if (target === 'globe') {
        if (!globeApp.inited) globeApp.init();
        else { globeApp.refresh(); globeApp.onShow(); }
      } else {
        globeApp.onHide();
      }

      if (target === 'media') {
        mediaApp.onShow();
      } else {
        mediaApp.onHide();
      }

      setTimeout(() => {
        wipe.classList.remove('active-down', 'active-up');
        resolve();
      }, 650);
    }, 850);
  });
}

// 事件綁定
document.getElementById('home-hotzone').addEventListener('click',     () => goTo('welcome', 'forward'));
document.getElementById('home-enter-btn').addEventListener('click',   () => goTo('welcome', 'forward'));
document.getElementById('enter-hotzone').addEventListener('click',    () => goTo('globe',   'forward'));
document.getElementById('welcome-enter-btn').addEventListener('click',() => goTo('globe',   'forward'));
document.getElementById('globe-back').addEventListener('click',       () => goTo('welcome', 'backward'));
document.getElementById('media-back').addEventListener('click',       () => goTo('globe',   'backward'));

// 球覽 ↔ 平鋪 切換按鈕
document.querySelectorAll('.globe-mode-toggle .mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === 'tile') goTo('media', 'forward');
  });
});
document.querySelectorAll('.media-mode-toggle .mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === 'globe') goTo('globe', 'backward');
  });
});

// 整頁可點擊作為備援（首頁 → 歡迎頁；歡迎頁 → 球體）
document.getElementById('home-stage').addEventListener('click', e => {
  if (currentStage !== 'home') return;
  if (document.getElementById('trans-wipe').classList.contains('active-down')) return;
  if (e.target.closest('.page-enter-btn, .hotzone')) return;
  goTo('welcome', 'forward');
});

// ESC 返回上一頁 / 關彈窗
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (mediaApp.editModalOpen)   { mediaApp.closeEditModal();  return; }
    if (mediaApp.confirmOpen)     { mediaApp.closeConfirm();    return; }
    if (mediaApp.detailOpen)      { mediaApp.closeDetail();     return; }
    if (lightbox.isOpen)          { lightbox.close();           return; }
    if (currentStage === 'media') goTo('globe', 'backward');
    else if (currentStage === 'globe')   goTo('welcome', 'backward');
    else if (currentStage === 'welcome') goTo('home', 'backward');
  }
});

// ============================================================
// 2. Lightbox 圖片預覽
// ============================================================
const lightbox = {
  el: document.getElementById('photo-lightbox'),
  img: document.getElementById('lightbox-img-el'),
  closeBtn: document.getElementById('lightbox-close'),
  isOpen: false,

  bind() {
    const close = () => this.close();
    this.closeBtn.addEventListener('click', close);
    this.el.addEventListener('click', e => { if (e.target === this.el) close(); });
  },

  open(src) {
    this.img.src = src;
    this.el.classList.add('open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el.classList.remove('open');
    this.img.removeAttribute('src');
    this.isOpen = false;
    document.body.style.overflow = '';
  }
};
lightbox.bind();

// ============================================================
// 3. 3D 深色磨砂球體展廳（球覽模式）
// ============================================================
function fallbackTexture(label = '影像佔位') {
  const W = 512, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '500 22px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadTexture(url) {
  return new Promise(resolve => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      () => resolve(fallbackTexture())
    );
  });
}

const globeApp = {
  container: null,
  renderer: null,
  scene: null,
  camera: null,
  sphere: null,
  cardsGroup: null,
  cardMeshes: [],
  raycaster: null,
  pointer: null,

  isPointerDown: false,
  lastX: 0, lastY: 0,
  rotVelX: 0, rotVelY: 0,
  rotX: 0, rotY: 0,
  autoYaw: 0.0007,

  pointerDownX: 0, pointerDownY: 0,
  downTime: 0,
  hovered: null,

  inited: false,
  rafId: null,

  // 當前已建立 mesh 的 item id 對照（用於 refresh 增量）
  builtIds: new Set(),

  init() {
    if (this.inited) return;
    this.inited = true;

    this.container = document.getElementById('globe-container');

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      this.showFallback('您的瀏覽器不支援 WebGL，3D 球體展廳無法顯示。');
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 12);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 6, 7);
    this.scene.add(dir);
    const rim = new THREE.DirectionalLight(0xaaaaff, 0.25);
    rim.position.set(-6, -4, -6);
    this.scene.add(rim);

    this.buildSphere();

    this.cardsGroup = new THREE.Group();
    this.scene.add(this.cardsGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.refresh();
    this.bindInteraction();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  },

  buildSphere() {
    const R = 3.2;

    const outerGeo = new THREE.SphereGeometry(R, 80, 80);
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x08080a,
      metalness: 0.05,
      roughness: 0.38,
      transmission: 0.5,
      thickness: 0.45,
      ior: 1.45,
      clearcoat: 0.55,
      clearcoatRoughness: 0.42,
      opacity: 0.7,
      transparent: true,
      side: THREE.FrontSide
    });
    this.sphere = new THREE.Mesh(outerGeo, outerMat);
    this.sphere.renderOrder = 1;
    this.scene.add(this.sphere);

    const innerGeo = new THREE.SphereGeometry(R * 0.92, 48, 48);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x050508, side: THREE.BackSide });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    this.scene.add(inner);
  },

  // 取得所有「圖片型」資料（球體只放圖片，不放純文字）
  collectImageItems() {
    const userItems = (mediaApp?.data || []).filter(i => i.type === 'image' && i.src);
    if (userItems.length) return userItems;
    // 若使用者尚未上傳，使用預設佔位
    return DEFAULT_PHOTOS.map(p => ({ ...p, type: 'image', text: '', description: '', audio: '' }));
  },

  // 重建球體卡片（資料變動時呼叫）
  async refresh() {
    if (!this.inited) return;
    const items = this.collectImageItems();

    // 移除舊的
    this.cardMeshes.forEach(m => {
      this.cardsGroup.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (m.material.map) m.material.map.dispose();
        m.material.dispose();
      }
    });
    this.cardMeshes = [];
    this.builtIds = new Set();

    if (!items.length) return;

    const R = 3.45;
    const total = items.length;
    const jobs = items.map((item, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = R * Math.sin(phi) * Math.cos(theta);
      const y = R * Math.sin(phi) * Math.sin(theta);
      const z = R * Math.cos(phi);
      return loadTexture(item.src).then(tex => ({ item, tex, pos: new THREE.Vector3(x, y, z) }));
    });

    const list = await Promise.all(jobs);
    list.forEach(({ item, tex, pos }) => this.addCard(item, tex, pos));
  },

  addCard(item, tex, pos) {
    const W = 0.9, H = 0.9;
    const geo = new THREE.PlaneGeometry(W, H);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);

    const dir = pos.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    mesh.quaternion.copy(q);

    mesh.userData = { item };
    mesh.renderOrder = 10;
    this.cardsGroup.add(mesh);
    this.cardMeshes.push(mesh);
  },

  bindInteraction() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', e => this.onPointerDown(e));
    window.addEventListener('pointermove', e => this.onPointerMove(e));
    window.addEventListener('pointerup', e => this.onPointerUp(e));
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
    const hits = this.raycaster.intersectObjects(this.cardMeshes, false);
    return hits.length ? hits[0].object : null;
  },

  onPointerDown(e) {
    this.isPointerDown = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.pointerDownX = e.clientX;
    this.pointerDownY = e.clientY;
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
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      return;
    }

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
        // 球覽模式：點擊開啟詳情面板（含音檔播放）
        mediaApp.openDetail(card.userData.item);
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

  showFallback(message) {
    this.container.innerHTML = `
      <div class="globe-fallback">
        <p>${message}</p>
        <p style="opacity:.6; margin-top:8px; font-size:.85rem;">真實瀏覽器 / 手機端可正常顯示 3D 球體</p>
      </div>
    `;
  },

  onShow() {
    if (!this.inited) this.init();
    else if (this.renderer) {
      this.renderer.domElement.style.display = 'block';
      this.animate();
    }
  },

  onHide() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  animate() {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      this.tick();
    };
    if (this.rafId == null) loop();
  },

  tick() {
    if (!this.isPointerDown) {
      this.rotY += this.autoYaw + this.rotVelY;
      this.rotX += this.rotVelX;
      this.rotVelX *= 0.955;
      this.rotVelY *= 0.955;

      const lim = Math.PI / 2.2;
      if (this.rotX > lim) { this.rotX = lim; this.rotVelX *= -0.4; }
      if (this.rotX < -lim) { this.rotX = -lim; this.rotVelX *= -0.4; }
    }

    this.cardsGroup.rotation.x = this.rotX;
    this.cardsGroup.rotation.y = this.rotY;

    if (this.sphere) {
      this.sphere.rotation.x = this.rotX * 0.35;
      this.sphere.rotation.y = this.rotY * 0.35;
    }

    this.renderer.render(this.scene, this.camera);
  }
};

// ============================================================
// 4. 媒體滑動區（平鋪模式）
// 圖片型 → 顯示圖片、標題、簡介、音檔
// 文字型 → 顯示純文字卡片、標題、音檔
// ============================================================
const MEDIA_STORAGE_KEY = 'anpu-archive-media-v1';

const DEFAULT_MEDIA = [
  { id: 'm_001', type: 'text', src: '', text: 'Represented by LUNARI Global',     title: 'REPRESENTED BY LUNARI GLOBAL', description: '', audio: '' },
  { id: 'm_002', type: 'text', src: '', text: 'BIOACTIVE+ Presenter',              title: 'BIOACTIVE+ PRESENTER',         description: '', audio: '' },
  { id: 'm_003', type: 'text', src: '', text: 'Represented by WILD Record Label', title: 'REPRESENTED BY WILD RECORD LABEL', description: '', audio: '' },
  { id: 'm_004', type: 'text', src: '', text: "TOD'S Brand Ambassador",           title: "TOD'S BRAND AMBASSADOR",       description: '', audio: '' },
  { id: 'm_005', type: 'text', src: '', text: 'Tao Kae Noi Brand Ambassador',      title: 'TAO KAE NOI BRAND AMBASSADOR', description: '', audio: '' },
  { id: 'm_006', type: 'text', src: '', text: 'Represented by Creative Artists Agency (CAA)', title: 'REPRESENTED BY CREATIVE ARTISTS AGENCY (CAA)', description: '', audio: '' },
  { id: 'm_007', type: 'text', src: '', text: 'Sunsilk Thailand Brand Presenter', title: 'SUNSILK THAILAND BRAND PRESENTER', description: '', audio: '' },
  { id: 'm_008', type: 'text', src: '', text: 'OPPO Thailand Presenter',           title: 'OPPO THAILAND PRESENTER',      description: '', audio: '' },
  { id: 'm_009', type: 'text', src: '', text: "First Muse of Harper's BAZAAR Thailand", title: "FIRST MUSE OF HARPER'S BAZAAR THAILAND", description: '', audio: '' },
  { id: 'm_010', type: 'text', src: '', text: "L'Oréal Paris Ambassador",          title: "L'ORÉAL PARIS AMBASSADOR",     description: '', audio: '' }
];

const mediaApp = {
  el: null,
  sliderEl: null,
  toolbarEl: null,
  fileInput: null,
  addTextBtn: null,
  editModal: null,
  editTitle: null,
  editTitleInput: null,
  editTextInput: null,
  editDescInput: null,
  editAudioInput: null,
  editAudioName: null,
  editAudioClear: null,
  editConfirm: null,
  editCancel: null,
  detailModal: null,
  detailImgWrap: null,
  detailImg: null,
  detailTitle: null,
  detailText: null,
  detailDescription: null,
  detailAudioWrap: null,
  detailAudio: null,
  detailClose: null,
  confirmModal: null,
  confirmDelete: null,
  confirmCancel: null,
  toggleBtns: null,

  data: [],
  mode: 'view',
  editModalOpen: false,
  confirmOpen: false,
  detailOpen: false,
  editTargetId: null,
  pendingDeleteId: null,
  // 編輯時暫存新音檔（避免與既有 audio 欄位混淆）
  _newAudioDataUrl: null,
  _newAudioName: null,
  _clearingAudio: false,

  init() {
    this.el = document.getElementById('media-stage');
    this.sliderEl = document.getElementById('media-slider');
    this.toolbarEl = document.getElementById('media-toolbar');
    this.fileInput = document.getElementById('media-file-input');
    this.addTextBtn = document.getElementById('media-add-text-btn');
    this.editModal = document.getElementById('media-edit-modal');
    this.editTitle = document.getElementById('media-edit-title');
    this.editTitleInput = document.getElementById('media-edit-title-input');
    this.editTextInput = document.getElementById('media-edit-text-input');
    this.editDescInput  = document.getElementById('media-edit-description-input');
    this.editAudioInput = document.getElementById('media-edit-audio-input');
    this.editAudioName  = document.getElementById('media-edit-audio-name');
    this.editAudioClear = document.getElementById('media-edit-audio-clear');
    this.editConfirm = document.getElementById('media-edit-confirm');
    this.editCancel  = document.getElementById('media-edit-cancel');
    this.detailModal = document.getElementById('media-detail-modal');
    this.detailImgWrap = document.getElementById('media-detail-image-wrap');
    this.detailImg  = document.getElementById('media-detail-img');
    this.detailTitle = document.getElementById('media-detail-title');
    this.detailText  = document.getElementById('media-detail-text');
    this.detailDescription = document.getElementById('media-detail-description');
    this.detailAudioWrap = document.getElementById('media-detail-audio-wrap');
    this.detailAudio = document.getElementById('media-detail-audio');
    this.detailClose = document.getElementById('media-detail-close');
    this.confirmModal = document.getElementById('media-confirm-modal');
    this.confirmDelete = document.getElementById('media-confirm-delete');
    this.confirmCancel = document.getElementById('media-confirm-cancel');
    this.toggleBtns = this.el.querySelectorAll('.media-toggle-btn');

    this.load();
    this.bindEvents();
    this.render();
  },

  load() {
    try {
      const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          // 補齊欄位
          this.data = arr.map(x => ({
            type: 'image', src: '', text: '', title: '',
            description: '', audio: '',
            ...x
          }));
          return;
        }
      }
    } catch (e) { /* ignore */ }
    this.data = DEFAULT_MEDIA.slice();
    this.persist();
  },

  persist() {
    try { localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(this.data)); }
    catch (e) { console.warn('media persist failed', e); }
  },

  bindEvents() {
    this.toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });

    this.fileInput.addEventListener('change', e => {
      const files = Array.from(e.target.files || []);
      files.forEach(f => this.uploadFile(f));
      e.target.value = '';
    });

    this.addTextBtn.addEventListener('click', () => this.openEditModal(null, true));

    this.editCancel.addEventListener('click', () => this.closeEditModal());
    this.editConfirm.addEventListener('click', () => this.saveEdit());
    this.editModal.addEventListener('click', e => {
      if (e.target === this.editModal) this.closeEditModal();
    });

    this.editAudioInput.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      this.fileToDataUrl(f).then(url => {
        this._newAudioDataUrl = url;
        this._newAudioName = f.name;
        this._newAudioMime = f.type;
        this.editAudioName.textContent = f.name;
        this.editAudioClear.hidden = false;
        this._clearingAudio = false;
      });
    });
    this.editAudioClear.addEventListener('click', () => {
      this._newAudioDataUrl = null;
      this._newAudioName = null;
      this._clearingAudio = true;
      this.editAudioInput.value = '';
      this.editAudioName.textContent = '（未選擇）';
      this.editAudioClear.hidden = true;
    });

    this.editTitleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.saveEdit(); }
    });
    this.editTextInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.saveEdit(); }
    });
    this.editDescInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.saveEdit(); }
    });

    // 詳情面板
    this.detailClose.addEventListener('click', () => this.closeDetail());
    this.detailModal.addEventListener('click', e => {
      if (e.target === this.detailModal) this.closeDetail();
    });

    // 刪除確認
    this.confirmCancel.addEventListener('click', () => this.closeConfirm());
    this.confirmDelete.addEventListener('click', () => this.confirmDeleteNow());
    this.confirmModal.addEventListener('click', e => {
      if (e.target === this.confirmModal) this.closeConfirm();
    });
  },

  setMode(mode) {
    this.mode = mode;
    this.toggleBtns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === mode));
    this.toolbarEl.hidden = mode !== 'manage';
    this.render();
  },

  render() {
    if (!this.sliderEl) return;
    this.sliderEl.innerHTML = '';
    this.data.forEach(item => this.sliderEl.appendChild(this.buildSlide(item)));
  },

  buildSlide(item) {
    const slide = document.createElement('article');
    slide.className = 'media-slide' + (this.mode === 'manage' ? ' is-manage' : '');
    slide.dataset.id = item.id;

    const isText = item.type === 'text';

    // 主視覺容器
    const wrap = document.createElement('div');
    wrap.className = 'media-slide-image-wrap' + (isText ? ' is-text' : '');
    wrap.addEventListener('click', e => {
      if (this.mode === 'manage') {
        e.stopPropagation();
        this.openEditModal(item.id, false);
        return;
      }
      // 瀏覽模式：點圖片開啟詳情（平鋪也用同一個詳情面板）
      this.openDetail(item);
    });

    if (item.type === 'image' && item.src) {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title || '';
      img.loading = 'lazy';
      img.draggable = false;
      wrap.appendChild(img);
    } else {
      const q = document.createElement('div');
      q.className = 'media-slide-quote';
      q.textContent = item.text || '';
      wrap.appendChild(q);
    }

    // 刪除按鈕（管理模式下顯示）
    const del = document.createElement('button');
    del.className = 'media-delete-btn';
    del.type = 'button';
    del.setAttribute('aria-label', '刪除');
    del.textContent = '×';
    del.addEventListener('click', e => {
      e.stopPropagation();
      this.askDelete(item.id);
    });
    wrap.appendChild(del);

    slide.appendChild(wrap);

    // 標題
    const title = document.createElement('h3');
    title.className = 'media-slide-title';
    title.textContent = item.title || '';
    slide.appendChild(title);

    // 簡介 + 音檔（平鋪模式直接顯示）
    const meta = document.createElement('div');
    meta.className = 'media-slide-meta';

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'media-slide-description';
      desc.textContent = item.description;
      meta.appendChild(desc);
    }

    if (item.audio) {
      const audio = document.createElement('audio');
      audio.className = 'media-slide-audio';
      audio.src = item.audio;
      audio.controls = true;
      audio.preload = 'metadata';
      meta.appendChild(audio);
    }

    if (meta.children.length) slide.appendChild(meta);

    return slide;
  },

  // ===== 上傳 =====
  async uploadFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await this.fileToDataUrl(file);
    const item = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type: 'image',
      src: dataUrl,
      text: '',
      title: (file.name || '未命名媒體').replace(/\.[^.]+$/, '').slice(0, 60) || '未命名媒體',
      description: '',
      audio: ''
    };
    this.data.push(item);
    this.persist();
    this.render();
    this.refreshGlobe();
  },

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  },

  // ===== 編輯 =====
  openEditModal(id, isNew) {
    this.editTargetId = id;
    this.editTitle.textContent = isNew ? '新增條目' : '編輯條目';
    this._newAudioDataUrl = null;
    this._newAudioName = null;
    this._clearingAudio = false;
    this.editAudioInput.value = '';

    if (isNew) {
      this.editTitleInput.value = '';
      this.editTextInput.value = '';
      this.editDescInput.value = '';
      this.editAudioName.textContent = '（未選擇）';
      this.editAudioClear.hidden = true;
    } else {
      const item = this.data.find(x => x.id === id);
      if (!item) return;
      this.editTitleInput.value = item.title || '';
      this.editTextInput.value = item.text || '';
      this.editDescInput.value = item.description || '';
      this.editAudioName.textContent = item.audio ? '已綁定音檔（可重新上傳）' : '（未選擇）';
      this.editAudioClear.hidden = !item.audio;
    }
    this.editModal.classList.add('open');
    this.editModal.setAttribute('aria-hidden', 'false');
    this.editModalOpen = true;
    setTimeout(() => this.editTitleInput.focus(), 50);
  },

  closeEditModal() {
    this.editModal.classList.remove('open');
    this.editModal.setAttribute('aria-hidden', 'true');
    this.editModalOpen = false;
    this.editTargetId = null;
    this._newAudioDataUrl = null;
    this._newAudioName = null;
    this._clearingAudio = false;
  },

  saveEdit() {
    const title = this.editTitleInput.value.trim() || '未命名條目';
    const text  = this.editTextInput.value.trim();
    const desc  = this.editDescInput.value.trim();

    if (this.editTargetId) {
      const item = this.data.find(x => x.id === this.editTargetId);
      if (!item) { this.closeEditModal(); return; }
      // 純文字條目：必須有文字內容
      if (item.type === 'text' && !text) {
        this.editTextInput.focus();
        return;
      }
      item.title = title;
      item.text  = text;
      item.description = desc;
      // 音檔更新
      if (this._clearingAudio) {
        item.audio = '';
      } else if (this._newAudioDataUrl) {
        item.audio = this._newAudioDataUrl;
      }
    } else {
      // 新增純文字條目
      if (!text) { this.editTextInput.focus(); return; }
      const item = {
        id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        type: 'text',
        src: '',
        text,
        title,
        description: desc,
        audio: this._newAudioDataUrl || ''
      };
      this.data.push(item);
    }
    this.persist();
    this.render();
    this.refreshGlobe();
    this.closeEditModal();
  },

  // ===== 詳情面板（球覽 / 平鋪 點擊照片都會用） =====
  openDetail(item) {
    if (!item) return;
    const isText = item.type === 'text';
    this.detailImgWrap.classList.toggle('is-text', isText);
    this.detailImgWrap.innerHTML = '';

    if (isText) {
      const q = document.createElement('div');
      q.className = 'media-detail-quote';
      q.textContent = item.text || '';
      this.detailImgWrap.appendChild(q);
    } else {
      const img = document.createElement('img');
      img.src = item.src || '';
      img.alt = item.title || '';
      img.draggable = false;
      this.detailImgWrap.appendChild(img);
    }

    this.detailTitle.textContent = item.title || '—';
    this.detailText.textContent = item.text || '';
    this.detailDescription.textContent = item.description || '';

    // 音檔
    if (item.audio) {
      this.detailAudioWrap.hidden = false;
      this.detailAudio.src = item.audio;
    } else {
      this.detailAudioWrap.hidden = true;
      this.detailAudio.removeAttribute('src');
    }

    this.detailModal.classList.add('open');
    this.detailModal.setAttribute('aria-hidden', 'false');
    this.detailOpen = true;
  },

  closeDetail() {
    this.detailModal.classList.remove('open');
    this.detailModal.setAttribute('aria-hidden', 'true');
    this.detailOpen = false;
    if (this.detailAudio) {
      try { this.detailAudio.pause(); } catch (e) {}
      this.detailAudio.removeAttribute('src');
    }
  },

  // ===== 刪除 =====
  askDelete(id) {
    this.pendingDeleteId = id;
    const item = this.data.find(x => x.id === id);
    document.getElementById('media-confirm-text').textContent =
      `確定要刪除「${item?.title || '此媒體'}」嗎？此操作無法復原。`;
    this.confirmModal.classList.add('open');
    this.confirmModal.setAttribute('aria-hidden', 'false');
    this.confirmOpen = true;
  },

  closeConfirm() {
    this.confirmModal.classList.remove('open');
    this.confirmModal.setAttribute('aria-hidden', 'true');
    this.confirmOpen = false;
    this.pendingDeleteId = null;
  },

  confirmDeleteNow() {
    if (!this.pendingDeleteId) return;
    this.data = this.data.filter(x => x.id !== this.pendingDeleteId);
    this.persist();
    this.render();
    this.refreshGlobe();
    this.closeConfirm();
  },

  // 通知球體刷新
  refreshGlobe() {
    if (globeApp && globeApp.inited) globeApp.refresh();
  },

  // ===== 切換可見性 =====
  onShow() {
    if (!this.el) this.init();
    this.render();
  },

  onHide() {
    if (this.editModalOpen)  this.closeEditModal();
    if (this.confirmOpen)    this.closeConfirm();
    if (this.detailOpen)     this.closeDetail();
  }
};

// 初始化媒體模組
mediaApp.init();
