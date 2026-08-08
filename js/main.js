/* ==========================================
   安溥的數字藏館 · Anpu's Digital Archive
   Main Application — v6
   ========================================== */

import * as THREE from 'three';

// ============================================================
//  DEFAULT DATA
// ============================================================
const DEFAULT_DATA = {
  photos: [
    { id: 'p1', category: 'sphere', title: '關於我愛你', src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=70' },
    { id: 'p2', category: 'sphere', title: '玫瑰色的你', src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=70' },
    { id: 'p3', category: 'sphere', title: '南國的孩子', src: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=70' },
    { id: 'p4', category: 'sphere', title: '年輕時的相片', src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=70' },
    { id: 'p5', category: 'sphere', title: '我想你要走了', src: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=70' },
    { id: 'p6', category: 'sphere', title: '喜歡', src: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=600&q=70' },
    { id: 'p7', category: 'sphere', title: '城市', src: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=600&q=70' },
    { id: 'p8', category: 'sphere', title: '人事已非', src: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=600&q=70' },
    { id: 'p9', category: 'sphere', title: '日常', src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=70' },
    { id: 'p10', category: 'sphere', title: '肖像', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=70' },
    { id: 'p11', category: 'sphere', title: '特寫', src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=70' },
    { id: 'p12', category: 'sphere', title: '凝視', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=70' },
    { id: 'm1', category: 'flat', title: '旋律', src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=70' },
    { id: 'm2', category: 'flat', title: '節奏', src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=70' },
    { id: 'm3', category: 'flat', title: '餘韻', src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=70' },
    { id: 'm4', category: 'flat', title: '現場', src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=70' },
    { id: 'm5', category: 'flat', title: '光影', src: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&q=70' },
    { id: 'm6', category: 'flat', title: '樂章', src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=70' },
    { id: 'm7', category: 'flat', title: '錄音間', src: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&q=70' },
    { id: 'm8', category: 'flat', title: '舞台', src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=70' },
  ],
  quotes: [
    { id: 'q1', category: 'sphere', text: '我擁有的都是僥倖，我失去的都是人生。' },
    { id: 'q2', category: 'sphere', text: '在所有人事已非的景色裡，我最喜歡你。' },
    { id: 'q3', category: 'sphere', text: '你是我在這個世界上，唯一的唯一。' },
    { id: 'q4', category: 'sphere', text: '關於我愛你。' },
    { id: 'q5', category: 'sphere', text: '我想你要走了。' },
    { id: 'q6', category: 'sphere', text: '南國的孩子。' },
    { id: 'q7', category: 'flat', text: '日子。' },
    { id: 'q8', category: 'flat', text: '喜歡。' },
    { id: 'q9', category: 'flat', text: '留下來，或者我跟你走。' },
    { id: 'q10', category: 'flat', text: '如果這就是最後了，謝謝你曾經來過。' },
    { id: 'q11', category: 'flat', text: '你是我眼中的一滴淚。' },
    { id: 'q12', category: 'flat', text: '讓我們走到這裡。' },
  ],
};

// ============================================================
//  STORAGE
// ============================================================
let cloudStorage = null;

async function initStorage() {
  if (window.GitHubStorage) {
    cloudStorage = window.GitHubStorage;
  }
  return cloudStorage;
}

async function loadArchive() {
  if (!cloudStorage) await initStorage();
  const data = await cloudStorage.fetchData();
  const allPhotos = [...DEFAULT_DATA.photos];
  const allQuotes = [...DEFAULT_DATA.quotes];
  if (data.photos) {
    data.photos.forEach(p => {
      const idx = allPhotos.findIndex(dp => dp.id === p.id);
      if (idx >= 0) allPhotos[idx] = p;
      else allPhotos.push(p);
    });
  }
  if (data.quotes) {
    data.quotes.forEach(q => {
      const idx = allQuotes.findIndex(dq => dq.id === q.id);
      if (idx >= 0) allQuotes[idx] = q;
      else allQuotes.push(q);
    });
  }
  return { photos: allPhotos, quotes: allQuotes };
}

async function saveArchive(data) {
  if (!cloudStorage) await initStorage();
  return cloudStorage.saveData(data);
}

// ============================================================
//  UTILITY
// ============================================================
function randomBetween(min, max) { return min + Math.random() * (max - min); }

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  STAGE MANAGER
// ============================================================
class StageManager {
  constructor() {
    this.stages = {
      home:   document.getElementById('home-stage'),
      welcome: document.getElementById('welcome-stage'),
      globe:  document.getElementById('globe-stage'),
    };
    this.transWipe = document.getElementById('trans-wipe');
    this.current = 'home';
  }

  async transitionTo(name) {
    if (this.current === name) return;
    this.transWipe.classList.remove('play');
    void this.transWipe.offsetWidth;
    this.transWipe.classList.add('play');
    await wait(400);
    this.current = name;
    Object.values(this.stages).forEach(s => s.classList.remove('stage-active'));
    if (this.stages[name]) this.stages[name].classList.add('stage-active');
    await wait(450);
    this.transWipe.classList.remove('play');
    window.dispatchEvent(new CustomEvent('stage-changed', { detail: { stage: name } }));
  }
}

// ============================================================
//  STAGE 1: 首頁
// ============================================================
class HomeStage {
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.stage = document.getElementById('home-stage');
    this.bg = document.getElementById('home-bg');
    this.hotzone = document.getElementById('home-hotzone');
    this.applyDefaultBg();
    this.bindEvents();
  }

  applyDefaultBg() {
    const stored = localStorage.getItem('anpu-home-bg');
    if (stored) {
      this.bg.style.backgroundImage = `url(${stored})`;
    }
  }

  bindEvents() {
    this.hotzone.addEventListener('click', () => {
      this.stageManager.transitionTo('welcome');
    });
  }
}

// ============================================================
//  STAGE 2: 進館頁
// ============================================================
class WelcomeStage {
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.stage = document.getElementById('welcome-stage');
    this.bg = document.getElementById('welcome-bg');
    this.enterHotzone = document.getElementById('enter-hotzone');
    this.applyDefaultBg();
    this.bindEvents();
  }

  applyDefaultBg() {
    const stored = localStorage.getItem('anpu-welcome-bg');
    if (stored) {
      this.bg.style.backgroundImage = `url(${stored})`;
    }
  }

  bindEvents() {
    this.enterHotzone.addEventListener('click', () => {
      this.stageManager.transitionTo('globe');
      window.dispatchEvent(new CustomEvent('globe-stage-ready'));
    });
  }
}

// ============================================================
//  3D PHOTO SPHERE
// ============================================================
class PhotoSphere {
  constructor() {
    this.container = document.getElementById('globe-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphereGroup = null;
    this.tiles = [];
    this.data = { photos: [], quotes: [] };

    this.isDragging = false;
    this.hasMoved = false;
    this.lastPointer = { x: 0, y: 0 };
    this.rotX = 0.2;
    this.rotY = 0;
    this.velX = 0;
    this.velY = 0;
    this.autoRotateSpeed = 0.0012;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
    this.loadData();
  }

  init() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 500);
    this.camera.position.set(0, 0, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    this.stars = this.createStars();
    this.scene.add(this.stars);

    this.sphereGroup = new THREE.Group();
    this.scene.add(this.sphereGroup);

    this.bindInteraction();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  createStars() {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.04, sizeAttenuation: true,
      transparent: true, opacity: 0.3, depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  async loadData() {
    try {
      this.data = await loadArchive();
      this.buildSphere();
    } catch (e) {
      console.error('載入數據失敗:', e);
      this.data = { photos: [], quotes: [] };
      this.buildSphere();
    }
  }

  buildSphere() {
    this.tiles.forEach(t => {
      this.sphereGroup.remove(t);
      if (t.material?.map) t.material.map.dispose();
      t.geometry?.dispose();
    });
    this.tiles = [];

    const RADIUS = 2.8;
    const items = [];

    this.data.photos.filter(p => p.category === 'sphere').forEach(p => items.push({ kind: 'photo', data: p }));
    this.data.quotes.filter(q => q.category === 'sphere').forEach(q => items.push({ kind: 'quote', data: q }));

    if (items.length === 0) {
      const placeholder = this.createTextTile('上傳你的第一張照片', 1.2, 0.6);
      placeholder.position.set(0, 0, RADIUS);
      placeholder.lookAt(0, 0, 0);
      this.sphereGroup.add(placeholder);
      this.tiles.push(placeholder);
      return;
    }

    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const N = items.length;

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / Math.max(N - 1, 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = GOLDEN * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const item = items[i];

      const sizeRand = Math.random();
      let w, h;
      if (item.kind === 'photo') {
        const isLarge = sizeRand > 0.82;
        const baseScale = isLarge ? randomBetween(1.05, 1.3) : randomBetween(0.55, 0.95);
        w = baseScale;
        h = baseScale * 1.35;
      } else {
        w = randomBetween(0.5, 0.75);
        h = w * 0.5;
      }

      const offset = randomBetween(-0.25, 0.25);
      const finalR = RADIUS + offset;
      const pos = new THREE.Vector3(x * finalR, y * finalR, z * finalR);

      let tile;
      if (item.kind === 'photo') {
        tile = this.createPhotoTile(item.data, w, h);
      } else {
        tile = this.createTextTile(item.data.text, w, h);
      }

      tile.position.copy(pos);
      tile.lookAt(pos.clone().multiplyScalar(2));
      tile.rotateZ(randomBetween(-0.4, 0.4));
      tile.rotateX(randomBetween(-0.25, 0.25));
      tile.rotateY(randomBetween(-0.25, 0.25));

      tile.userData = {
        category: 'sphere',
        itemData: item.data,
        itemKind: item.kind,
        tileIndex: this.tiles.length,
      };

      tile.material.transparent = true;
      tile.material.opacity = 1.0;
      tile.material.depthWrite = false;

      this.sphereGroup.add(tile);
      this.tiles.push(tile);
    }
  }

  createPhotoTile(photo, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 432;
    const ctx = canvas.getContext('2d');

    const hue = (parseInt((photo.id || '').replace(/\D/g, '')) || 1) * 47 % 360;
    const grad = ctx.createLinearGradient(0, 0, 320, 432);
    grad.addColorStop(0, `hsl(${hue}, 30%, 35%)`);
    grad.addColorStop(1, `hsl(${(hue + 30) % 360}, 25%, 20%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 432);

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, 296, 408);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 24px "Noto Serif TC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(photo.title || '照片', 160, 216);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);

    const src = photo.src || photo.dataURL;
    if (src) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(src,
        (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.needsUpdate = true;
        },
        undefined,
        () => { /* 失敗就保持佔位 */ }
      );
    }

    return mesh;
  }

  createTextTile(text, w, h) {
    const cw = 512, ch = 200;
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.fillStyle = '#111';
    ctx.font = '600 30px "Noto Serif TC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = text.split('\n');
    const lineH = 38;
    const startY = ch / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, cw / 2, startY + i * lineH);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const geo = new THREE.PlaneGeometry(w, h * (ch / cw));
    return new THREE.Mesh(geo, mat);
  }

  // ----- 互動 -----
  bindInteraction() {
    const c = this.renderer.domElement;
    c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    c.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
  }

  onPointerDown(e) {
    this.isDragging = true;
    this.hasMoved = false;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) this.hasMoved = true;

    this.rotY += dx * 0.005;
    this.rotX += dy * 0.005;
    this.rotX = Math.max(-1.3, Math.min(1.3, this.rotX));
    this.velY = dx * 0.0006;
    this.velX = dy * 0.0006;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!this.hasMoved) {
      this.handleClick(e);
    }
  }

  handleClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const visibleTiles = this.tiles.filter(t => t.material.opacity > 0.1);
    const hits = this.raycaster.intersectObjects(visibleTiles, false);
    if (hits.length > 0) {
      this.openTileDetail(hits[0].object);
    }
  }

  openTileDetail(tile) {
    const item = tile.userData.itemData;
    const kind = tile.userData.itemKind;
    window.dispatchEvent(new CustomEvent('open-tile', {
      detail: {
        item, kind, category: 'sphere',
        position: tile.position.clone(),
        index: tile.userData.tileIndex,
      },
    }));
  }

  onWheel(e) {
    e.preventDefault();
    this.rotY += e.deltaY * 0.001;
  }

  onResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.sphereGroup) {
      if (!this.isDragging) {
        this.rotY += this.autoRotateSpeed + this.velY;
        this.rotX += this.velX;
        this.rotX = Math.max(-1.3, Math.min(1.3, this.rotX));
        this.velY *= 0.94;
        this.velX *= 0.94;
      }
      this.sphereGroup.rotation.y = this.rotY;
      this.sphereGroup.rotation.x = this.rotX;
    }

    if (this.stars) this.stars.rotation.y += 0.00015;
    this.renderer.render(this.scene, this.camera);
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }

  async rebuild() {
    await this.loadData();
  }
}

// ============================================================
//  FLAT GRID VIEW (平铺)
// ============================================================
class FlatGridView {
  constructor() {
    this.container = document.getElementById('flat-container');
    this.track = document.getElementById('flat-track');
    this.data = { photos: [], quotes: [] };

    this.isDown = false;
    this.startX = 0;
    this.scrollStart = 0;
    this.hasMoved = false;
    this.currentX = 0;

    this.init();
    this.loadData();
  }

  init() {
    this.track.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
    this.track.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    this.container.classList.add('hidden');
  }

  async loadData() {
    try {
      this.data = await loadArchive();
      this.buildGrid();
    } catch (e) {
      console.error('載入失敗:', e);
    }
  }

  buildGrid() {
    this.track.innerHTML = '';
    const items = [];
    this.data.photos.filter(p => p.category === 'flat').forEach(p => items.push({ kind: 'photo', data: p }));
    this.data.quotes.filter(q => q.category === 'flat').forEach(q => items.push({ kind: 'quote', data: q }));

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'flat-empty';
      empty.innerHTML = '<p>上傳照片到平铺</p>';
      this.track.appendChild(empty);
      return;
    }

    // 3-row grid with random row assignment (becky 風)
    const rows = [[], [], []];
    items.forEach((item, i) => {
      rows[i % 3].push(item);
    });

    rows.forEach((rowItems, rowIdx) => {
      const row = document.createElement('div');
      row.className = 'flat-row';
      row.style.setProperty('--row-offset', (rowIdx * 20) + 'px');

      rowItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = `flat-card ${item.kind}`;
        card.dataset.id = item.data.id;
        card.dataset.kind = item.kind;

        if (item.kind === 'photo') {
          const imgSrc = item.data.dataURL || item.data.src || '';
          card.innerHTML = `
            <div class="fc-img-wrap">
              <img src="${imgSrc}" alt="${item.data.title || ''}" draggable="false">
            </div>
            <div class="fc-info">
              <span class="fc-title">${item.data.title || '未命名'}</span>
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="fc-quote">
              <p>${item.data.text}</p>
            </div>
          `;
        }

        card.addEventListener('click', () => this.onCardClick(item));
        row.appendChild(card);
      });

      this.track.appendChild(row);
    });
  }

  onCardClick(item) {
    if (this.hasMoved) return;
    window.dispatchEvent(new CustomEvent('open-tile', {
      detail: {
        item: item.data,
        kind: item.kind,
        category: 'flat',
      },
    }));
  }

  onPointerDown(e) {
    this.isDown = true;
    this.hasMoved = false;
    this.startX = e.clientX;
    this.currentX = e.clientX;
    this.scrollStart = this.track.scrollLeft;
    this.track.style.cursor = 'grabbing';
  }

  onPointerMove(e) {
    if (!this.isDown) return;
    e.preventDefault();
    const dx = e.clientX - this.startX;
    if (Math.abs(dx) > 3) this.hasMoved = true;
    this.track.scrollLeft = this.scrollStart - dx;
  }

  onPointerUp() {
    this.isDown = false;
    this.track.style.cursor = 'grab';
  }

  onWheel(e) {
    e.preventDefault();
    this.track.scrollLeft += e.deltaY || e.deltaX;
  }

  show() {
    this.container.classList.remove('hidden');
    this.track.style.cursor = 'grab';
  }

  hide() {
    this.container.classList.add('hidden');
  }

  async rebuild() {
    await this.loadData();
  }
}

// ============================================================
//  DETAIL PANEL
// ============================================================
class DetailPanel {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.backdrop = document.getElementById('detail-backdrop');
    this.img = document.getElementById('detail-img');
    this.content = document.getElementById('detail-content');
    this.closeBtn = document.getElementById('detail-close');
    this.editBtn = document.getElementById('detail-edit');
    this.deleteBtn = document.getElementById('detail-delete');
    this.titleInput = document.getElementById('detail-title-input');
    this.saveTitleBtn = document.getElementById('detail-save-title');
    this.titleEditor = document.getElementById('detail-title-editor');

    this.currentItem = null;
    this.currentKind = null;
    this.currentCategory = null;

    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.editBtn.addEventListener('click', () => this.toggleEdit());
    this.deleteBtn.addEventListener('click', () => this.deleteItem());
    this.saveTitleBtn.addEventListener('click', () => this.saveTitle());

    window.addEventListener('open-tile', (e) => this.open(e.detail));
  }

  open(detail) {
    this.currentItem = detail.item;
    this.currentKind = detail.kind;
    this.currentCategory = detail.category;

    const item = detail.item;
    const catLabel = detail.category === 'flat' ? '平铺' : '球覽';
    const title = item.title || item.caption || item.text || '未命名';
    const body = detail.kind === 'quote' ? item.text : '';

    // 圖片
    if (detail.kind === 'photo') {
      this.img.style.display = 'block';
      const imgEl = document.getElementById('detail-img-el');
      imgEl.src = item.dataURL || item.src || '';
      imgEl.onerror = () => { this.img.style.display = 'none'; };
    } else {
      this.img.style.display = 'none';
    }

    this.content.innerHTML = `
      <div class="dp-cat">${catLabel}</div>
      <h2 class="dp-title">${title}</h2>
      ${body ? `<p class="dp-body">${body.replace(/\n/g, '<br>')}</p>` : ''}
    `;

    this.titleInput.value = title;
    this.titleEditor.classList.remove('show');
    this.panel.classList.add('active');
  }

  close() {
    this.panel.classList.remove('active');
    this.currentItem = null;
  }

  toggleEdit() {
    this.titleEditor.classList.toggle('show');
  }

  async saveTitle() {
    if (!this.currentItem) return;
    const newTitle = this.titleInput.value.trim();
    if (!newTitle) return;

    this.currentItem.title = newTitle;

    this.content.querySelector('.dp-title').textContent = newTitle;
    this.titleEditor.classList.remove('show');

    try {
      const data = await loadArchive();
      const list = this.currentKind === 'photo' ? data.photos : data.quotes;
      const idx = list.findIndex(i => i.id === this.currentItem.id);
      if (idx >= 0) list[idx] = this.currentItem;
      await saveArchive(data);
      if (window.app) {
        if (this.currentCategory === 'sphere' && window.app.sphere) await window.app.sphere.rebuild();
        if (this.currentCategory === 'flat' && window.app.flatView) await window.app.flatView.rebuild();
      }
    } catch (e) {
      console.error('保存標題失敗:', e);
    }
  }

  async deleteItem() {
    if (!this.currentItem) return;
    if (!confirm(`確定要刪除「${this.currentItem.title || this.currentItem.text || ''}」嗎？`)) return;

    try {
      const data = await loadArchive();
      const list = this.currentKind === 'photo' ? data.photos : data.quotes;
      const idx = list.findIndex(i => i.id === this.currentItem.id);
      if (idx >= 0) list.splice(idx, 1);

      await saveArchive(data);
      this.close();

      if (window.app) {
        if (this.currentCategory === 'sphere' && window.app.sphere) await window.app.sphere.rebuild();
        if (this.currentCategory === 'flat' && window.app.flatView) await window.app.flatView.rebuild();
      }
    } catch (e) {
      console.error('刪除失敗:', e);
      alert('刪除失敗，請重試');
    }
  }
}

// ============================================================
//  UPLOAD MODAL
// ============================================================
class UploadModal {
  constructor() {
    this.modal = document.getElementById('upload-modal');
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.closeBtn = document.getElementById('upload-close');
    this.photoInput = document.getElementById('photo-input');
    this.photoPreview = document.getElementById('photo-preview');
    this.photoQueue = [];

    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.textTab = document.querySelector('[data-pane="text"]');
    this.photoTab = document.querySelector('[data-pane="photo"]');
    this.textInput = document.getElementById('text-input');
    this.submitBtn = document.getElementById('photo-submit');

    this.bindEvents();
  }

  bindEvents() {
    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.photoInput.addEventListener('change', (e) => this.onFiles(e.target.files));
    this.submitBtn.addEventListener('click', () => this.submitPhotos());
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    document.getElementById('text-submit').addEventListener('click', () => this.submitText);
  }

  switchTab(name) {
    this.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    this.photoTab.classList.toggle('active', name === 'photo');
    this.textTab.classList.toggle('active', name === 'text');
  }

  open() { this.modal.classList.add('active'); }
  close() { this.modal.classList.remove('active'); }

  async onFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const dataURL = await fileToDataURL(file);
      this.photoQueue.push({ id: generateId(), dataURL, name: file.name, title: '', category: 'sphere' });
    }
    this.renderPreview();
  }

  renderPreview() {
    this.photoPreview.innerHTML = '';
    this.photoQueue.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `
        <img src="${item.dataURL}" alt="">
        <input type="text" class="pi-title" placeholder="輸入標題" value="${item.title}">
        <select class="pi-cat">
          <option value="sphere" ${item.category === 'sphere' ? 'selected' : ''}>球覽</option>
          <option value="flat" ${item.category === 'flat' ? 'selected' : ''}>平铺</option>
        </select>
        <button class="pi-del" data-idx="${idx}">×</button>
      `;
      this.photoPreview.appendChild(div);
    });

    this.submitBtn.style.display = this.photoQueue.length > 0 ? 'flex' : 'none';

    this.photoPreview.querySelectorAll('.pi-title').forEach(inp => {
      inp.addEventListener('input', e => { this.photoQueue[+e.target.parentElement.querySelector('.pi-del').dataset.idx].title = e.target.value; });
    });
    this.photoPreview.querySelectorAll('.pi-cat').forEach(sel => {
      sel.addEventListener('change', e => { this.photoQueue[+e.target.parentElement.querySelector('.pi-del').dataset.idx].category = e.target.value; });
    });
    this.photoPreview.querySelectorAll('.pi-del').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = +btn.dataset.idx;
        this.photoQueue.splice(idx, 1);
        this.renderPreview();
      });
    });
  }

  async submitPhotos() {
    if (this.photoQueue.length === 0) return;

    const newPhotos = [];
    for (const item of this.photoQueue) {
      try {
        if (cloudStorage?.enabled) {
          const file = this.dataURLtoFile(item.dataURL, item.name);
          const result = await cloudStorage.uploadImage(file, item.name);
          newPhotos.push({
            id: item.id,
            category: item.category,
            title: item.title || '未命名',
            src: result.url,
            sha: result.sha,
            path: result.path,
            dataURL: item.dataURL,
          });
        } else {
          newPhotos.push({
            id: item.id,
            category: item.category,
            title: item.title || '未命名',
            src: item.dataURL,
            dataURL: item.dataURL,
          });
        }
      } catch (e) {
        console.error('上傳失敗:', e);
      }
    }

    const data = await loadArchive();
    data.photos.push(...newPhotos);
    await saveArchive(data);

    this.photoQueue = [];
    this.renderPreview();
    this.close();

    if (window.app) {
      if (window.app.sphere) await window.app.sphere.rebuild();
      if (window.app.flatView) await window.app.flatView.rebuild();
    }
  }

  async submitText() {
    const text = this.textInput.value.trim();
    if (!text) return;

    const quote = {
      id: generateId(),
      category: 'sphere',
      text,
      title: text.slice(0, 30),
    };

    const data = await loadArchive();
    data.quotes.push(quote);
    await saveArchive(data);

    this.textInput.value = '';
    this.close();

    if (window.app?.sphere) await window.app.sphere.rebuild();
  }

  dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  }
}

// ============================================================
//  APP
// ============================================================
class App {
  constructor() {
    this.stageManager = new StageManager();
    this.homeStage = new HomeStage(this.stageManager);
    this.welcomeStage = new WelcomeStage(this.stageManager);
    this.detailPanel = new DetailPanel();
    this.uploadModal = new UploadModal();
    this.sphere = null;
    this.flatView = null;
    this.currentMode = 'sphere';

    document.getElementById('add-button').addEventListener('click', () => {
      this.uploadModal.open();
    });

    document.querySelectorAll('.globe-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    window.addEventListener('globe-stage-ready', async () => {
      if (!this.sphere) this.sphere = new PhotoSphere();
      if (!this.flatView) this.flatView = new FlatGridView();
      this.applyMode('sphere');
    });

    window.addEventListener('load', () => this.onLoad());
    window.app = this;
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;
    document.querySelectorAll('.globe-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    this.applyMode(mode);
  }

  applyMode(mode) {
    this.currentMode = mode;
    if (mode === 'sphere') {
      if (this.sphere) this.sphere.show();
      if (this.flatView) this.flatView.hide();
      document.getElementById('globe-container').style.display = 'block';
      const container = document.getElementById('flat-container');
      container.classList.add('hidden');
    } else {
      if (this.sphere) this.sphere.hide();
      if (this.flatView) this.flatView.show();
      document.getElementById('globe-container').style.display = 'none';
      const container = document.getElementById('flat-container');
      container.classList.remove('hidden');
    }
  }

  async onLoad() {
    try {
      await loadArchive();
      console.log('[App] 數據載入完成');
    } catch (e) {
      console.warn('[App] 預載入失敗:', e);
    }
  }
}

// ============================================================
//  BOOT
// ============================================================
function hideLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.classList.add('hidden');
}

window.addEventListener('load', () => {
  setTimeout(() => {
    try {
      new App();
    } catch (e) {
      console.error('[Boot] App 初始化失敗:', e);
    } finally {
      hideLoadingIndicator();
    }
  }, 100);
});

// 兜底:若 5 秒後仍未隱藏,強制隱藏載入指示器
setTimeout(hideLoadingIndicator, 5000);
