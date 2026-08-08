/* ============================================================
   安溥的數字藏館 · Anpu's Digital Archive
   Main Application — 純靜態 · 本地素材 · 無外部爬取
   ============================================================ */

import * as THREE from 'three';

// ============================================================
//  DATA LAYER — 單一資料來源：
//  1) 優先讀取 config.js 內 ARCHIVE_CONFIG (使用者手動設定)
//  2) 再加上根目錄 _index.json (選擇性：使用者直接把檔案
//     放進 photos/ texts/ 後，手動維護一份檔名清單即可)
// ============================================================
function getBasePath() {
  // 純靜態站：一律相對於 index.html 位置
  return './';
}

function addCacheBust(url) {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'v=' + (window.__CACHE_BUST || (window.__CACHE_BUST = Date.now().toString(36)));
}

function randomBetween(min, max) { return min + Math.random() * (max - min); }
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// 簡易中文換行
function wrapText(text, maxChars = 10) {
  if (!text) return [''];
  const raw = text.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
  if (raw.length === 0) return [''];
  const out = [];
  raw.forEach(line => {
    let remaining = line;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) { out.push(remaining); break; }
      let cut = maxChars;
      const punct = /[，。！？、；：,.!?;:]/;
      while (cut < remaining.length && punct.test(remaining[cut]) && cut > maxChars - 3) cut--;
      out.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
  });
  return out.length ? out : [''];
}

const PHOTO_EXT = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
const TEXT_EXT  = /\.(txt|md)$/i;

// 嘗試讀取根目錄 _index.json（使用者可手動維護，也可以完全沒有）
async function loadIndexJSON() {
  try {
    const base = getBasePath();
    const res = await fetch(base + '_index.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch (_) { /* 忽略：沒有 _index.json 也完全可以跑 */ }
  return null;
}

// 讀取 .txt 文字檔內容（_index.json 有列出時才會載入）
async function fetchTextFile(url) {
  try {
    const res = await fetch(addCacheBust(url), { cache: 'no-store' });
    if (!res.ok) return '';
    return (await res.text() || '').trim();
  } catch (e) {
    console.warn('[Text] 讀取失敗:', url, e?.message);
    return '';
  }
}

// 合併 config + _index.json 成為最終 {photos, quotes}
async function loadArchive() {
  const cfg = (window.ARCHIVE_CONFIG && window.ARCHIVE_CONFIG.photos)
    ? window.ARCHIVE_CONFIG
    : { photos: [], quotes: [], backgrounds: {} };

  // 套用背景（無論 _index 有沒有都先套）
  applyBackgrounds(cfg.backgrounds);

  const photos = [...(cfg.photos || [])];
  const quotes = [...(cfg.quotes || [])];

  // _index.json: 讓使用者直接把圖/文放進 photos/ texts/ 資料夾，
  // 並在 _index.json 列出檔名即可，不需要改 config.js
  const idx = await loadIndexJSON();
  if (idx) {
    const base = getBasePath();
    // photos
    (idx.photos || []).forEach((name, i) => {
      if (!PHOTO_EXT.test(name)) return;
      const src = base + 'photos/' + encodeURIComponent(name);
      const baseName = String(name).replace(PHOTO_EXT, '');
      photos.push({
        id: 'idx-p-' + i + '-' + baseName,
        src: addCacheBust(src),
        title: baseName.replace(/[-_]+/g, ' '),
      });
    });
    // texts
    for (let i = 0; i < (idx.texts || []).length; i++) {
      const name = idx.texts[i];
      if (!TEXT_EXT.test(name)) continue;
      const url = base + 'texts/' + encodeURIComponent(name);
      const content = await fetchTextFile(url);
      if (!content) continue;
      const segments = content.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      const chunks = segments.length > 0 ? segments : [content];
      const baseName = String(name).replace(TEXT_EXT, '');
      chunks.forEach((text, ci) => {
        quotes.push({
          id: 'idx-q-' + i + '-' + ci + '-' + baseName,
          text: text.slice(0, 240),
          audio: '', // 文字資料夾不附音檔；要配音檔請在 config.js 手動加
        });
      });
    }
  }

  return { photos, quotes };
}

// 把設定的兩張背景圖套用到 home/welcome stage（容錯：檔案不存在就顯示預設）
function applyBackgrounds(bgs) {
  const home    = document.getElementById('home-bg');
  const welcome = document.getElementById('welcome-bg');
  if (home    && bgs?.home)    home.style.backgroundImage    = "url('" + bgs.home + "')";
  if (welcome && bgs?.welcome) welcome.style.backgroundImage = "url('" + bgs.welcome + "')";
}

// ============================================================
//  STAGE MANAGER (頁面切換)
// ============================================================
class StageManager {
  constructor() {
    this.stages = {
      home:    document.getElementById('home-stage'),
      welcome: document.getElementById('welcome-stage'),
      globe:   document.getElementById('globe-stage'),
    };
    this.transWipe = document.getElementById('trans-wipe');
    this.current = 'home';
  }
  async transitionTo(name) {
    if (this.current === name) return;
    this.transWipe.classList.remove('play');
    void this.transWipe.offsetWidth;
    this.transWipe.classList.add('play');
    await wait(500);
    this.current = name;
    Object.values(this.stages).forEach(s => s.classList.remove('stage-active'));
    if (this.stages[name]) this.stages[name].classList.add('stage-active');
    await wait(500);
    this.transWipe.classList.remove('play');
    window.dispatchEvent(new CustomEvent('stage-changed', { detail: { stage: name } }));
  }
}

// ============================================================
//  STAGE 1 / 2 (首頁 / 過渡頁)
// ============================================================
class HomeStage {
  constructor(sm) {
    this.sm = sm;
    const go = () => this.sm.transitionTo('welcome');
    document.getElementById('home-hotzone')?.addEventListener('click', go);
    document.getElementById('home-enter-btn')?.addEventListener('click', go);
  }
}
class WelcomeStage {
  constructor(sm) {
    this.sm = sm;
    const go = () => {
      this.sm.transitionTo('globe');
      window.dispatchEvent(new CustomEvent('globe-stage-ready'));
    };
    document.getElementById('enter-hotzone')?.addEventListener('click', go);
    document.getElementById('welcome-enter-btn')?.addEventListener('click', go);
  }
}

// ============================================================
//  3D PHOTO SPHERE (核心展廳球體)
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
    this.rotX = 0.18;
    this.rotY = 0;
    this.velX = 0;
    this.velY = 0;
    this.autoRotateSpeed = 0.0010;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
    this.loadData();
  }

  init() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    // 深色黑調底（對應需求：球體底色深色黑調）
    this.scene.background = null; // 讓 body 的漸層透出

    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 500);
    this.camera.position.set(0, 0, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    // 柔和光照
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.25));

    this.sphereGroup = new THREE.Group();
    this.scene.add(this.sphereGroup);

    this.bindInteraction();
    this.animate();
    window.addEventListener('resize', () => this.onResize());
  }

  async loadData() {
    try {
      this.data = await loadArchive();
    } catch (e) {
      console.error('載入數據失敗:', e);
      this.data = { photos: [], quotes: [] };
    }
    this.buildSphere();
  }

  buildSphere() {
    // 清理舊物件
    this.tiles.forEach(t => {
      this.sphereGroup.remove(t);
      if (t.material?.map) t.material.map.dispose();
      t.geometry?.dispose();
    });
    this.tiles = [];

    const RADIUS = 2.8;
    const items = [];
    // 球體視圖 = 全部卡片 (config 沒有 category 欄位，全部都顯示在球體 + 平鋪)
    this.data.photos.forEach(p => items.push({ kind: 'photo', data: p }));
    this.data.quotes.forEach(q => items.push({ kind: 'quote', data: q }));

    if (items.length === 0) {
      const placeholder = this.createTextTile('上傳照片至 /photos 並在 config.js 新增', 1.4, 0.7);
      placeholder.position.set(0, 0, RADIUS);
      placeholder.lookAt(0, 0, 0);
      this.sphereGroup.add(placeholder);
      this.tiles.push(placeholder);
      return;
    }

    // Fibonacci sphere 均勻分布
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));
    const N = items.length;

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / Math.max(N - 1, 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = GOLDEN * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const item = items[i];
      let w, h;
      const sizeRand = Math.random();
      if (item.kind === 'photo') {
        const isLarge = sizeRand > 0.82;
        const baseScale = isLarge ? randomBetween(1.05, 1.3) : randomBetween(0.55, 0.95);
        w = baseScale;
        h = baseScale * 1.3;
      } else {
        w = randomBetween(0.55, 0.8);
        h = w * 0.55;
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
      // 輕微錯落旋轉（參考第三張圖：卡片錯落排布）
      tile.rotateZ(randomBetween(-0.45, 0.45));
      tile.rotateX(randomBetween(-0.2, 0.2));
      tile.rotateY(randomBetween(-0.2, 0.2));

      tile.userData = {
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

  // ============ 拍立得照片卡片 ============
  createPhotoTile(photo, w, h) {
    const canvas = document.createElement('canvas');
    const CW = 320;
    const CH = Math.round(CW * 1.3); // 拍立得比例
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');

    // 1) 磨砂白底（模擬磨砂質感）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CW, CH);
    // 細微噪點（磨砂）
    for (let i = 0; i < 900; i++) {
      const px = Math.floor(Math.random() * CW);
      const py = Math.floor(Math.random() * CH);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.2)';
      ctx.fillRect(px, py, 1, 1);
    }
    // 外框細線
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, CW - 2, CH - 2);
    ctx.restore();

    // 2) 照片區
    const marginX = Math.round(CW * 0.065);
    const marginTop = Math.round(CH * 0.06);
    const photoW = CW - marginX * 2;
    const photoH = Math.round(CH * 0.70);

    ctx.fillStyle = '#ebebeb';
    this.roundRect(ctx, marginX, marginTop, photoW, photoH, 3);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const geo = new THREE.PlaneGeometry(w, h * (CH / CW));
    const mesh = new THREE.Mesh(geo, mat);

    // 3) 載入真實照片
    const src = photo.src || '';
    if (src) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(src,
        (tex) => {
          const img = tex.image;
          if (img && img.complete) {
            this.drawPolaroidPhoto(ctx, img, CW, CH, marginX, marginTop, photoW, photoH);
            texture.needsUpdate = true;
          }
          tex.dispose();
        },
        undefined,
        () => { /* 失敗保持佔位：白底+灰照片區，體驗不壞 */ }
      );
    }

    return mesh;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawPolaroidPhoto(ctx, img, CW, CH, marginX, marginTop, photoW, photoH) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CW, CH);
    // 重畫磨砂噪點
    for (let i = 0; i < 700; i++) {
      const px = Math.floor(Math.random() * CW);
      const py = Math.floor(Math.random() * CH);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.save();
    this.roundRect(ctx, marginX, marginTop, photoW, photoH, 3);
    ctx.clip();
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const imgRatio = iw / ih;
    const areaRatio = photoW / photoH;
    let sx, sy, sw, sh;
    if (imgRatio > areaRatio) {
      sh = ih; sw = ih * areaRatio;
      sx = (iw - sw) / 2; sy = 0;
    } else {
      sw = iw; sh = iw / areaRatio;
      sx = 0; sy = (ih - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, marginX, marginTop, photoW, photoH);
    ctx.restore();
  }

  // ============ 文字語錄卡片 ============
  createTextTile(text, w, h) {
    const cw = 320;
    const ch = Math.round(cw * 1.15);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    // 磨砂白底
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, 0, 0, cw, ch, 6);
    ctx.fill();
    for (let i = 0; i < 700; i++) {
      const px = Math.floor(Math.random() * cw);
      const py = Math.floor(Math.random() * ch);
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 1, 1, cw - 2, ch - 2, 6);
    ctx.stroke();
    ctx.restore();

    // 文字（深色襯線體）
    const padX = Math.round(cw * 0.08);
    const padY = Math.round(ch * 0.12);

    ctx.fillStyle = '#0d0d0d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const wrapped = wrapText(text, 11);
    const lineH = 30;
    const totalH = wrapped.length * lineH;
    const startY = ch / 2 - totalH / 2 + lineH / 2;

    wrapped.forEach((line, i) => {
      const fs = wrapped.length > 4 ? 19 : (wrapped.length > 2 ? 22 : 25);
      ctx.font = `600 ${fs}px "Noto Serif TC","Songti TC","SimSun",serif`;
      ctx.fillText(line, cw / 2, startY + i * lineH);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const geo = new THREE.PlaneGeometry(w, h * (ch / cw));
    return new THREE.Mesh(geo, mat);
  }

  // ============ 互動 ============
  bindInteraction() {
    const c = this.renderer.domElement;
    c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup',   (e) => this.onPointerUp(e));
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
    if (!this.hasMoved) this.handleClick(e);
  }
  handleClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const visible = this.tiles.filter(t => t.material.opacity > 0.1);
    const hits = this.raycaster.intersectObjects(visible, false);
    if (hits.length > 0) this.openTileDetail(hits[0].object);
  }
  openTileDetail(tile) {
    window.dispatchEvent(new CustomEvent('open-tile', {
      detail: {
        item: tile.userData.itemData,
        kind: tile.userData.itemKind,
      },
    }));
  }
  onWheel(e) { e.preventDefault(); this.rotY += e.deltaY * 0.001; }
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
        // 自動慢速旋轉 + 慣性減速
        this.rotY += this.autoRotateSpeed + this.velY;
        this.rotX += this.velX;
        this.rotX = Math.max(-1.3, Math.min(1.3, this.rotX));
        this.velY *= 0.94;
        this.velX *= 0.94;
      }
      this.sphereGroup.rotation.y = this.rotY;
      this.sphereGroup.rotation.x = this.rotX;
    }
    this.renderer.render(this.scene, this.camera);
  }
  show() { this.container.style.display = 'block'; }
  hide() { this.container.style.display = 'none'; }
  async rebuild() { await this.loadData(); }
}

// ============================================================
//  FLAT GRID (平鋪視圖)
// ============================================================
class FlatGridView {
  constructor() {
    this.container = document.getElementById('flat-container');
    this.track = document.getElementById('flat-track');
    this.data = { photos: [], quotes: [] };
    this.isDown = false;
    this.startX = 0; this.scrollStart = 0;
    this.hasMoved = false; this.currentX = 0;
    this.init();
    this.loadData();
  }
  init() {
    this.track.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup',   () => this.onPointerUp());
    this.track.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.container.classList.add('hidden');
  }
  async loadData() {
    try {
      this.data = await loadArchive();
    } catch (e) {
      console.error('Flat 載入失敗:', e);
    }
    this.buildGrid();
  }
  buildGrid() {
    this.track.innerHTML = '';
    const items = [];
    this.data.photos.forEach(p => items.push({ kind: 'photo', data: p }));
    this.data.quotes.forEach(q => items.push({ kind: 'quote', data: q }));

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'flat-empty';
      empty.innerHTML = '<p>在 config.js 新增照片與語錄</p>';
      this.track.appendChild(empty);
      return;
    }
    const rows = [[], [], []];
    items.forEach((item, i) => rows[i % 3].push(item));

    rows.forEach((rowItems, rowIdx) => {
      const row = document.createElement('div');
      row.className = 'flat-row';
      row.style.setProperty('--row-offset', (rowIdx * 24) + 'px');
      rowItems.forEach((item) => {
        const card = document.createElement('div');
        card.className = `flat-card ${item.kind}`;
        if (item.kind === 'photo') {
          card.innerHTML = `
            <div class="fc-img-wrap">
              <img src="${item.data.src || ''}" alt="${item.data.title || ''}"
                   onerror="this.style.opacity=0.25;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/></svg>'"
                   draggable="false">
            </div>
            <div class="fc-info"><span class="fc-title">${item.data.title || '未命名'}</span></div>
          `;
        } else {
          card.innerHTML = `
            <div class="fc-quote"><p>${item.data.text || ''}</p></div>
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
      detail: { item: item.data, kind: item.kind },
    }));
  }
  onPointerDown(e) {
    this.isDown = true; this.hasMoved = false;
    this.startX = e.clientX; this.currentX = e.clientX;
    this.scrollStart = this.track.scrollLeft;
    this.track.style.cursor = 'grabbing';
    this.track.classList.add('grabbing');
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
    this.track.classList.remove('grabbing');
  }
  onWheel(e) { e.preventDefault(); this.track.scrollLeft += e.deltaY || e.deltaX; }
  show() { this.container.classList.remove('hidden'); this.track.style.cursor = 'grab'; }
  hide() { this.container.classList.add('hidden'); }
  async rebuild() { await this.loadData(); }
}

// ============================================================
//  DETAIL PANEL (彈窗) + AUDIO 控制
//  規則：
//   - 音檔"絕不自動播放"，僅點擊播放按鈕才啟動
//   - 關閉彈窗 -> 立即停止音檔 + 重設進度
// ============================================================
class DetailPanel {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.backdrop = document.getElementById('detail-backdrop');
    this.imgWrap = document.getElementById('detail-img');
    this.imgEl = document.getElementById('detail-img-el');
    this.contentEl = document.getElementById('detail-content');
    this.closeBtn = document.getElementById('detail-close');

    // 音頻相關
    this.audioWrap = document.getElementById('detail-audio');
    this.audioEl = document.getElementById('archive-audio');
    this.playBtn = document.getElementById('audio-play-btn');
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');
    this.seekInput = document.getElementById('audio-seek');
    this.curSpan = document.getElementById('audio-cur');
    this.totalSpan = document.getElementById('audio-total');

    this.currentKind = null;

    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    window.addEventListener('open-tile', (e) => this.open(e.detail));

    // 音頻事件
    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.audioEl?.addEventListener('loadedmetadata', () => this.onLoadedMeta());
    this.audioEl?.addEventListener('timeupdate',   () => this.onTimeUpdate());
    this.audioEl?.addEventListener('ended',        () => this.onEnded());
    this.audioEl?.addEventListener('play',         () => this.setPlaying(true));
    this.audioEl?.addEventListener('pause',        () => this.setPlaying(false));
    this.seekInput?.addEventListener('input', (e) => {
      if (!this.audioEl.duration || isNaN(this.audioEl.duration)) return;
      const sec = (parseFloat(e.target.value) / 100) * this.audioEl.duration;
      this.audioEl.currentTime = sec;
    });
  }

  // ----------- 彈窗開啟 -----------
  open(detail) {
    const item = detail.item;
    const kind = detail.kind;
    this.currentKind = kind;

    // 照片區
    if (kind === 'photo') {
      this.panel.classList.remove('quote-only');
      this.imgWrap.style.display = '';
      this.imgEl.src = item.src || '';
      this.imgEl.onerror = () => { this.imgWrap.style.display = 'none'; };
    } else {
      this.panel.classList.add('quote-only');
      this.imgWrap.style.display = 'none';
      this.imgEl.removeAttribute('src');
    }

    // 文字區
    const title = item.title || (kind === 'quote' ? (item.text || '').slice(0, 20) : '未命名');
    const body  = kind === 'quote' ? item.text : (item.title || '');
    this.contentEl.innerHTML = `
      <div class="dp-cat">${kind === 'photo' ? '照片' : '語錄'}</div>
      <h2 class="dp-title">${this._esc(title)}</h2>
      ${body ? `<p class="dp-body">${this._esc(body).replace(/\n/g, '<br>')}</p>` : ''}
    `;

    // 音頻：只有 quote 且有 audio 欄位才顯示
    const hasAudio = kind === 'quote' && !!item.audio;
    this._resetAudio();
    if (hasAudio) {
      this.audioWrap.style.display = '';
      this.audioEl.src = item.audio;
      this.audioEl.load(); // 僅預載中繼資料，不播放
    } else {
      this.audioWrap.style.display = 'none';
    }

    this.panel.classList.add('active');
  }

  // ----------- 彈窗關閉 -> 立刻停止音頻 -----------
  close() {
    this.panel.classList.remove('active');
    this._resetAudio();
    this.currentKind = null;
  }

  // ----------- 音頻：嚴格使用者點擊才播放 -----------
  togglePlay() {
    if (!this.audioEl || !this.audioEl.src) return;
    if (this.audioEl.paused) {
      // 注意：因為是使用者 click 觸發，符合瀏覽器自動播放政策
      const p = this.audioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          console.warn('[Audio] 播放失敗:', err?.message || err);
          this.setPlaying(false);
        });
      }
    } else {
      this.audioEl.pause();
    }
  }

  setPlaying(isPlaying) {
    if (!this.playBtn) return;
    this.playBtn.classList.toggle('playing', !!isPlaying);
    if (this.iconPlay)  this.iconPlay.style.display  = isPlaying ? 'none' : '';
    if (this.iconPause) this.iconPause.style.display = isPlaying ? '' : 'none';
  }

  onLoadedMeta() {
    if (!this.audioEl.duration || isNaN(this.audioEl.duration)) return;
    this.totalSpan.textContent = this._fmtTime(this.audioEl.duration);
    this.seekInput.value = '0';
  }
  onTimeUpdate() {
    if (!this.audioEl.duration || isNaN(this.audioEl.duration)) return;
    this.curSpan.textContent = this._fmtTime(this.audioEl.currentTime);
    this.seekInput.value = String((this.audioEl.currentTime / this.audioEl.duration) * 100);
  }
  onEnded() {
    this.setPlaying(false);
    this.seekInput.value = '0';
    this.curSpan.textContent = this._fmtTime(0);
  }

  _resetAudio() {
    if (!this.audioEl) return;
    try {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    } catch (_) { /* ignore */ }
    this.audioEl.removeAttribute('src');
    try { this.audioEl.load(); } catch (_) {}
    this.setPlaying(false);
    if (this.seekInput) this.seekInput.value = '0';
    if (this.curSpan)   this.curSpan.textContent = '0:00';
    if (this.totalSpan) this.totalSpan.textContent = '0:00';
  }

  _fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  _esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// ============================================================
//  APP
// ============================================================
class App {
  constructor() {
    this.stageManager = new StageManager();
    this.homeStage    = new HomeStage(this.stageManager);
    this.welcomeStage = new WelcomeStage(this.stageManager);
    this.detailPanel  = new DetailPanel();
    this.sphere       = null;
    this.flatView     = null;
    this.currentMode  = 'sphere';

    document.querySelectorAll('.globe-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    window.addEventListener('globe-stage-ready', () => {
      if (!this.sphere)   this.sphere   = new PhotoSphere();
      if (!this.flatView) this.flatView = new FlatGridView();
      this.applyMode('sphere');
    });

    window.addEventListener('load', () => this.onLoad());
    window.app = this;
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;
    document.querySelectorAll('.globe-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    this.applyMode(mode);
  }
  applyMode(mode) {
    this.currentMode = mode;
    const globeDom = document.getElementById('globe-container');
    const flatDom  = document.getElementById('flat-container');
    if (mode === 'sphere') {
      if (this.sphere) this.sphere.show();
      if (this.flatView) this.flatView.hide();
      globeDom.style.display = 'block';
      flatDom.classList.add('hidden');
    } else {
      if (this.sphere) this.sphere.hide();
      if (this.flatView) this.flatView.show();
      globeDom.style.display = 'none';
      flatDom.classList.remove('hidden');
    }
  }
  async onLoad() {
    try { await loadArchive(); }
    catch (e) { console.warn('[App] 預載入失敗:', e); }
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
    try { new App(); }
    catch (e) { console.error('[Boot] 初始化失敗:', e); }
    finally { hideLoadingIndicator(); }
  }, 200);
});

// 兜底 5 秒
setTimeout(hideLoadingIndicator, 5000);
