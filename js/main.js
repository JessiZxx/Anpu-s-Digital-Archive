// ============================================================
// Anpu's Digital Archive · 安溥的數字藏館
// 純代碼框架：頁面跳轉 + 3D 深色磨砂球體 + 圖片預覽彈窗
// 所有圖片均為 images/ 路徑佔位，請手動上傳原圖替換
// ============================================================

import * as THREE from 'three';

// ============================================================
// 0. 圖片佔位配置（上傳對應文件即可，無需修改代碼）
// ============================================================
const PHOTOS = [
  { id: 'p01', src: 'images/photo-01.jpg', title: '' },
  { id: 'p02', src: 'images/photo-02.jpg', title: '' },
  { id: 'p03', src: 'images/photo-03.jpg', title: '' },
  { id: 'p04', src: 'images/photo-04.jpg', title: '' },
  { id: 'p05', src: 'images/photo-05.jpg', title: '' },
  { id: 'p06', src: 'images/photo-06.jpg', title: '' },
  { id: 'p07', src: 'images/photo-07.jpg', title: '' },
  { id: 'p08', src: 'images/photo-08.jpg', title: '' },
  { id: 'p09', src: 'images/photo-09.jpg', title: '' },
  { id: 'p10', src: 'images/photo-10.jpg', title: '' },
  { id: 'p11', src: 'images/photo-11.jpg', title: '' },
  { id: 'p12', src: 'images/photo-12.jpg', title: '' },
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
        else globeApp.onShow();
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

// 熱區點擊事件綁定
document.getElementById('home-hotzone').addEventListener('click', () => goTo('welcome', 'forward'));
document.getElementById('enter-hotzone').addEventListener('click', () => goTo('globe', 'forward'));
document.getElementById('globe-back').addEventListener('click', () => goTo('welcome', 'backward'));
document.getElementById('globe-next').addEventListener('click', () => goTo('media', 'forward'));
document.getElementById('media-back').addEventListener('click', () => goTo('globe', 'backward'));

// ESC 返回上一頁
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (mediaApp.editModalOpen)   { mediaApp.closeEditModal(); return; }
    if (mediaApp.confirmOpen)     { mediaApp.closeConfirm(); return; }
    if (lightbox.isOpen)          { lightbox.close(); return; }
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
// 3. 3D 深色磨砂球體展廳
// ============================================================
function fallbackTexture() {
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
  ctx.fillText('影像佔位', W / 2, H / 2);
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

    this.buildCards();
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

  async buildCards() {
    const items = PHOTOS.filter(p => p.src);
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
        lightbox.open(card.userData.item.src);
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
// 4. 頁面初始狀態
// ============================================================
// 首頁即為初始頁面，無需額外加載動畫

// ============================================================
// 5. 媒體滑動區（Stage 4）
// 仿 beckyentertainment.co/media：水平滑動卡片
// 支援瀏覽/管理模式、上傳/刪除/編輯
// ============================================================
const MEDIA_STORAGE_KEY = 'anpu-archive-media-v1';
const DEFAULT_MEDIA = [
  // 三個示範卡片（純文字，呼應 becky 站點的條目）
  { id: 'm_001', type: 'text', src: '',     text: 'Represented by LUNARI Global',         title: 'REPRESENTED BY LUNARI GLOBAL' },
  { id: 'm_002', type: 'text', src: '',     text: 'BIOACTIVE+ Presenter',                  title: 'BIOACTIVE+ PRESENTER' },
  { id: 'm_003', type: 'text', src: '',     text: 'Represented by WILD Record Label',     title: 'REPRESENTED BY WILD RECORD LABEL' },
  { id: 'm_004', type: 'text', src: '',     text: "TOD'S Brand Ambassador",               title: "TOD'S BRAND AMBASSADOR" },
  { id: 'm_005', type: 'text', src: '',     text: 'Tao Kae Noi Brand Ambassador',          title: 'TAO KAE NOI BRAND AMBASSADOR' },
  { id: 'm_006', type: 'text', src: '',     text: 'Represented by Creative Artists Agency (CAA)', title: 'REPRESENTED BY CREATIVE ARTISTS AGENCY (CAA)' },
  { id: 'm_007', type: 'text', src: '',     text: 'Sunsilk Thailand Brand Presenter',     title: 'SUNSILK THAILAND BRAND PRESENTER' },
  { id: 'm_008', type: 'text', src: '',     text: 'OPPO Thailand Presenter',               title: 'OPPO THAILAND PRESENTER' },
  { id: 'm_009', type: 'text', src: '',     text: 'First Muse of Harper\'s BAZAAR Thailand', title: "FIRST MUSE OF HARPER'S BAZAAR THAILAND" },
  { id: 'm_010', type: 'text', src: '',     text: 'L\'Oréal Paris Ambassador',             title: "L'ORÉAL PARIS AMBASSADOR" }
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
  editConfirm: null,
  editCancel: null,
  confirmModal: null,
  confirmDelete: null,
  confirmCancel: null,
  toggleBtns: null,

  data: [],
  mode: 'view',           // 'view' | 'manage'
  editModalOpen: false,
  confirmOpen: false,
  editTargetId: null,     // 編輯時的目標 id；null 代表新增
  pendingDeleteId: null,  // 待刪除的 id

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
    this.editConfirm = document.getElementById('media-edit-confirm');
    this.editCancel = document.getElementById('media-edit-cancel');
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
        if (Array.isArray(arr)) { this.data = arr; return; }
      }
    } catch (e) { /* 忽略，採用預設 */ }
    this.data = DEFAULT_MEDIA.slice();
    this.persist();
  },

  persist() {
    try { localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(this.data)); }
    catch (e) { console.warn('media persist failed', e); }
  },

  bindEvents() {
    // 模式切換
    this.toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });

    // 上傳檔案
    this.fileInput.addEventListener('change', e => {
      const files = Array.from(e.target.files || []);
      files.forEach(f => this.uploadFile(f));
      e.target.value = '';
    });

    // 新增純文字條目
    this.addTextBtn.addEventListener('click', () => this.openEditModal(null, true));

    // 編輯對話框
    this.editCancel.addEventListener('click', () => this.closeEditModal());
    this.editConfirm.addEventListener('click', () => this.saveEdit());
    this.editModal.addEventListener('click', e => {
      if (e.target === this.editModal) this.closeEditModal();
    });

    // 刪除確認對話框
    this.confirmCancel.addEventListener('click', () => this.closeConfirm());
    this.confirmDelete.addEventListener('click', () => this.confirmDeleteNow());
    this.confirmModal.addEventListener('click', e => {
      if (e.target === this.confirmModal) this.closeConfirm();
    });

    // Enter 儲存（Shift+Enter 換行）
    this.editTitleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.saveEdit(); }
    });
    this.editTextInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.saveEdit(); }
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

    // 圖片 / 純文字 容器
    const wrap = document.createElement('div');
    wrap.className = 'media-slide-image-wrap' + (item.type === 'text' ? ' is-text' : '');
    wrap.addEventListener('click', e => {
      // 管理模式下點圖片 → 編輯
      if (this.mode === 'manage') { e.stopPropagation(); this.openEditModal(item.id, false); return; }
      // 瀏覽模式：點圖片開放大預覽
      if (item.type === 'image' && item.src) lightbox.open(item.src);
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

    // 刪除按鈕
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

    // 標題
    const title = document.createElement('h3');
    title.className = 'media-slide-title';
    title.textContent = item.title || '';

    slide.appendChild(wrap);
    slide.appendChild(title);
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
      title: (file.name || '未命名媒體').replace(/\.[^.]+$/, '').slice(0, 60) || '未命名媒體'
    };
    this.data.push(item);
    this.persist();
    this.render();
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
    if (isNew) {
      this.editTitleInput.value = '';
      this.editTextInput.value = '';
    } else {
      const item = this.data.find(x => x.id === id);
      if (!item) return;
      this.editTitleInput.value = item.title || '';
      this.editTextInput.value = item.text || '';
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
  },

  saveEdit() {
    const title = this.editTitleInput.value.trim() || '未命名條目';
    const text  = this.editTextInput.value.trim();

    if (this.editTargetId) {
      const item = this.data.find(x => x.id === this.editTargetId);
      if (item) {
        item.title = title;
        item.text  = text;
        if (item.type === 'text' && !text) {
          // 純文字條目若無內容，給個提示後返回
          this.editTextInput.focus();
          return;
        }
      }
    } else {
      // 新增純文字條目
      if (!text) { this.editTextInput.focus(); return; }
      this.data.push({
        id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        type: 'text',
        src: '',
        text,
        title
      });
    }
    this.persist();
    this.render();
    this.closeEditModal();
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
    this.closeConfirm();
  },

  // ===== 切換可見性 =====
  onShow() {
    if (!this.el) this.init();
    this.render();
  },

  onHide() {
    // 關閉所有彈窗，避免殘留
    if (this.editModalOpen)  this.closeEditModal();
    if (this.confirmOpen)    this.closeConfirm();
  }
};

// 初始化媒體模組
mediaApp.init();
