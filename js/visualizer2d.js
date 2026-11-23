/**
 * Interactive 2D Vector Space Coordinate Plane (White & Blue Template)
 * Uses HTML5 Canvas for crisp rendering of X-Y vector projections.
 */

class VectorVisualizer2D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.points = [];
    this.hoveredPoint = null;
    this.selectedWord = null;
    this.currentMode = 'meaning';

    // Viewport transforms (scale & pan)
    this.scale = 65; // pixels per unit
    this.offsetX = 0;
    this.offsetY = 0;

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.setupListeners();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0) return;
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = (rect.height || 480) * (window.devicePixelRatio || 1);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height || 480}px`;

    // Center origin
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2;

    this.render();
  }

  setupListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = (e.clientX - this.dragStart.x) * (window.devicePixelRatio || 1);
        const dy = (e.clientY - this.dragStart.y) * (window.devicePixelRatio || 1);
        this.offsetX += dx;
        this.offsetY += dy;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.render();
      } else {
        this.checkHover(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      this.scale = Math.max(30, Math.min(180, this.scale * zoomFactor));
      this.render();
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      const hit = this.getHitPoint(e);
      if (hit) {
        this.selectedWord = hit.word;
        if (window.on2DPointSelected) {
          window.on2DPointSelected(hit.word, hit.data);
        }
        this.render();
      }
    });
  }

  toScreen(x, y) {
    return {
      sx: this.offsetX + x * this.scale,
      sy: this.offsetY - y * this.scale
    };
  }

  toWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scale,
      y: (this.offsetY - sy) / this.scale
    };
  }

  loadVectors(mode = 'meaning', categoryFilter = 'all') {
    this.currentMode = mode;
    this.points = [];

    if (mode === 'meaning') {
      const raw = window.embeddingsEngine.getMeaningDataset();
      Object.keys(raw).forEach(word => {
        const item = raw[word];
        if (categoryFilter === 'all' || item.category === categoryFilter) {
          this.points.push({
            word,
            x: item.pos2d[0],
            y: item.pos2d[1],
            color: item.color,
            category: item.category,
            data: item
          });
        }
      });
      const state = window.pipelineState.getState();
      if (state.customEmbeddingInput && state.customEmbeddingInput.trim()) {
        const custom = window.embeddingsEngine.getMeaningVector(state.customEmbeddingInput);
        if (custom) {
          this.points.push({
            word: custom.word,
            x: custom.pos2d[0],
            y: custom.pos2d[1],
            color: custom.color,
            category: custom.category,
            data: custom
          });
        }
      }
    } else {
      window.embeddingsEngine.spellingAnchors.forEach(word => {
        const item = window.embeddingsEngine.getSpellingVector(word);
        if (item) {
          this.points.push({
            word,
            x: item.pos2d[0],
            y: item.pos2d[1],
            color: item.color,
            category: item.category,
            data: item
          });
        }
      });
      const state = window.pipelineState.getState();
      if (state.customEmbeddingInput && state.customEmbeddingInput.trim()) {
        const custom = window.embeddingsEngine.getSpellingVector(state.customEmbeddingInput);
        if (custom) {
          this.points.push({
            word: custom.word,
            x: custom.pos2d[0],
            y: custom.pos2d[1],
            color: custom.color,
            category: custom.category,
            data: custom
          });
        }
      }
    }

    this.render();
  }

  getHitPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (window.devicePixelRatio || 1);
    const sy = (e.clientY - rect.top) * (window.devicePixelRatio || 1);

    for (const pt of this.points) {
      const pos = this.toScreen(pt.x, pt.y);
      const dist = Math.hypot(sx - pos.sx, sy - pos.sy);
      if (dist <= 22) {
        return pt;
      }
    }
    return null;
  }

  checkHover(e) {
    const hit = this.getHitPoint(e);
    if (hit !== this.hoveredPoint) {
      this.hoveredPoint = hit;
      this.canvas.style.cursor = hit ? 'pointer' : 'default';
      this.render();
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background to clean white #ffffff
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid & Axes
    this.drawGrid(ctx, w, h);

    // Connecting lines if a point is selected
    if (this.selectedWord) {
      this.drawSelectedLines(ctx);
    }

    // Draw points
    this.points.forEach(pt => {
      const { sx, sy } = this.toScreen(pt.x, pt.y);
      const isSelected = this.selectedWord && this.selectedWord.toLowerCase() === pt.word.toLowerCase();
      const isHovered = this.hoveredPoint && this.hoveredPoint.word.toLowerCase() === pt.word.toLowerCase();

      // Outer halo
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(sx, sy, isSelected ? 18 : 14, 0, Math.PI * 2);
        ctx.fillStyle = pt.color + '25';
        ctx.fill();
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Point circle
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Word label text
      ctx.font = isSelected ? 'bold 13px Inter, sans-serif' : '600 12px Inter, sans-serif';
      ctx.fillStyle = isSelected ? '#1d4ed8' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(pt.word, sx, sy - 12);
    });

    // Tooltip overlay if hovering
    if (this.hoveredPoint) {
      const pt = this.hoveredPoint;
      const { sx, sy } = this.toScreen(pt.x, pt.y);

      const text = `${pt.word} (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(text).width;

      const tx = Math.min(Math.max(10, sx - textWidth / 2 - 8), w - textWidth - 20);
      const ty = Math.max(25, sy - 34);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tx, ty, textWidth + 16, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.fillText(text, tx + 8, ty + 16);
    }
  }

  drawGrid(ctx, w, h) {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    const startWorld = this.toWorld(0, h);
    const endWorld = this.toWorld(w, 0);

    const minX = Math.floor(startWorld.x);
    const maxX = Math.ceil(endWorld.x);
    const minY = Math.floor(startWorld.y);
    const maxY = Math.ceil(endWorld.y);

    // Vertical grid lines
    for (let x = minX; x <= maxX; x++) {
      const { sx } = this.toScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();

      if (x !== 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(x.toString(), sx, this.offsetY + 14);
      }
    }

    // Horizontal grid lines
    for (let y = minY; y <= maxY; y++) {
      const { sy } = this.toScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();

      if (y !== 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(y.toString(), this.offsetX - 6, sy + 3);
      }
    }

    // Primary Cartesian Axes (X: Blue, Y: Purple)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.offsetY);
    ctx.lineTo(w, this.offsetY);
    ctx.stroke();

    ctx.strokeStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(this.offsetX, 0);
    ctx.lineTo(this.offsetX, h);
    ctx.stroke();

    // Origin label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('(0,0)', this.offsetX - 6, this.offsetY + 14);
  }

  drawSelectedLines(ctx) {
    const target = this.points.find(p => p.word.toLowerCase() === this.selectedWord.toLowerCase());
    if (!target) return;

    const neighbors = window.embeddingsEngine.findNearestNeighbors(target.word, this.currentMode, 3);
    const p1 = this.toScreen(target.x, target.y);

    neighbors.forEach(n => {
      const other = this.points.find(p => p.word.toLowerCase() === n.word.toLowerCase());
      if (other) {
        const p2 = this.toScreen(other.x, other.y);

        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = (p1.sx + p2.sx) / 2;
        const my = (p1.sy + p2.sy) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#bfdbfe';
        ctx.strokeRect(mx - 24, my - 10, 48, 18);
        ctx.fillRect(mx - 24, my - 10, 48, 18);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${n.cosineSimilarity.toFixed(2)}`, mx, my + 3);
      }
    });
  }

  resetView() {
    this.scale = 65;
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2;
    this.render();
  }
}

// Global attachment
window.VectorVisualizer2D = VectorVisualizer2D;
