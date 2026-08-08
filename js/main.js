/* ==========================================
   Anpu's Digital Archive · 安溥的數字藏館
   Main Application Logic — Design v3
   ========================================== */

import * as THREE from 'three';

// ============================================================
//  DEFAULT DATA (used if user hasn't uploaded anything)
// ============================================================

const DEFAULT_DATA = {
  photos: [
    { id: 'p1', src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=70', caption: '關於我愛你' },
    { id: 'p2', src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=70', caption: '玫瑰色的你' },
    { id: 'p3', src: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=70', caption: '南國的孩子' },
    { id: 'p4', src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=70', caption: '走吧！給你看我年輕時候的相片' },
    { id: 'p5', src: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=70', caption: '我想你要走了' },
    { id: 'p6', src: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=600&q=70', caption: '喜歡' },
    { id: 'p7', src: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=600&q=70', caption: '城市' },
    { id: 'p8', src: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=600&q=70', caption: '在所有人事已非的景色裡' },
  ],
  quotes: [
    { id: 'q1', text: '我擁有的都是僥倖，\n我失去的都是人生。' },
    { id: 'q2', text: '在所有人事已非的景色裡，\n我最喜歡你。' },
    { id: 'q3', text: '你是我在這個世界上，\n唯一的唯一。' },
    { id: 'q4', text: '關於我愛你。' },
    { id: 'q5', text: '我想你要走了。' },
    { id: 'q6', text: '南國的孩子。' },
    { id: 'q7', text: '日子。' },
    { id: 'q8', text: '喜歡。' },
    { id: 'q9', text: '留下來，\n或者我跟你走。' },
    { id: 'q10', text: '如果這就是最後了，\n謝謝你曾經來過。' },
    { id: 'q11', text: '你是我眼中的一滴淚。' },
    { id: 'q12', text: '讓我們走到這裡。' },
  ]
};

// ============================================================
//  STORAGE — localStorage for user uploads
// ============================================================

const STORAGE_KEY = 'anpu-archive-userdata-v1';

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { photos: [], quotes: [] };
    } catch (e) {
      return { photos: [], quotes: [] };
    }
  },
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage failed:', e);
      alert('儲存空間已滿，請清理後再上傳。');
    }
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
  size() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (new Blob([data]).size / 1024).toFixed(1) : '0';
  }
};

function getAllPhotos() {
  const user = Storage.load();
  return [...DEFAULT_DATA.photos, ...user.photos];
}

function getAllQuotes() {
  const user = Storage.load();
  return [...DEFAULT_DATA.quotes, ...user.quotes];
}

// ============================================================
//  UTILITY
// ============================================================

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function randomBetween(min, max) { return min + Math.random() * (max - min); }

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function generateId() {
  return 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ============================================================
//  STAGE MANAGER
// ============================================================

class StageManager {
  constructor() {
    this.stages = {
      curtain: document.getElementById('curtain-stage'),
      welcome: document.getElementById('welcome-stage'),
      globe: document.getElementById('globe-stage'),
    };
    this.blackout = document.getElementById('blackout');
    this.current = 'curtain';
  }

  show(name) {
    if (this.current === name) return;
    this.current = name;
    Object.values(this.stages).forEach(s => s.classList.remove('stage-active'));
    if (this.stages[name]) {
      this.stages[name].classList.add('stage-active');
    }
  }

  blackoutShow(duration = 500) {
    return new Promise(resolve => {
      this.blackout.classList.add('active');
      setTimeout(resolve, duration);
    });
  }

  blackoutHide(duration = 500) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.blackout.classList.remove('active');
        setTimeout(resolve, duration);
      }, 50);
    });
  }
}

// ============================================================
//  STAGE 1: 珠簾
// ============================================================

class CurtainStage {
  constructor(stageManager) {
    this.stage = document.getElementById('curtain-stage');
    this.canvas = document.getElementById('curtain-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.stageManager = stageManager;

    // Tighter, more elegant spacing like the reference
    this.beadSize = 5;        // base bead radius
    this.stringSpacing = 16;  // denser vertical strings
    this.stringCount = 0;

    this.isDragging = false;
    this.dragStartX = 0;
    this.partingAmount = 0;
    this.targetParting = 0;
    this.openThreshold = 0.7;
    this.isOpen = false;
    this.bounceActive = false;
    this.bounceTime = 0;

    this.strings = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => this.onDragStart(e.clientX));
    window.addEventListener('mousemove', (e) => this.onDragMove(e.clientX));
    window.addEventListener('mouseup', () => this.onDragEnd());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onDragStart(e.touches[0].clientX);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) e.preventDefault();
      this.onDragMove(e.touches[0].clientX);
    }, { passive: false });
    window.addEventListener('touchend', () => this.onDragEnd());

    this.animate();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.centerX = this.w / 2;
    this.halfWidth = this.w / 2;

    this.stringCount = Math.ceil(this.w / this.stringSpacing) + 4;

    this.strings = [];
    const startX = (this.w - (this.stringCount - 1) * this.stringSpacing) / 2;
    for (let i = 0; i < this.stringCount; i++) {
      const baseX = startX + i * this.stringSpacing;

      // Each string has a slightly different vertical extent and bead count
      // to create the irregular, organic pattern in the reference
      const stringHeightRatio = randomBetween(0.85, 1.0);
      const baseCount = Math.floor(this.h / randomBetween(38, 55));

      // Distribute beads irregularly — sometimes clustered, sometimes sparse
      const beads = [];
      let y = randomBetween(8, 30); // start with some random offset
      while (y < this.h * stringHeightRatio) {
        // Variable spacing creates the natural rhythm of the reference
        const gap = randomBetween(18, 70);
        // Some beads are larger/brighter ("shining" beads in the reference)
        const isHighlight = Math.random() < 0.18;
        const sizeMul = isHighlight ? randomBetween(1.6, 2.4) : randomBetween(0.7, 1.15);
        beads.push({
          relY: y,
          sizeMul,
          isHighlight,
          phase: Math.random() * Math.PI * 2,
          swayAmp: randomBetween(0.4, 1.2),
          swayFreq: randomBetween(0.4, 0.9),
          // Each string gets a subtle string-line variation
          lineAlpha: randomBetween(0.18, 0.42),
          twinkleSpeed: randomBetween(0.8, 2.2),
        });
        y += gap;
      }

      this.strings.push({ baseX, beads });
    }
  }

  onDragStart(x) {
    if (this.isOpen) return;
    this.isDragging = true;
    this.dragStartX = x;
  }

  onDragMove(x) {
    if (!this.isDragging) return;
    const dx = Math.abs(x - this.dragStartX);
    this.targetParting = clamp(dx / (this.w * 0.35), 0, 1.0);
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.targetParting >= this.openThreshold) {
      this.targetParting = 1.0;
      this.bounceActive = true;
      this.bounceTime = 0;
      setTimeout(() => this.openComplete(), 500);
    } else {
      this.targetParting = 0;
    }
  }

  async openComplete() {
    if (this.isOpen) return;
    this.isOpen = true;
    await this.stageManager.blackoutShow(400);
    this.stageManager.show('welcome');
    await this.stageManager.blackoutHide(500);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.partingAmount = lerp(this.partingAmount, this.targetParting, 0.08);
    if (Math.abs(this.partingAmount - this.targetParting) < 0.001) {
      this.partingAmount = this.targetParting;
    }

    if (this.bounceActive) {
      this.bounceTime += 0.016;
      if (this.bounceTime > 2.5) this.bounceActive = false;
    }

    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const t = performance.now() * 0.001;

    ctx.clearRect(0, 0, w, h);

    // Background — deep black with subtle warm vignette near center
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Subtle warm center glow that intensifies while parting
    const glowAlpha = 0.08 + this.partingAmount * 0.18;
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.45);
    glow.addColorStop(0, `rgba(255, 200, 140, ${glowAlpha})`);
    glow.addColorStop(0.5, `rgba(220, 150, 80, ${glowAlpha * 0.3})`);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // ===== Phase 1: draw all the thin vertical lines first (under the beads) =====
    const partingPx = this.partingAmount * w * 0.35;

    for (let i = 0; i < this.strings.length; i++) {
      const str = this.strings[i];
      const baseX = str.baseX;
      const distFromCenter = Math.abs(baseX - this.centerX);
      const offsetFactor = (1 - distFromCenter / this.halfWidth) * 0.7;
      const sign = baseX >= this.centerX ? 1 : -1;
      const offset = sign * partingPx * offsetFactor;

      // Each string line gets a small sway
      const lineSway = Math.sin(t * 0.6 + i * 0.4) * 0.6;
      const stringX = baseX + offset + lineSway;

      // Skip off-screen
      if (stringX < -10 || stringX > w + 10) continue;

      // Use a representative line alpha from the first bead
      const lineAlpha = (str.beads[0] && str.beads[0].lineAlpha) || 0.3;

      // Draw the string as a soft vertical line, slightly broken by gaps
      ctx.strokeStyle = `rgba(220, 220, 230, ${lineAlpha})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(stringX, 0);
      ctx.lineTo(stringX, h);
      ctx.stroke();
    }

    // ===== Phase 2: draw the beads =====
    for (let i = 0; i < this.strings.length; i++) {
      const str = this.strings[i];
      const baseX = str.baseX;
      const distFromCenter = Math.abs(baseX - this.centerX);
      const offsetFactor = (1 - distFromCenter / this.halfWidth) * 0.7;
      const sign = baseX >= this.centerX ? 1 : -1;
      const offset = sign * partingPx * offsetFactor;
      const lineSway = Math.sin(t * 0.6 + i * 0.4) * 0.6;
      const stringX = baseX + offset + lineSway;

      if (stringX < -30 || stringX > w + 30) continue;

      for (let j = 0; j < str.beads.length; j++) {
        const bead = str.beads[j];
        const sway = Math.sin(t * bead.swayFreq + bead.phase) * bead.swayAmp;

        let bounceOffset = 0;
        if (this.bounceActive) {
          const decay = Math.exp(-this.bounceTime * 2);
          bounceOffset = Math.sin(this.bounceTime * 8 + bead.phase) * 2 * decay;
        }

        const bx = stringX + sway + bounceOffset;
        const by = bead.relY;
        const r = this.beadSize * bead.sizeMul;

        // Subtle twinkle on highlight beads
        let twinkle = 1;
        if (bead.isHighlight) {
          twinkle = 0.75 + 0.25 * Math.sin(t * bead.twinkleSpeed + bead.phase * 3);
        }

        if (bx < -20 || bx > w + 20) continue;

        this.drawBead(ctx, bx, by, r, bead.isHighlight, twinkle);
      }
    }
  }

  drawBead(ctx, x, y, r, isHighlight, twinkle) {
    // Soft outer glow — only meaningful for highlight beads
    if (isHighlight) {
      const glowR = r * (4 + twinkle * 2);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      glow.addColorStop(0, `rgba(255, 235, 200, ${0.35 * twinkle})`);
      glow.addColorStop(0.4, `rgba(255, 220, 170, ${0.12 * twinkle})`);
      glow.addColorStop(1, 'rgba(255, 220, 170, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny soft halo for normal beads too — gives a hint of glow
    const haloR = r * 1.8;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, haloR);
    halo.addColorStop(0, 'rgba(255, 250, 240, 0.18)');
    halo.addColorStop(1, 'rgba(255, 250, 240, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Main bead body — soft white/silver with subtle warm core
    const bodyAlpha = isHighlight ? 1.0 : 0.85;
    const grad = ctx.createRadialGradient(
      x - r * 0.3, y - r * 0.35, 0,
      x, y, r
    );
    if (isHighlight) {
      grad.addColorStop(0, `rgba(255, 252, 240, ${bodyAlpha})`);
      grad.addColorStop(0.5, `rgba(245, 230, 200, ${bodyAlpha * 0.7})`);
      grad.addColorStop(1, `rgba(180, 160, 130, 0)`);
    } else {
      grad.addColorStop(0, `rgba(255, 255, 250, ${bodyAlpha})`);
      grad.addColorStop(0.5, `rgba(220, 220, 220, ${bodyAlpha * 0.5})`);
      grad.addColorStop(1, `rgba(120, 120, 120, 0)`);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Tiny bright pinpoint core
    ctx.fillStyle = isHighlight
      ? `rgba(255, 255, 250, ${0.95 * twinkle})`
      : 'rgba(255, 255, 250, 0.7)';
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.2, Math.max(0.4, r * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
//  STAGE 2: 歡迎頁
// ============================================================

class WelcomeStage {
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.photo = document.getElementById('welcome-photo');
    this.placeholder = document.getElementById('welcome-photo-placeholder');
    this.enterBtn = document.getElementById('enter-gate');

    this.enterBtn.addEventListener('click', () => this.goToGlobe());

    // Try multiple common filenames
    this.tryLoadPhoto();
  }

  tryLoadPhoto() {
    // First, check if user uploaded a welcome photo in this session
    const sessionPhoto = sessionStorage.getItem('anpu-welcome-photo');
    if (sessionPhoto) {
      this.photo.onload = () => {
        this.photo.style.display = 'block';
        this.placeholder.style.display = 'none';
      };
      this.photo.onerror = () => {
        this.tryLoadRemote();
      };
      this.photo.src = sessionPhoto;
      return;
    }
    this.tryLoadRemote();
  }

  tryLoadRemote() {
    const candidates = [
      'assets/welcome.jpg',
      'assets/welcome.png',
      'assets/welcome.webp',
      'assets/anpu.jpg',
      'assets/anpu.png',
      'assets/photo.jpg',
      'assets/IMG_2083.jpg',
    ];

    let idx = 0;
    const tryNext = () => {
      if (idx >= candidates.length) {
        this.photo.style.display = 'none';
        this.placeholder.style.display = 'flex';
        return;
      }
      this.photo.onerror = () => {
        idx++;
        tryNext();
      };
      this.photo.onload = () => {
        this.photo.style.display = 'block';
        this.placeholder.style.display = 'none';
      };
      this.photo.src = candidates[idx];
    };
    tryNext();
  }

  async goToGlobe() {
    // 黑屏過渡
    await this.stageManager.blackoutShow(400);
    this.stageManager.show('globe');
    await this.stageManager.blackoutHide(600);
    window.dispatchEvent(new CustomEvent('globe-stage-ready'));
  }
}

// ============================================================
//  STAGE 3: 3D 球體
// ============================================================

class GlobeStage {
  constructor() {
    this.container = document.getElementById('globe-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globeGroup = null;
    this.sphere = null;
    this.sprites = [];
    this.particles = null;

    this.isDragging = false;
    this.prevPointer = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };
    this.hasMoved = false;
    this.rotationVelocity = { x: 0, y: 0 };
    this.autoRotate = true;
    this.breathTime = 0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.textureCache = new Map();

    this.init();
  }

  init() {
    try {
      this.setupScene();
    } catch (e) {
      console.warn('WebGL not available, showing fallback:', e);
      this.showFallback();
      return;
    }
    this.setupLighting();
    this.createGlobe();
    this.createSprites();
    this.createAmbientParticles();
    this.setupEvents();
    this.animate();
  }

  showFallback() {
    const container = this.container;
    container.innerHTML = `
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;color:#3a3028;">
        <div style="font-size:14px;letter-spacing:0.2em;opacity:0.7;margin-bottom:24px;">您的裝置暫不支援 3D 渲染</div>
        <div style="font-size:13px;line-height:1.8;opacity:0.6;max-width:320px;">請用另一台手機或瀏覽器開啟，或於電腦上用 Chrome / Safari 體驗完整 3D 球體。</div>
        <div style="margin-top:32px;font-size:11px;letter-spacing:0.3em;opacity:0.4;">A QUIET GIFT</div>
      </div>
    `;
  }

  setupScene() {
    this.scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0.3, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    this.globeGroup = new THREE.Group();
    this.globeGroup.position.y = 0.2;
    this.scene.add(this.globeGroup);
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff5e0, 2.0);
    key.position.set(4, 5, 4);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xc0d0e0, 0.8);
    fill.position.set(-3, -2, -2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(0, -2, 4);
    this.scene.add(rim);
  }

  createGlobe() {
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 1.9 : 2.4;

    const geometry = new THREE.SphereGeometry(radius, 96, 96);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf5f1ea,
      roughness: 0.55,
      metalness: 0.05,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.globeRadius = radius;
    this.globeGroup.add(this.sphere);

    // Soft outer glow
    const glowGeo = new THREE.SphereGeometry(radius * 1.04, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    this.globeGroup.add(new THREE.Mesh(glowGeo, glowMat));
  }

  async createSprites() {
    const sphereRadius = this.globeRadius * 1.02;
    const allItems = [];

    const photos = getAllPhotos();
    photos.forEach(p => allItems.push({ type: 'photo', data: p }));
    const quotes = getAllQuotes();
    quotes.forEach(q => allItems.push({ type: 'quote', data: q }));

    // Shuffle
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    const total = allItems.length;
    const phi = Math.PI * (3 - Math.sqrt(5));
    const placed = [];
    const minDist = sphereRadius * 0.18;

    const promises = [];

    allItems.forEach((item, i) => {
      const y = 1 - (i / Math.max(1, total - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      let x = Math.cos(theta) * radiusAtY;
      let z = Math.sin(theta) * radiusAtY;
      let pos = new THREE.Vector3(x, y, z).multiplyScalar(sphereRadius);

      // Push apart if too close
      let attempts = 0;
      while (attempts < 12) {
        let tooClose = false;
        for (const p of placed) {
          if (pos.distanceTo(p) < minDist) {
            tooClose = true;
            break;
          }
        }
        if (!tooClose) break;
        const newTheta = theta + 0.4 * (attempts + 1);
        x = Math.cos(newTheta) * radiusAtY;
        z = Math.sin(newTheta) * radiusAtY;
        pos = new THREE.Vector3(x, y, z).multiplyScalar(sphereRadius);
        attempts++;
      }
      placed.push(pos.clone());

      let sprite;
      if (item.type === 'photo') {
        sprite = this.createPhotoSprite(item.data);
      } else {
        sprite = this.createQuoteSprite(item.data);
      }

      sprite.position.copy(pos);
      sprite.userData = {
        type: item.type,
        data: item.data,
        isPhoto: item.type === 'photo',
        isQuote: item.type === 'quote',
      };

      this.globeGroup.add(sprite);
      this.sprites.push(sprite);
    });
  }

  createPhotoSprite(photoData) {
    const texture = this.getOrCreatePhotoTexture(photoData);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);

    // Vary size for visual interest
    const scale = randomBetween(0.32, 0.48);
    sprite.scale.set(scale, scale, 1);
    return sprite;
  }

  getOrCreatePhotoTexture(photoData) {
    const key = photoData.id + (photoData.src || photoData.dataURL || '');
    if (this.textureCache.has(key)) return this.textureCache.get(key);

    const texture = new THREE.TextureLoader().load(
      photoData.src || photoData.dataURL,
      undefined,
      undefined,
      () => {
        // Fallback on error
        const canvas = this.createPlaceholderCanvas(photoData.caption || 'Photo');
        const fallback = new THREE.CanvasTexture(canvas);
        texture.image = canvas;
        texture.needsUpdate = true;
      }
    );
    this.textureCache.set(key, texture);
    return texture;
  }

  createPlaceholderCanvas(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, '#e8d8c0');
    grad.addColorStop(1, '#a08060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label || 'Photo', 100, 100);
    return canvas;
  }

  createQuoteSprite(quoteData) {
    const texture = this.createQuoteTexture(quoteData.text);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.6, 0.18, 1);
    return sprite;
  }

  createQuoteTexture(text) {
    const w = 280, h = 84;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // White card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    roundRect(ctx, 0, 0, w, h, 4);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 4);
    ctx.stroke();

    // Text
    const lines = text.split('\n');
    const fontSize = 12;
    ctx.fillStyle = '#2a2218';
    ctx.font = `400 ${fontSize}px "Noto Serif TC", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.5;
    const totalHeight = lines.length * lineHeight;
    const startY = h / 2 - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
      let display = line;
      const maxWidth = w - 24;
      if (ctx.measureText(display).width > maxWidth) {
        while (ctx.measureText(display + '…').width > maxWidth && display.length > 0) {
          display = display.slice(0, -1);
        }
        display += '…';
      }
      ctx.fillText(display, w / 2, startY + i * lineHeight);
    });

    return new THREE.CanvasTexture(canvas);
  }

  createAmbientParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 4 + Math.random() * 5;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setupEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.onPointerUp());

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    canvas.addEventListener('touchend', () => this.onPointerUp());

    window.addEventListener('resize', () => this.onResize());
  }

  onPointerDown(x, y) {
    this.isDragging = true;
    this.autoRotate = false;
    this.prevPointer.x = x;
    this.prevPointer.y = y;
    this.pointerDownPos.x = x;
    this.pointerDownPos.y = y;
    this.hasMoved = false;
    this.rotationVelocity.x = 0;
    this.rotationVelocity.y = 0;
  }

  onPointerMove(x, y) {
    if (!this.isDragging) return;

    const dx = x - this.prevPointer.x;
    const dy = y - this.prevPointer.y;

    if (Math.abs(x - this.pointerDownPos.x) > 5 || Math.abs(y - this.pointerDownPos.y) > 5) {
      this.hasMoved = true;
    }

    this.globeGroup.rotation.y += dx * 0.005;
    this.globeGroup.rotation.x += dy * 0.005;
    this.globeGroup.rotation.x = clamp(this.globeGroup.rotation.x, -Math.PI / 2.5, Math.PI / 2.5);

    this.rotationVelocity.x = dy * 0.005;
    this.rotationVelocity.y = dx * 0.005;

    this.prevPointer.x = x;
    this.prevPointer.y = y;
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!this.hasMoved) {
      this.handleClick(this.pointerDownPos.x, this.pointerDownPos.y);
    }
    setTimeout(() => {
      if (!this.isDragging) this.autoRotate = true;
    }, 2500);
  }

  handleClick(clientX, clientY) {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.sprites);
    if (intersects.length > 0) {
      const sprite = intersects[0].object;
      if (sprite.userData.isPhoto) {
        window.dispatchEvent(new CustomEvent('open-photo', { detail: sprite.userData.data }));
      } else {
        window.dispatchEvent(new CustomEvent('open-quote', { detail: sprite.userData.data }));
      }
    }
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  resetView() {
    this.globeGroup.rotation.set(0, 0, 0);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.breathTime += 0.016;

    if (this.autoRotate) {
      const breath = 0.0018 + 0.0012 * Math.sin(this.breathTime * (2 * Math.PI / 8));
      this.globeGroup.rotation.y += breath;
    } else {
      this.globeGroup.rotation.y += this.rotationVelocity.y;
      this.globeGroup.rotation.x += this.rotationVelocity.x;
      this.globeGroup.rotation.x = clamp(this.globeGroup.rotation.x, -Math.PI / 2.5, Math.PI / 2.5);
      this.rotationVelocity.x *= 0.96;
      this.rotationVelocity.y *= 0.96;
      if (Math.abs(this.rotationVelocity.x) < 0.0001) this.rotationVelocity.x = 0;
      if (Math.abs(this.rotationVelocity.y) < 0.0001) this.rotationVelocity.y = 0;
    }

    // Depth-based opacity
    for (const sprite of this.sprites) {
      const wp = new THREE.Vector3();
      sprite.getWorldPosition(wp);
      const depth = clamp((wp.z + this.globeRadius) / (this.globeRadius * 2), 0.4, 1.0);
      if (sprite.userData.isPhoto) {
        sprite.material.opacity = depth;
      } else {
        sprite.material.opacity = 0.92 * depth;
      }
    }

    if (this.particles) {
      this.particles.rotation.y += 0.0002;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============================================================
//  PHOTO MODAL — 寶麗來
// ============================================================

class PhotoModal {
  constructor() {
    this.modal = document.getElementById('photo-modal');
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.img = document.getElementById('photo-modal-img');
    this.caption = document.getElementById('photo-modal-caption');
    this.closeBtn = this.modal.querySelector('.polaroid-close');
    this.likeBtn = document.getElementById('polaroid-like');
    this.likeCount = document.getElementById('like-count');

    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.likeBtn.addEventListener('click', () => this.toggleLike());

    window.addEventListener('open-photo', (e) => this.open(e.detail));
  }

  open(photoData) {
    this.img.src = photoData.src || photoData.dataURL;
    this.img.onerror = () => {
      // fallback
      this.img.src = this.placeholderURL(photoData.caption);
    };
    this.caption.textContent = photoData.caption || '';

    // Reset view button effect
    const resetBtn = document.getElementById('reset-view-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (window.app && window.app.globe) {
          window.app.globe.resetView();
          this.close();
        }
      };
    }

    this.modal.classList.add('active');
  }

  placeholderURL(label) {
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 200, 200);
    grad.addColorStop(0, '#e8d8c0');
    grad.addColorStop(1, '#a08060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label || 'Photo', 100, 100);
    return canvas.toDataURL();
  }

  close() {
    this.modal.classList.remove('active');
  }

  toggleLike() {
    const heart = this.likeBtn.querySelector('svg');
    heart.style.transform = 'scale(1.3)';
    setTimeout(() => heart.style.transform = '', 200);
    const current = parseInt(this.likeCount.textContent) || 0;
    this.likeCount.textContent = current + 1;
  }
}

// ============================================================
//  QUOTE MODAL
// ============================================================

class QuoteModal {
  constructor() {
    this.modal = document.getElementById('quote-modal');
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.textEl = document.getElementById('quote-modal-text');
    this.playBtn = document.getElementById('audio-play-btn');
    this.btnLabel = this.playBtn.querySelector('.btn-label');
    this.status = document.getElementById('audio-status');
    this.closeBtn = this.modal.querySelector('.quote-close');

    this.audio = null;
    this.currentData = null;
    this.isPlaying = false;

    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    window.addEventListener('open-quote', (e) => this.open(e.detail));
  }

  open(quoteData) {
    this.currentData = quoteData;
    this.textEl.textContent = quoteData.text;
    this.modal.classList.add('active');
    this.reset();
  }

  close() {
    this.modal.classList.remove('active');
    this.stop();
  }

  reset() {
    this.isPlaying = false;
    this.playBtn.classList.remove('playing');
    this.btnLabel.textContent = '播放';
    this.status.textContent = '';
  }

  toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  play() {
    if (!this.currentData) return;
    this.stop();

    const src = this.currentData.audio;
    if (!src) {
      this.status.textContent = '此條語錄暫無錄音';
      return;
    }

    this.audio = new Audio(src);
    this.playBtn.style.transform = 'scale(1.05)';
    setTimeout(() => this.playBtn.style.transform = '', 150);

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playBtn.classList.add('playing');
      this.btnLabel.textContent = '暫停';
      this.status.textContent = '正在播放...';
    });

    this.audio.addEventListener('ended', () => this.reset());
    this.audio.addEventListener('error', () => {
      this.status.textContent = '音檔載入失敗';
      this.reset();
    });

    this.audio.play().catch(() => {
      this.status.textContent = '音檔載入失敗';
      this.reset();
    });
  }

  pause() {
    if (this.audio) this.audio.pause();
    this.reset();
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.reset();
  }
}

// ============================================================
//  UPLOAD MODAL — 上傳通道
// ============================================================

class UploadModal {
  constructor(stageManager) {
    this.modal = document.getElementById('upload-modal');
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.closeBtn = this.modal.querySelector('.upload-close');

    this.backdrop.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());

    // Tabs
    this.tabBtns = this.modal.querySelectorAll('.tab-btn');
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Photo upload
    this.photoDrop = document.getElementById('photo-drop');
    this.photoInput = document.getElementById('photo-input');
    this.photoPreview = document.getElementById('photo-preview');
    this.photoQueue = [];

    this.photoDrop.addEventListener('click', () => this.photoInput.click());
    this.photoInput.addEventListener('change', (e) => this.handlePhotoFiles(e.target.files));

    // Drag & drop
    this.photoDrop.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.photoDrop.classList.add('dragover');
    });
    this.photoDrop.addEventListener('dragleave', () => this.photoDrop.classList.remove('dragover'));
    this.photoDrop.addEventListener('drop', (e) => {
      e.preventDefault();
      this.photoDrop.classList.remove('dragover');
      this.handlePhotoFiles(e.dataTransfer.files);
    });

    // Text upload
    this.textInput = document.getElementById('text-input');
    this.textSubmit = document.getElementById('text-submit');
    this.recordForText = document.getElementById('record-for-text');
    this.recState = document.getElementById('rec-state');

    this.textSubmit.addEventListener('click', () => this.submitText());
    this.recordForText.addEventListener('click', () => this.startRecording('text'));

    // Audio upload
    this.recBtn = document.getElementById('rec-btn');
    this.recLabel = this.recBtn.querySelector('.rec-label');
    this.recTimer = document.getElementById('rec-timer');
    this.recPlayback = document.getElementById('rec-playback');
    this.audioSubmit = document.getElementById('audio-submit');

    this.recBtn.addEventListener('click', () => this.startRecording('audio'));
    this.audioSubmit.addEventListener('click', () => this.submitAudio());

    // Manage
    document.getElementById('export-btn').addEventListener('click', () => this.exportJSON());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearUserData());

    // Recorder state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStart = 0;
    this.recordingTimer = null;
    this.recordedBlob = null;
    this.recordedDataURL = null;
    this.recordContext = null; // 'text' or 'audio'

    this.updateStorageInfo();
  }

  open() {
    this.updateStorageInfo();
    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
    this.stopRecording();
  }

  switchTab(name) {
    this.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    this.modal.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.dataset.pane === name);
    });
  }

  async handlePhotoFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const dataURL = await fileToDataURL(file);
      const id = generateId();
      const item = { id, dataURL, name: file.name };
      this.photoQueue.push(item);
      this.renderPhotoPreview();
    }
    this.photoInput.value = '';
  }

  renderPhotoPreview() {
    this.photoPreview.innerHTML = '';
    this.photoQueue.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `
        <img src="${item.dataURL}" alt="">
        <button class="remove" data-idx="${idx}" title="移除">×</button>
        <button class="set-welcome" data-idx="${idx}" title="設為歡迎照片">★</button>
      `;
      this.photoPreview.appendChild(div);
    });
    this.photoPreview.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        this.photoQueue.splice(idx, 1);
        this.renderPhotoPreview();
      });
    });
    this.photoPreview.querySelectorAll('.set-welcome').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        this.setAsWelcomePhoto(this.photoQueue[idx].dataURL);
      });
    });
  }

  setAsWelcomePhoto(dataURL) {
    sessionStorage.setItem('anpu-welcome-photo', dataURL);
    // Preload to image
    const img = document.getElementById('welcome-photo');
    if (img) {
      img.src = dataURL;
      img.style.display = 'block';
      const ph = document.getElementById('welcome-photo-placeholder');
      if (ph) ph.style.display = 'none';
    }
    this.close();
    // Reload to welcome stage if currently on globe
    if (window.app && window.app.stageManager.current === 'globe') {
      this._goBackToWelcome();
    }
  }

  async _goBackToWelcome() {
    if (!window.app) return;
    await window.app.stageManager.blackoutShow(400);
    window.app.stageManager.show('welcome');
    await window.app.stageManager.blackoutHide(600);
  }

  async submitText() {
    const text = this.textInput.value.trim();
    if (!text) {
      alert('請先寫點什麼 :)');
      return;
    }
    const userData = Storage.load();
    const newQuote = { id: generateId(), text };
    if (this.recordedDataURL && this.recordContext === 'text') {
      newQuote.audio = this.recordedDataURL;
    }
    userData.quotes.push(newQuote);
    Storage.save(userData);

    this.textInput.value = '';
    this.recordedDataURL = null;
    this.recordedBlob = null;
    this.recState.textContent = '未錄音';
    this.updateStorageInfo();
    alert('已新增到球體！重新整理後可見。');

    // Trigger globe to refresh
    this.refreshGlobe();
  }

  async submitAudio() {
    if (!this.recordedDataURL) {
      alert('請先錄製語音');
      return;
    }
    // For audio without text, create a quote placeholder
    const userData = Storage.load();
    const text = prompt('為這段語音寫一句話（顯示在球體上）：', '一段未命名的聲音');
    if (text === null) return;

    userData.quotes.push({
      id: generateId(),
      text: text.trim() || '一段聲音',
      audio: this.recordedDataURL,
    });
    Storage.save(userData);

    this.recordedDataURL = null;
    this.recordedBlob = null;
    this.recPlayback.style.display = 'none';
    this.audioSubmit.style.display = 'none';
    this.recBtn.classList.remove('recording');
    this.recLabel.textContent = '開始錄音';
    this.recTimer.textContent = '00:00';
    this.updateStorageInfo();
    alert('已新增到球體！');
    this.refreshGlobe();
  }

  async startRecording(context) {
    this.recordContext = context;

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingStart = Date.now();

      this.mediaRecorder.addEventListener('dataavailable', (e) => {
        this.audioChunks.push(e.data);
      });

      this.mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.recordedBlob = blob;
        this.recordedDataURL = await blobToDataURL(blob);
        stream.getTracks().forEach(t => t.stop());

        if (this.recordContext === 'text') {
          this.recState.textContent = '已錄音 ✓';
        } else {
          this.recPlayback.src = this.recordedDataURL;
          this.recPlayback.style.display = 'block';
          this.audioSubmit.style.display = 'inline-flex';
        }
      });

      this.mediaRecorder.start();
      this.recBtn.classList.add('recording');
      this.recLabel.textContent = '停止錄音';
      this.recordingTimer = setInterval(() => {
        const elapsed = (Date.now() - this.recordingStart) / 1000;
        this.recTimer.textContent = formatTime(elapsed);
      }, 200);
    } catch (e) {
      alert('無法存取麥克風：' + e.message);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    this.recBtn.classList.remove('recording');
    this.recLabel.textContent = '開始錄音';
  }

  exportJSON() {
    const data = Storage.load();
    if (data.photos.length === 0 && data.quotes.length === 0) {
      alert('目前沒有可匯出的資料。');
      return;
    }

    // Save photo dataURLs separately
    const photosJson = data.photos.map(p => ({
      id: p.id,
      dataURL: p.dataURL,
      caption: p.caption || '',
    }));

    const quotesJson = data.quotes.map(q => ({
      id: q.id,
      text: q.text,
      audio: q.audio || null,
    }));

    // Photos as separate JSON
    const photosBlob = new Blob([JSON.stringify(photosJson, null, 2)], { type: 'application/json' });
    const photosUrl = URL.createObjectURL(photosBlob);
    const photosLink = document.createElement('a');
    photosLink.href = photosUrl;
    photosLink.download = 'user-photos.json';
    photosLink.click();

    setTimeout(() => {
      const quotesBlob = new Blob([JSON.stringify(quotesJson, null, 2)], { type: 'application/json' });
      const quotesUrl = URL.createObjectURL(quotesBlob);
      const quotesLink = document.createElement('a');
      photosLink.href = quotesUrl;
      const quotesLink2 = document.createElement('a');
      quotesLink2.href = quotesUrl;
      quotesLink2.download = 'user-quotes.json';
      quotesLink2.click();
    }, 500);

    setTimeout(() => {
      alert('已下載兩個 JSON 檔。\n\n接下來請：\n1. 在 GitHub repo 建立 data/ 資料夾\n2. 將 JSON 上傳進去\n3. 推送變更到 GitHub Pages\n\n這樣其他人打開你的網址就能看到這些內容。');
    }, 1500);
  }

  clearUserData() {
    if (confirm('確定要清空所有上傳的內容嗎？此操作無法復原。')) {
      Storage.clear();
      this.photoQueue = [];
      this.renderPhotoPreview();
      this.updateStorageInfo();
      this.refreshGlobe();
      alert('已清空。');
    }
  }

  updateStorageInfo() {
    const info = document.getElementById('storage-info');
    if (info) info.textContent = `已使用 ${Storage.size()} KB`;
  }

  refreshGlobe() {
    if (window.app && window.app.globe) {
      // Recreate sprites
      for (const s of window.app.globe.sprites) {
        window.app.globe.globeGroup.remove(s);
      }
      window.app.globe.sprites = [];
      window.app.globe.textureCache.clear();
      window.app.globe.createSprites();
    }
  }
}

// ============================================================
//  APP
// ============================================================

class App {
  constructor() {
    this.stageManager = new StageManager();
    this.curtain = null;
    this.welcome = null;
    this.globe = null;
    this.photoModal = null;
    this.quoteModal = null;
    this.uploadModal = null;

    this.init();
  }

  init() {
    // Start with curtain active
    this.stageManager.show('curtain');

    this.curtain = new CurtainStage(this.stageManager);
    this.welcome = new WelcomeStage(this.stageManager);
    this.photoModal = new PhotoModal();
    this.quoteModal = new QuoteModal();
    this.uploadModal = new UploadModal(this.stageManager);

    // Add button → upload modal
    document.getElementById('add-button').addEventListener('click', () => {
      this.uploadModal.open();
    });

    // Globe only initialized when stage is ready
    window.addEventListener('globe-stage-ready', () => {
      if (!this.globe) {
        this.globe = new GlobeStage();
        window.app = this;
      }
    });

    window.app = this;
  }
}

// ============================================================
//  BOOT
// ============================================================

const loading = document.createElement('div');
loading.id = 'loading-indicator';
loading.innerHTML = '<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>';
document.body.appendChild(loading);

window.addEventListener('load', () => {
  setTimeout(() => {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 600);
    new App();
  }, 300);
});