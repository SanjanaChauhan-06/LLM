/**
 * Three.js 3D Vector Space Explorer (White & Blue Template)
 * Visualizes words as coordinates in a 3D Euclidean vector space.
 * Features:
 * - Orbit, zoom, pan controls
 * - Vibrant sphere nodes & crisp white-badge canvas text sprites
 * - Interactive raycasting (hover tooltip & click inspection)
 * - 3D Coordinate axes with labels and light-theme reference grid
 * - Similarity connection lines between nearest neighbors
 * - Category filtering and smooth animated camera focus
 */

class VectorVisualizer3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointsGroup = null;
    this.linesGroup = null;
    this.labelsGroup = null;
    this.axesGroup = null;

    this.wordNodes = []; // { mesh, labelSprite, word, data }
    this.hoveredNode = null;
    this.selectedWord = null;
    this.currentMode = 'meaning'; // 'meaning' | 'spelling'

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Camera controller state
    this.isDragging = false;
    this.isRightDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.35, y: -0.6 };
    this.currentRotation = { x: 0.35, y: -0.6 };
    this.cameraDistance = 9.5;
    this.targetCameraDistance = 9.5;
    this.cameraPan = new THREE.Vector3(0, 0, 0);
    this.targetPan = new THREE.Vector3(0, 0, 0);

    this.animationFrameId = null;
    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 520;

    // Scene with soft light ice-blue background
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf0f7ff, 0.025);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.updateCameraPosition();

    // Renderer (Clear color: soft ice-blue #f0f7ff)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf0f7ff, 1);
    this.container.appendChild(this.renderer.domElement);

    // Groups
    this.axesGroup = new THREE.Group();
    this.pointsGroup = new THREE.Group();
    this.linesGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();

    this.scene.add(this.axesGroup);
    this.scene.add(this.linesGroup);
    this.scene.add(this.pointsGroup);
    this.scene.add(this.labelsGroup);

    // Lights optimized for white & blue template
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2563eb, 0.5);
    dirLight1.position.set(10, 20, 15);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 0.4);
    dirLight2.position.set(-10, -10, -10);
    this.scene.add(dirLight2);

    // Create 3D Axes & Reference Grids
    this.createAxesAndGrids();

    // Event Listeners
    this.setupInteractionListeners();

    // Resize handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Start render loop
    this.animate();
  }

  createAxesAndGrids() {
    this.axesGroup.clear();

    // Grid on XZ plane with light gray & blue grid lines
    const gridXZ = new THREE.GridHelper(12, 12, 0x94a3b8, 0xdbeafe);
    gridXZ.position.y = -3.5;
    this.axesGroup.add(gridXZ);

    // 3D Axes Lines (X: Vibrant Blue, Y: Purple, Z: Amber)
    const axisMaterialX = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.7, linewidth: 2 });
    const axisMaterialY = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.7, linewidth: 2 });
    const axisMaterialZ = new THREE.LineBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.7, linewidth: 2 });

    const createAxisLine = (p1, p2, mat) => {
      const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      return new THREE.Line(geom, mat);
    };

    // X axis
    this.axesGroup.add(createAxisLine(new THREE.Vector3(-4.5, 0, 0), new THREE.Vector3(4.5, 0, 0), axisMaterialX));
    // Y axis
    this.axesGroup.add(createAxisLine(new THREE.Vector3(0, -3.5, 0), new THREE.Vector3(0, 3.5, 0), axisMaterialY));
    // Z axis
    this.axesGroup.add(createAxisLine(new THREE.Vector3(0, 0, -4.5), new THREE.Vector3(0, 0, 4.5), axisMaterialZ));

    // Axis End Labels
    this.createAxisLabel("+X (Dim 1)", new THREE.Vector3(4.8, 0, 0), "#2563eb");
    this.createAxisLabel("+Y (Dim 2)", new THREE.Vector3(0, 3.8, 0), "#7c3aed");
    this.createAxisLabel("+Z (Dim 3)", new THREE.Vector3(0, 0, 4.8), "#d97706");
  }

  createAxisLabel(text, position, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.scale.set(1.5, 0.4, 1);
    this.axesGroup.add(sprite);
  }

  /**
   * Generates a floating canvas text sprite for words in 3D (White & Blue Card Style)
   */
  createTextSprite(text, colorHex, isHighlighted = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Rounded badge background (White with drop shadow and colored border)
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#ffffff';
    ctx.strokeStyle = colorHex || '#2563eb';
    ctx.lineWidth = isHighlighted ? 4 : 2;

    const x = 10, y = 10, w = 236, h = 60, r = 12;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark charcoal/navy text for maximum contrast on white
    ctx.font = isHighlighted ? 'bold 26px Inter, sans-serif' : 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.4, 0.45, 1);
    return sprite;
  }

  loadVectors(mode = 'meaning', categoryFilter = 'all') {
    this.currentMode = mode;
    this.pointsGroup.clear();
    this.labelsGroup.clear();
    this.linesGroup.clear();
    this.wordNodes = [];

    let dataset = [];

    if (mode === 'meaning') {
      const rawData = window.embeddingsEngine.getMeaningDataset();
      Object.keys(rawData).forEach(word => {
        const item = rawData[word];
        if (categoryFilter === 'all' || item.category === categoryFilter) {
          dataset.push({ word, ...item });
        }
      });
      const state = window.pipelineState.getState();
      if (state.customEmbeddingInput && state.customEmbeddingInput.trim()) {
        const customItem = window.embeddingsEngine.getMeaningVector(state.customEmbeddingInput);
        if (customItem) dataset.push(customItem);
      }
    } else {
      window.embeddingsEngine.spellingAnchors.forEach(word => {
        const item = window.embeddingsEngine.getSpellingVector(word);
        if (item) dataset.push(item);
      });
      const state = window.pipelineState.getState();
      if (state.customEmbeddingInput && state.customEmbeddingInput.trim()) {
        const customItem = window.embeddingsEngine.getSpellingVector(state.customEmbeddingInput);
        if (customItem) dataset.push(customItem);
      }
    }

    const sphereGeometry = new THREE.SphereGeometry(0.18, 24, 24);
    const glowGeometry = new THREE.SphereGeometry(0.28, 16, 16);

    dataset.forEach(item => {
      const pos = item.pos3d || [0, 0, 0];
      const color = new THREE.Color(item.color || '#2563eb');

      // Sphere Mesh
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.15,
        metalness: 0.3
      });
      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);

      // Soft Halo
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        wireframe: true
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMat);
      mesh.add(glowMesh);

      mesh.userData = { word: item.word, itemData: item };
      this.pointsGroup.add(mesh);

      // Label sprite positioned slightly above
      const labelSprite = this.createTextSprite(item.word, item.color);
      labelSprite.position.set(pos[0], pos[1] + 0.42, pos[2]);
      this.labelsGroup.add(labelSprite);

      this.wordNodes.push({
        mesh,
        glowMesh,
        labelSprite,
        word: item.word,
        data: item,
        originalPosition: mesh.position.clone()
      });
    });

    if (this.selectedWord) {
      this.highlightWord(this.selectedWord);
    }
  }

  highlightWord(word) {
    this.selectedWord = word;
    this.linesGroup.clear();

    const targetNode = this.wordNodes.find(n => n.word.toLowerCase() === word.toLowerCase());
    if (!targetNode) return;

    this.wordNodes.forEach(n => {
      const isTarget = n.word.toLowerCase() === word.toLowerCase();
      n.mesh.scale.setScalar(isTarget ? 1.5 : 1.0);
      if (n.glowMesh) {
        n.glowMesh.material.opacity = isTarget ? 0.5 : 0.15;
      }
    });

    const neighbors = window.embeddingsEngine.findNearestNeighbors(word, this.currentMode, 3);
    const p1 = targetNode.mesh.position;

    neighbors.forEach((neighbor) => {
      const neighborNode = this.wordNodes.find(n => n.word.toLowerCase() === neighbor.word.toLowerCase());
      if (neighborNode) {
        const p2 = neighborNode.mesh.position;

        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0x2563eb,
          dashSize: 0.2,
          gapSize: 0.1,
          linewidth: 2,
          transparent: true,
          opacity: 0.85
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        this.linesGroup.add(line);

        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const simTag = this.createScoreSprite(`Sim: ${neighbor.cosineSimilarity.toFixed(2)}`, '#2563eb');
        simTag.position.copy(midPoint);
        this.linesGroup.add(simTag);
      }
    });
  }

  createScoreSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 172, 40);
    ctx.fillRect(4, 4, 172, 40);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 90, 24);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.9, 0.25, 1);
    return sprite;
  }

  setupInteractionListeners() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = e.button === 0;
      this.isRightDragging = e.button === 2;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      this.mouse.x = (clientX / rect.width) * 2 - 1;
      this.mouse.y = -(clientY / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.008;
        this.targetRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.targetRotation.x));
      } else if (this.isRightDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.targetPan.x -= deltaX * 0.01;
        this.targetPan.y += deltaY * 0.01;
      }

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.checkRaycastHover();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.isRightDragging = false;
    });

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetCameraDistance += e.deltaY * 0.006;
      this.targetCameraDistance = Math.max(3.0, Math.min(22.0, this.targetCameraDistance));
    }, { passive: false });

    el.addEventListener('click', () => {
      if (this.hoveredNode) {
        this.highlightWord(this.hoveredNode.word);
        if (window.on3DPointSelected) {
          window.on3DPointSelected(this.hoveredNode.word, this.hoveredNode.data);
        }
      }
    });

    let touchStartX = 0, touchStartY = 0, initialPinchDistance = 0;

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.008;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialPinchDistance - dist;
        this.targetCameraDistance += diff * 0.02;
        this.targetCameraDistance = Math.max(3.0, Math.min(22.0, this.targetCameraDistance));
        initialPinchDistance = dist;
      }
    }, { passive: true });
  }

  checkRaycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.wordNodes.map(n => n.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);

    const tooltipEl = document.getElementById('three-tooltip');

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const node = this.wordNodes.find(n => n.mesh === hitMesh);

      if (node) {
        this.hoveredNode = node;
        this.renderer.domElement.style.cursor = 'pointer';

        if (tooltipEl) {
          const pos = node.data.pos3d;
          tooltipEl.innerHTML = `
            <div class="font-bold text-slate-900 flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${node.data.color}"></span>
              ${node.word}
            </div>
            <div class="text-xs text-slate-500 mt-1">Category: <span class="text-blue-600 font-semibold">${node.data.category}</span></div>
            <div class="text-xs font-mono text-purple-600 mt-0.5">X: ${pos[0]} | Y: ${pos[1]} | Z: ${pos[2]}</div>
          `;
          tooltipEl.style.display = 'block';
          tooltipEl.style.left = `${(this.mouse.x + 1) * 50}%`;
          tooltipEl.style.top = `${(-this.mouse.y + 1) * 50}%`;
        }
        return;
      }
    }

    this.hoveredNode = null;
    this.renderer.domElement.style.cursor = 'grab';
    if (tooltipEl) {
      tooltipEl.style.display = 'none';
    }
  }

  updateCameraPosition() {
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.1;
    this.cameraPan.lerp(this.targetPan, 0.1);

    const cosX = Math.cos(this.currentRotation.x);
    const sinX = Math.sin(this.currentRotation.x);
    const cosY = Math.cos(this.currentRotation.y);
    const sinY = Math.sin(this.currentRotation.y);

    const cx = this.cameraDistance * cosX * sinY;
    const cy = this.cameraDistance * sinX;
    const cz = this.cameraDistance * cosX * cosY;

    this.camera.position.set(cx + this.cameraPan.x, cy + this.cameraPan.y, cz + this.cameraPan.z);
    this.camera.lookAt(this.cameraPan);
  }

  resetCamera() {
    this.targetRotation = { x: 0.35, y: -0.6 };
    this.targetCameraDistance = 9.5;
    this.targetPan.set(0, 0, 0);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Attach globally
window.VectorVisualizer3D = VectorVisualizer3D;
