/* ==========================================
   Anpu's Digital Archive · 安溥的數字檔案
   Main Application Logic
   ========================================== */

import * as THREE from 'three';

// ============================================================
//  DATA — 可自行修改照片與語錄內容
// ============================================================

const ARCHIVE_DATA = {
  photos: [
    { id: 'p1', label: '安溥 · 舞台',   hue: 25,  sat: 30, light: 55 },
    { id: 'p2', label: '安溥 · 日常',   hue: 35,  sat: 25, light: 50 },
    { id: 'p3', label: '安溥 · 側影',   hue: 20,  sat: 20, light: 45 },
    { id: 'p4', label: '安溥 · 吉他',   hue: 40,  sat: 30, light: 52 },
    { id: 'p5', label: '安溥 · 現場',   hue: 30,  sat: 35, light: 48 },
    { id: 'p6', label: '安溥 · 凝視',   hue: 22,  sat: 28, light: 50 },
    { id: 'p7', label: '安溥 · 背影',   hue: 38,  sat: 22, light: 46 },
    { id: 'p8', label: '安溥 · 微笑',   hue: 28,  sat: 32, light: 54 },
  ],
  quotes: [
    { id: 'q1', text: '我擁有的都是僥倖，\n我失去的都是人生。',  audio: 'assets/audio/q1.mp3' },
    { id: 'q2', text: '在所有人事已非的景色裡，\n我最喜歡你。',    audio: 'assets/audio/q2.mp3' },
    { id: 'q3', text: '你是我在這個世界上，\n唯一的唯一。',        audio: 'assets/audio/q3.mp3' },
    { id: 'q4', text: '關於我愛你。',                            audio: 'assets/audio/q4.mp3' },
    { id: 'q5', text: '我想你要走了。',                          audio: 'assets/audio/q5.mp3' },
    { id: 'q6', text: '南國的孩子。',                            audio: 'assets/audio/q6.mp3' },
    { id: 'q7', text: '日子。',                                  audio: 'assets/audio/q7.mp3' },
    { id: 'q8', text: '喜歡。',                                  audio: 'assets/audio/q8.mp3' },
    { id: 'q9', text: '留下來，\n或者我跟你走。',                 audio: 'assets/audio/q9.mp3' },
    { id: 'q10', text: '如果這就是最後了，\n謝謝你曾經來過。',     audio: 'assets/audio/q10.mp3' },
  ]
};

// ============================================================
//  UTILITY
// ============================================================

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.sqrt((x1-x2)**2 + (y1-y2)**2); }

// Generate a canvas-based texture for photo placeholders
function createPhotoTexture(w, h, hue, sat, light) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // White border (polaroid style)
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, w, h);

  // Inner photo area
  const margin = 8;
  const iw = w - margin * 2;
  const ih = h - margin * 2 - 16; // extra bottom margin for polaroid look

  // Gradient background with the given hue
  const grad = ctx.createLinearGradient(margin, margin, margin + iw, margin + ih);
  grad.addColorStop(0, `hsl(${hue}, ${sat}%, ${light}%)`);
  grad.addColorStop(1, `hsl(${hue + 10}, ${sat + 5}%, ${light - 10}%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(margin, margin, iw, ih);

  // Subtle texture overlay
  for (let i = 0; i < 200; i++) {
    const x = margin + Math.random() * iw;
    const y = margin + Math.random() * ih;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Film grain
  const imageData = ctx.getImageData(margin, margin, iw, ih);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    imageData.data[i] += noise;
    imageData.data[i+1] += noise;
    imageData.data[i+2] += noise;
  }
  ctx.putImageData(imageData, margin, margin);

  return new THREE.CanvasTexture(canvas);
}

// Generate a canvas-based texture for quote cards
function createQuoteTexture(text, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Semi-transparent dark background
  ctx.fillStyle = 'rgba(20, 16, 12, 0.85)';
  roundRect(ctx, 0, 0, w, h, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 6);
  ctx.stroke();

  // Text
  const lines = text.split('\n');
  const fontSize = Math.min(18, w / 12);
  ctx.fillStyle = '#e8dcc8';
  ctx.font = `${fontSize}px "Noto Serif TC", "Songti TC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.6;
  const totalHeight = lines.length * lineHeight;
  const startY = h / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, startY + i * lineHeight);
  });

  return new THREE.CanvasTexture(canvas);
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

// Generate noise texture for film grain on the sphere
function createNoiseTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 40);
    imageData.data[i] = v;
    imageData.data[i+1] = v;
    imageData.data[i+2] = v;
    imageData.data[i+3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================
//  CURTAIN STAGE
// ============================================================

class CurtainStage {
  constructor() {
    this.stage = document.getElementById('curtain-stage');
    this.canvas = document.getElementById('curtain-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.hint = document.getElementById('curtain-hint');
    this.welcome = document.getElementById('welcome-overlay');
    this.enterBtn = document.getElementById('enter-gate');

    this.stringCount = 40;
    this.beadsPerString = 18;
    this.beadRadius = 7;
    this.partingAmount = 0;        // 0 = closed, 1 = fully open
    this.targetParting = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragCurrentX = 0;
    this.openThreshold = 0.55;
    this.isOpen = false;
    this.isTransitioning = false;
    this.stringPositions = [];
    this.beadPhases = [];
    this.animFrame = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onDragStart(e.clientX));
    window.addEventListener('mousemove', (e) => this.onDragMove(e.clientX));
    window.addEventListener('mouseup', () => this.onDragEnd());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onDragStart(e.touches[0].clientX);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) e.preventDefault();
      this.onDragMove(e.touches[0].clientX);
    }, { passive: false });
    window.addEventListener('touchend', () => this.onDragEnd());

    // Enter button
    this.enterBtn.addEventListener('click', () => this.transitionToGlobe());

    // Initialize bead phases for sway animation
    for (let i = 0; i < this.stringCount; i++) {
      this.beadPhases.push(Math.random() * Math.PI * 2);
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.stringSpacing = this.w / (this.stringCount - 1);
    this.beadSpacing = this.h / (this.beadsPerString + 1);

    // Update string base positions
    this.stringPositions = [];
    for (let i = 0; i < this.stringCount; i++) {
      this.stringPositions.push(i * this.stringSpacing);
    }
  }

  onDragStart(x) {
    if (this.isOpen || this.isTransitioning) return;
    this.isDragging = true;
    this.dragStartX = x;
    this.dragCurrentX = x;
    this.hint.classList.add('fading');
  }

  onDragMove(x) {
    if (!this.isDragging) return;
    this.dragCurrentX = x;
    const dx = this.dragCurrentX - this.dragStartX;
    this.targetParting = clamp(Math.abs(dx) / (this.w * 0.55), 0, 1.2);
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.targetParting >= this.openThreshold) {
      this.targetParting = 1.1;
      setTimeout(() => this.showWelcome(), 600);
    } else {
      this.targetParting = 0;
      this.hint.classList.remove('fading');
    }
  }

  showWelcome() {
    this.isOpen = true;
    this.welcome.classList.add('visible');
  }

  transitionToGlobe() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.stage.classList.add('fade-out');

    setTimeout(() => {
      // Dispatch event to start globe stage
      window.dispatchEvent(new CustomEvent('curtain-opened'));
    }, 900);
  }

  animate() {
    this.animFrame = requestAnimationFrame(() => this.animate());

    // Smooth lerp parting amount
    this.partingAmount = lerp(this.partingAmount, this.targetParting, 0.08);
    if (Math.abs(this.partingAmount - this.targetParting) < 0.001) {
      this.partingAmount = this.targetParting;
    }

    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const t = performance.now() * 0.001;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Deep warm background
    ctx.fillStyle = '#0a0807';
    ctx.fillRect(0, 0, w, h);

    // Subtle vignette
    const vignetteGrad = ctx.createRadialGradient(w/2, h/2, w*0.4, w/2, h/2, w*0.8);
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const spread = w * 0.35;

    // Draw each string
    for (let i = 0; i < this.stringCount; i++) {
      const baseX = this.stringPositions[i];
      const phase = this.beadPhases[i];

      // Calculate parting offset using Gaussian-like function
      const distFromCenter = (baseX - centerX) / spread;
      const partingFactor = Math.exp(-distFromCenter * distFromCenter * 1.5);
      const sign = baseX >= centerX ? 1 : -1;
      const offset = sign * this.partingAmount * spread * 0.7 * partingFactor;

      const stringX = baseX + offset;

      // Draw beads on this string
      for (let j = 0; j < this.beadsPerString; j++) {
        const beadY = this.beadSpacing * (j + 1);

        // Slight sway animation
        const sway = Math.sin(t * 1.5 + phase + j * 0.3) * (3 + Math.random() * 0.5);
        const bx = stringX + sway;
        const by = beadY;

        // Skip if off screen
        if (bx < -20 || bx > w + 20) continue;

        this.drawBead(ctx, bx, by, this.beadRadius);
      }
    }

    // Subtle light glow from behind the curtain
    if (this.partingAmount > 0.1) {
      const glowAlpha = this.partingAmount * 0.15;
      const glowGrad = ctx.createRadialGradient(centerX, h/2, 0, centerX, h/2, w * 0.3);
      glowGrad.addColorStop(0, `rgba(240, 220, 180, ${glowAlpha})`);
      glowGrad.addColorStop(1, 'rgba(240, 220, 180, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  drawBead(ctx, x, y, r) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1.5, r, 0, Math.PI * 2);
    ctx.fill();

    // Main bead body with gradient
    const grad = ctx.createRadialGradient(x - r*0.3, y - r*0.35, r*0.1, x, y, r);
    grad.addColorStop(0, '#c8a870');
    grad.addColorStop(0.4, '#8b6914');
    grad.addColorStop(0.7, '#5c3d0e');
    grad.addColorStop(1, '#3a2208');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    const hlGrad = ctx.createRadialGradient(x - r*0.3, y - r*0.35, 0, x - r*0.3, y - r*0.35, r*0.7);
    hlGrad.addColorStop(0, 'rgba(255,240,210,0.5)');
    hlGrad.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}

// ============================================================
//  GLOBE STAGE
// ============================================================

class GlobeStage {
  constructor() {
    this.container = document.getElementById('globe-container');
    this.stage = document.getElementById('globe-stage');

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globeGroup = null;
    this.sphere = null;
    this.sprites = [];
    this.particles = null;

    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.autoRotateSpeed = 0.003;
    this.autoRotate = true;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredSprite = null;
    this.selectedSprite = null;

    this.animFrame = null;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupLighting();
    this.createGlobe();
    this.createSprites();
    this.createAmbientParticles();
    this.setupEvents();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0.3, 7.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Globe group (for rotation)
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
  }

  setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x3a3028, 1.8);
    this.scene.add(ambient);

    // Key light (warm)
    const keyLight = new THREE.DirectionalLight(0xffe8d0, 3.5);
    keyLight.position.set(5, 3, 5);
    this.scene.add(keyLight);

    // Fill light (cooler)
    const fillLight = new THREE.DirectionalLight(0x8090c0, 1.2);
    fillLight.position.set(-3, -1, -3);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(0xffd8b0, 2.0);
    rimLight.position.set(0, -2, 4);
    this.scene.add(rimLight);
  }

  createGlobe() {
    const geometry = new THREE.SphereGeometry(2.2, 80, 80);

    // Create noise texture for film grain / roughness variation
    const noiseCanvas = createNoiseTexture(512);
    const noiseTexture = new THREE.CanvasTexture(noiseCanvas);
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;
    noiseTexture.repeat.set(4, 4);

    const material = new THREE.MeshStandardMaterial({
      color: 0xe8dcc0,
      roughness: 0.82,
      metalness: 0.03,
      roughnessMap: noiseTexture,
      roughnessMapIntensity: 0.15,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.globeGroup.add(this.sphere);

    // Subtle wireframe ring (decorative)
    const ringGeo = new THREE.TorusGeometry(2.28, 0.008, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.25 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.65;
    this.globeGroup.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.32, 0.006, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.15 })
    );
    ring2.rotation.x = Math.PI * 0.15;
    ring2.rotation.y = Math.PI * 0.3;
    this.globeGroup.add(ring2);
  }

  createSprites() {
    const sphereRadius = 2.25;
    const allItems = [];

    // Add photos
    ARCHIVE_DATA.photos.forEach((photo, i) => {
      allItems.push({ type: 'photo', data: photo, index: i });
    });

    // Add quotes
    ARCHIVE_DATA.quotes.forEach((quote, i) => {
      allItems.push({ type: 'quote', data: quote, index: i });
    });

    // Shuffle
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    const total = allItems.length;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    allItems.forEach((item, i) => {
      // Fibonacci sphere distribution
      const y = 1 - (i / (total - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const position = new THREE.Vector3(x, y, z).multiplyScalar(sphereRadius);

      let sprite;
      if (item.type === 'photo') {
        sprite = this.createPhotoSprite(item.data);
      } else {
        sprite = this.createQuoteSprite(item.data);
      }

      sprite.position.copy(position);
      sprite.userData = {
        type: item.type,
        data: item.data,
        basePosition: position.clone(),
        baseScale: sprite.scale.clone(),
        isPhoto: item.type === 'photo',
        isQuote: item.type === 'quote',
      };

      this.globeGroup.add(sprite);
      this.sprites.push(sprite);
    });
  }

  createPhotoSprite(photoData) {
    const texture = createPhotoTexture(200, 180, photoData.hue, photoData.sat, photoData.light);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.55, 0.5, 1);
    return sprite;
  }

  createQuoteSprite(quoteData) {
    const texture = createQuoteTexture(quoteData.text, 256, 140);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.65, 0.36, 1);
    return sprite;
  }

  createAmbientParticles() {
    const particlesGeo = new THREE.BufferGeometry();
    const count = 300;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random positions in a sphere shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.5 + Math.random() * 4;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMat = new THREE.PointsMaterial({
      color: 0xc9a96e,
      size: 0.015,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(particlesGeo, particlesMat);
    this.scene.add(this.particles);
  }

  setupEvents() {
    const canvas = this.renderer.domElement;

    // Mouse
    canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.onPointerUp());

    // Touch
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchend', () => this.onPointerUp());

    // Click for sprite selection
    canvas.addEventListener('click', (e) => this.onClick(e));

    // Resize
    window.addEventListener('resize', () => this.onResize());
  }

  onPointerDown(x, y) {
    this.isDragging = true;
    this.autoRotate = false;
    this.prevMouse.x = x;
    this.prevMouse.y = y;
    this.rotationVelocity.set(0, 0);
  }

  onPointerMove(x, y) {
    if (!this.isDragging) return;

    const dx = x - this.prevMouse.x;
    const dy = y - this.prevMouse.y;

    this.globeGroup.rotation.y += dx * 0.005;
    this.globeGroup.rotation.x += dy * 0.005;

    // Clamp vertical rotation
    this.globeGroup.rotation.x = clamp(this.globeGroup.rotation.x, -Math.PI / 2.5, Math.PI / 2.5);

    this.rotationVelocity.x = dy * 0.005;
    this.rotationVelocity.y = dx * 0.005;

    this.prevMouse.x = x;
    this.prevMouse.y = y;
  }

  onPointerUp() {
    this.isDragging = false;

    // Resume auto-rotate after a delay
    setTimeout(() => {
      if (!this.isDragging) {
        this.autoRotate = true;
      }
    }, 1500);
  }

  onClick(event) {
    // Only handle clicks (not drags)
    if (Math.abs(this.rotationVelocity.x) > 0.01 || Math.abs(this.rotationVelocity.y) > 0.01) {
      return;
    }

    // Calculate mouse position in normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.sprites);

    if (intersects.length > 0) {
      const sprite = intersects[0].object;
      if (sprite.userData.isPhoto) {
        this.openPhotoModal(sprite.userData.data);
      } else if (sprite.userData.isQuote) {
        this.openQuoteModal(sprite.userData.data);
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

  openPhotoModal(photoData) {
    window.dispatchEvent(new CustomEvent('open-photo', { detail: photoData }));
  }

  openQuoteModal(quoteData) {
    window.dispatchEvent(new CustomEvent('open-quote', { detail: quoteData }));
  }

  animate() {
    this.animFrame = requestAnimationFrame(() => this.animate());

    // Auto rotation
    if (this.autoRotate) {
      this.globeGroup.rotation.y += this.autoRotateSpeed;
    } else {
      // Inertia
      this.globeGroup.rotation.y += this.rotationVelocity.y;
      this.globeGroup.rotation.x += this.rotationVelocity.x;
      this.globeGroup.rotation.x = clamp(this.globeGroup.rotation.x, -Math.PI / 2.5, Math.PI / 2.5);

      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;
    }

    // Rotate particles slowly
    if (this.particles) {
      this.particles.rotation.y += 0.0003;
      this.particles.rotation.x += 0.0001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// ============================================================
//  PHOTO MODAL
// ============================================================

class PhotoModal {
  constructor() {
    this.modal = document.getElementById('photo-modal');
    this.backdrop = this.modal.querySelector('.modal-backdrop');
    this.img = document.getElementById('photo-modal-img');
    this.caption = document.getElementById('photo-modal-caption');

    this.backdrop.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener('open-photo', (e) => this.open(e.detail));
  }

  open(photoData) {
    // Generate a larger version of the photo placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    const hue = photoData.hue;
    const sat = photoData.sat;
    const light = photoData.light;

    // White border
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, 600, 500);

    const margin = 20;
    const iw = 600 - margin * 2;
    const ih = 500 - margin * 2 - 30;

    // Gradient
    const grad = ctx.createLinearGradient(margin, margin, margin + iw, margin + ih);
    grad.addColorStop(0, `hsl(${hue}, ${sat}%, ${light}%)`);
    grad.addColorStop(1, `hsl(${hue + 10}, ${sat + 5}%, ${light - 10}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(margin, margin, iw, ih);

    // Texture
    for (let i = 0; i < 500; i++) {
      const x = margin + Math.random() * iw;
      const y = margin + Math.random() * ih;
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.fillRect(x, y, 3, 3);
    }

    // Film grain
    const imageData = ctx.getImageData(margin, margin, iw, ih);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      imageData.data[i] += noise;
      imageData.data[i+1] += noise;
      imageData.data[i+2] += noise;
    }
    ctx.putImageData(imageData, margin, margin);

    this.img.src = canvas.toDataURL();
    this.caption.textContent = photoData.label;

    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
    // Pause audio if playing
    window.dispatchEvent(new CustomEvent('stop-audio'));
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
    this.playIcon = document.getElementById('play-icon');
    this.pauseIcon = document.getElementById('pause-icon');
    this.hintEl = document.getElementById('audio-hint');

    this.audio = null;
    this.currentQuoteData = null;
    this.isPlaying = false;

    this.backdrop.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleAudio();
    });

    window.addEventListener('open-quote', (e) => this.open(e.detail));
    window.addEventListener('stop-audio', () => this.stopAudio());
  }

  open(quoteData) {
    this.currentQuoteData = quoteData;
    this.textEl.textContent = quoteData.text.replace(/\n/g, '\n');
    this.modal.classList.add('active');
    this.resetPlayButton();
    this.stopAudio();
  }

  close() {
    this.modal.classList.remove('active');
    this.stopAudio();
  }

  resetPlayButton() {
    this.isPlaying = false;
    this.playIcon.style.display = 'block';
    this.pauseIcon.style.display = 'none';
    this.hintEl.textContent = '輕觸聆聽';
  }

  toggleAudio() {
    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      this.playAudio();
    }
  }

  playAudio() {
    if (!this.currentQuoteData) return;

    // Stop any existing audio
    this.stopAudio();

    // Create new audio
    this.audio = new Audio(this.currentQuoteData.audio);

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
      this.hintEl.textContent = '正在播放...';
    });

    this.audio.addEventListener('ended', () => {
      this.resetPlayButton();
    });

    this.audio.addEventListener('error', () => {
      // Audio file not found — show gracefully
      this.hintEl.textContent = '音檔尚未就緒';
      this.resetPlayButton();
      // Still show playing state briefly as feedback
      this.isPlaying = true;
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
      setTimeout(() => {
        this.resetPlayButton();
      }, 1500);
    });

    this.audio.play().catch(() => {
      // Autoplay prevented or file not found
      this.hintEl.textContent = '音檔尚未就緒';
      this.resetPlayButton();
    });
  }

  pauseAudio() {
    if (this.audio) {
      this.audio.pause();
    }
    this.resetPlayButton();
  }

  stopAudio() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.resetPlayButton();
  }
}

// ============================================================
//  APP — Orchestrator
// ============================================================

class App {
  constructor() {
    this.curtain = null;
    this.globe = null;
    this.photoModal = null;
    this.quoteModal = null;

    this.init();
  }

  init() {
    // Start curtain
    this.curtain = new CurtainStage();

    // Listen for curtain opened event
    window.addEventListener('curtain-opened', () => {
      this.startGlobeStage();
    });

    // Initialize modals (inactive until globe is ready)
    this.photoModal = new PhotoModal();
    this.quoteModal = new QuoteModal();
  }

  startGlobeStage() {
    // Small delay for smooth transition
    setTimeout(() => {
      this.globe = new GlobeStage();
    }, 300);
  }
}

// ============================================================
//  BOOT
// ============================================================

// Show loading indicator briefly
const loading = document.createElement('div');
loading.id = 'loading-indicator';
loading.innerHTML = '<span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>';
document.body.appendChild(loading);

// Wait for fonts and resources
window.addEventListener('load', () => {
  setTimeout(() => {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 600);
    new App();
  }, 400);
});