/**
 * Vector Embeddings Engine & Similarity Math
 * Implements:
 * 1. Spelling-based feature vector extraction (orthographic similarity).
 * 2. Meaning-based semantic embedding dataset (multi-dimensional semantic features + 2D/3D projections).
 * 3. Exact linear algebra: Dot product, L2 norm, Cosine similarity, Euclidean distance, Angle.
 */

class EmbeddingsEngine {
  constructor() {
    // Meaning-based semantic embedding dataset
    // Dimensions represent educational semantic feature axes:
    // [0]: Royalty / Status / Governance
    // [1]: Living / Biological (Animacy)
    // [2]: Edible / Food / Organic
    // [3]: Technology / AI / Digital
    // [4]: Transportation / Mechanical / Vehicle
    // [5]: Emotional Valence (-1.0 sad to +1.0 happy)
    // [6]: Physical Size / Scale
    // [7]: Abstractness / Conceptual
    this.semanticDimensions = [
      "Royalty / Power",
      "Biological Animacy",
      "Food / Edibility",
      "Technology / AI",
      "Vehicle / Mechanical",
      "Emotional Valence",
      "Physical Scale",
      "Abstractness"
    ];

    this.meaningDataset = {
      // Royalty / People
      "king": {
        category: "Royalty",
        color: "#f59e0b",
        vector: [0.95, 0.90, 0.05, 0.02, 0.10, 0.60, 0.70, 0.30],
        pos3d: [2.8, 1.8, 0.4],
        pos2d: [2.8, 1.8]
      },
      "queen": {
        category: "Royalty",
        color: "#fbbf24",
        vector: [0.93, 0.91, 0.04, 0.02, 0.10, 0.65, 0.68, 0.30],
        pos3d: [2.7, 1.9, 0.5],
        pos2d: [2.7, 1.9]
      },
      "prince": {
        category: "Royalty",
        color: "#d97706",
        vector: [0.85, 0.88, 0.05, 0.02, 0.15, 0.62, 0.60, 0.25],
        pos3d: [2.5, 1.6, 0.3],
        pos2d: [2.5, 1.6]
      },
      "princess": {
        category: "Royalty",
        color: "#fcd34d",
        vector: [0.84, 0.89, 0.05, 0.02, 0.15, 0.64, 0.58, 0.25],
        pos3d: [2.4, 1.7, 0.4],
        pos2d: [2.4, 1.7]
      },

      // Food / Fruits
      "apple": {
        category: "Fruit",
        color: "#ef4444",
        vector: [0.02, 0.40, 0.98, 0.05, 0.02, 0.55, 0.25, 0.10],
        pos3d: [-2.4, 2.3, -1.2],
        pos2d: [-2.4, 2.3]
      },
      "banana": {
        category: "Fruit",
        color: "#eab308",
        vector: [0.01, 0.38, 0.96, 0.04, 0.02, 0.52, 0.28, 0.10],
        pos3d: [-2.5, 2.1, -1.1],
        pos2d: [-2.5, 2.1]
      },
      "orange": {
        category: "Fruit",
        color: "#f97316",
        vector: [0.01, 0.41, 0.95, 0.05, 0.02, 0.58, 0.26, 0.10],
        pos3d: [-2.3, 2.2, -1.3],
        pos2d: [-2.3, 2.2]
      },

      // Vehicles / Transport
      "car": {
        category: "Vehicle",
        color: "#06b6d4",
        vector: [0.08, 0.05, 0.02, 0.35, 0.98, 0.45, 0.80, 0.20],
        pos3d: [-1.8, -2.5, 1.9],
        pos2d: [-1.8, -2.5]
      },
      "vehicle": {
        category: "Vehicle",
        color: "#0891b2",
        vector: [0.10, 0.05, 0.02, 0.38, 0.95, 0.40, 0.85, 0.50],
        pos3d: [-1.7, -2.3, 2.0],
        pos2d: [-1.7, -2.3]
      },
      "truck": {
        category: "Vehicle",
        color: "#3b82f6",
        vector: [0.05, 0.04, 0.01, 0.30, 0.97, 0.35, 0.95, 0.15],
        pos3d: [-1.9, -2.7, 2.1],
        pos2d: [-1.9, -2.7]
      },
      "bicycle": {
        category: "Vehicle",
        color: "#60a5fa",
        vector: [0.02, 0.08, 0.01, 0.15, 0.82, 0.50, 0.45, 0.10],
        pos3d: [-1.3, -2.0, 1.4],
        pos2d: [-1.3, -2.0]
      },

      // Technology & AI
      "artificial": {
        category: "Technology",
        color: "#a855f7",
        vector: [0.15, 0.10, 0.02, 0.92, 0.25, 0.20, 0.50, 0.85],
        pos3d: [0.5, -1.2, -2.5],
        pos2d: [0.5, -1.2]
      },
      "intelligence": {
        category: "Technology",
        color: "#c084fc",
        vector: [0.25, 0.65, 0.01, 0.90, 0.10, 0.45, 0.40, 0.95],
        pos3d: [0.8, -0.9, -2.6],
        pos2d: [0.8, -0.9]
      },
      "model": {
        category: "Technology",
        color: "#8b5cf6",
        vector: [0.10, 0.15, 0.02, 0.88, 0.20, 0.30, 0.35, 0.80],
        pos3d: [0.4, -1.4, -2.3],
        pos2d: [0.4, -1.4]
      },
      "computer": {
        category: "Technology",
        color: "#7c3aed",
        vector: [0.08, 0.05, 0.01, 0.95, 0.40, 0.35, 0.55, 0.60],
        pos3d: [0.2, -1.5, -2.1],
        pos2d: [0.2, -1.5]
      },

      // Animals
      "dog": {
        category: "Animal",
        color: "#10b981",
        vector: [0.05, 0.95, 0.10, 0.05, 0.10, 0.75, 0.50, 0.15],
        pos3d: [1.8, -1.8, 1.2],
        pos2d: [1.8, -1.8]
      },
      "cat": {
        category: "Animal",
        color: "#34d399",
        vector: [0.08, 0.94, 0.12, 0.04, 0.08, 0.68, 0.40, 0.15],
        pos3d: [1.7, -1.6, 1.3],
        pos2d: [1.7, -1.6]
      },
      "puppy": {
        category: "Animal",
        color: "#059669",
        vector: [0.03, 0.96, 0.11, 0.05, 0.08, 0.88, 0.30, 0.12],
        pos3d: [1.9, -1.9, 1.1],
        pos2d: [1.9, -1.9]
      },

      // Emotions
      "happy": {
        category: "Emotion",
        color: "#ec4899",
        vector: [0.10, 0.60, 0.10, 0.05, 0.05, 0.98, 0.30, 0.90],
        pos3d: [-0.6, 2.6, 1.5],
        pos2d: [-0.6, 2.6]
      },
      "joyful": {
        category: "Emotion",
        color: "#f472b6",
        vector: [0.12, 0.58, 0.10, 0.05, 0.05, 0.96, 0.32, 0.92],
        pos3d: [-0.5, 2.7, 1.6],
        pos2d: [-0.5, 2.7]
      },
      "sad": {
        category: "Emotion",
        color: "#64748b",
        vector: [0.05, 0.55, 0.08, 0.05, 0.05, -0.85, 0.25, 0.88],
        pos3d: [-0.8, 1.2, 1.8],
        pos2d: [-0.8, 1.2]
      }
    };

    // Reference words for spelling-based features
    this.spellingAnchors = ["cat", "cut", "car", "dog", "cot", "cart", "bat", "rat", "cow", "cap"];
  }

  // ==========================================
  // SPELLING-BASED EMBEDDING MODEL
  // ==========================================

  /**
   * Computes illustrative spelling-based educational feature vector.
   * Features:
   * 1. Word length (normalized 0 to 1 based on max length 12)
   * 2. Vowel ratio (count vowels / length)
   * 3. Starts with consonant (1.0) or vowel (0.0)
   * 4. Character overlap with anchor 'cat'
   * 5. Character overlap with anchor 'car'
   * 6. Character overlap with anchor 'dog'
   * 7. Normalized Levenshtein distance to 'cat'
   * 8. Bigram count / diversity
   */
  getSpellingVector(word) {
    if (!word) return null;
    const w = word.toLowerCase().trim();
    const len = w.length || 1;

    // Feature 1: Normalized length (capped at 12)
    const fLength = Math.min(len / 12, 1.0);

    // Feature 2: Vowel ratio
    const vowels = (w.match(/[aeiou]/g) || []).length;
    const fVowels = Number((vowels / len).toFixed(3));

    // Feature 3: Initial sound: 1.0 if consonant, 0.0 if vowel
    const startsConsonant = /^[bcdfghjklmnpqrstvwxyz]/.test(w) ? 1.0 : 0.0;

    // Feature 4, 5, 6: Character overlap with 'cat', 'car', 'dog'
    const overlapCat = this.calculateCharOverlap(w, "cat");
    const overlapCar = this.calculateCharOverlap(w, "car");
    const overlapDog = this.calculateCharOverlap(w, "dog");

    // Feature 7: Edit distance to 'cat' (1 - norm distance)
    const distCat = this.levenshteinDistance(w, "cat");
    const simCat = Math.max(0, 1 - (distCat / Math.max(len, 3)));

    // Feature 8: Bigram overlap with common suffixes
    const bigramCount = Math.max(1, len - 1);
    const fBigramDiversity = Number((new Set(this.extractNGrams(w, 2)).size / bigramCount).toFixed(3));

    const vector = [
      Number(fLength.toFixed(3)),
      Number(fVowels.toFixed(3)),
      startsConsonant,
      Number(overlapCat.toFixed(3)),
      Number(overlapCar.toFixed(3)),
      Number(overlapDog.toFixed(3)),
      Number(simCat.toFixed(3)),
      Number(fBigramDiversity.toFixed(3))
    ];

    // Orthographic 2D & 3D projection for visualization
    // X axis: overlap with cat vs dog
    // Y axis: length & vowel balance
    // Z axis: edit similarity to cat & car
    const x = Number(((overlapCat - overlapDog) * 3.5).toFixed(2));
    const y = Number(((fVowels - 0.4) * 5.0 + (fLength - 0.3) * 2.5).toFixed(2));
    const z = Number(((overlapCar - 0.3) * 4.0).toFixed(2));

    return {
      word: w,
      features: {
        length: len,
        vowelRatio: fVowels,
        startsConsonant,
        overlapCat,
        overlapCar,
        overlapDog,
        editDistanceToCat: distCat,
        bigramDiversity: fBigramDiversity
      },
      vector,
      pos3d: [x, y, z],
      pos2d: [x, y],
      category: "Spelling / Orthographic",
      color: this.getSpellingColor(w)
    };
  }

  getSpellingColor(word) {
    if (word.startsWith('c')) return '#38bdf8';
    if (word.startsWith('d')) return '#4ade80';
    if (word.startsWith('b')) return '#fbbf24';
    if (word.startsWith('a')) return '#f472b6';
    return '#a78bfa';
  }

  calculateCharOverlap(w1, w2) {
    const s1 = new Set(w1);
    const s2 = new Set(w2);
    let intersection = 0;
    for (const c of s1) {
      if (s2.has(c)) intersection++;
    }
    const union = new Set([...s1, ...s2]).size;
    return union === 0 ? 0 : Number((intersection / union).toFixed(3));
  }

  extractNGrams(word, n = 2) {
    const ngrams = [];
    for (let i = 0; i <= word.length - n; i++) {
      ngrams.push(word.slice(i, i + n));
    }
    return ngrams;
  }

  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // ==========================================
  // MEANING-BASED SEMANTIC EMBEDDINGS
  // ==========================================

  getMeaningDataset() {
    return this.meaningDataset;
  }

  getMeaningVector(word) {
    if (!word) return null;
    const clean = word.toLowerCase().trim();
    if (this.meaningDataset[clean]) {
      return {
        word: clean,
        ...this.meaningDataset[clean]
      };
    }

    // Heuristic inference for custom unseen words
    return this.inferCustomMeaningVector(clean);
  }

  /**
   * Infers a plausible semantic position for arbitrary words entered by the user
   * clearly marked as estimated/inferred
   */
  inferCustomMeaningVector(word) {
    const w = word.toLowerCase();
    let category = "General Concept";
    let color = "#cbd5e1";
    let vector = [0.1, 0.2, 0.05, 0.1, 0.1, 0.3, 0.4, 0.6];
    let pos3d = [0.0, 0.0, 0.0];

    // Check semantic triggers
    if (/king|queen|emperor|monarch|lord|crown|royal|prince|throne/.test(w)) {
      category = "Royalty";
      color = "#f59e0b";
      vector = [0.90, 0.85, 0.03, 0.05, 0.10, 0.60, 0.65, 0.30];
      pos3d = [2.6, 1.7, 0.4];
    } else if (/fruit|berry|melon|lemon|grape|food|eat|bread|cake/.test(w)) {
      category = "Fruit";
      color = "#ef4444";
      vector = [0.02, 0.35, 0.95, 0.02, 0.02, 0.50, 0.25, 0.10];
      pos3d = [-2.4, 2.0, -1.2];
    } else if (/car|bus|train|plane|auto|motor|drive|ship|boat|ride/.test(w)) {
      category = "Vehicle";
      color = "#06b6d4";
      vector = [0.08, 0.05, 0.02, 0.40, 0.95, 0.40, 0.85, 0.25];
      pos3d = [-1.8, -2.4, 1.9];
    } else if (/ai|code|data|algorithm|learn|robot|neural|network|gpt|llm|deep|tech/.test(w)) {
      category = "Technology";
      color = "#a855f7";
      vector = [0.20, 0.20, 0.01, 0.95, 0.25, 0.30, 0.45, 0.88];
      pos3d = [0.6, -1.1, -2.4];
    } else if (/cat|dog|lion|tiger|wolf|bear|horse|bird|fish|pet/.test(w)) {
      category = "Animal";
      color = "#10b981";
      vector = [0.05, 0.96, 0.12, 0.03, 0.10, 0.70, 0.45, 0.15];
      pos3d = [1.8, -1.7, 1.2];
    } else if (/happy|glad|delight|smile|love|cheer|good|peace/.test(w)) {
      category = "Emotion";
      color = "#ec4899";
      vector = [0.08, 0.60, 0.08, 0.05, 0.05, 0.95, 0.30, 0.92];
      pos3d = [-0.6, 2.5, 1.6];
    } else if (/sad|cry|grief|pain|bad|angry|hate|fear/.test(w)) {
      category = "Emotion";
      color = "#64748b";
      vector = [0.05, 0.55, 0.05, 0.05, 0.05, -0.85, 0.25, 0.90];
      pos3d = [-0.7, 1.1, 1.7];
    } else {
      // Deterministic hash based on characters so it sits stably in space
      let hash = 0;
      for (let i = 0; i < w.length; i++) {
        hash = (hash << 5) - hash + w.charCodeAt(i);
        hash |= 0;
      }
      const normHash1 = ((hash % 1000) / 1000) * 4 - 2;
      const normHash2 = (((hash >> 3) % 1000) / 1000) * 4 - 2;
      const normHash3 = (((hash >> 6) % 1000) / 1000) * 4 - 2;
      pos3d = [Number(normHash1.toFixed(2)), Number(normHash2.toFixed(2)), Number(normHash3.toFixed(2))];
    }

    return {
      word: w,
      category: `${category} (User Custom)`,
      color,
      vector,
      pos3d,
      pos2d: [pos3d[0], pos3d[1]],
      isCustom: true
    };
  }

  // ==========================================
  // MATHEMATICAL VECTOR OPERATIONS
  // ==========================================

  /**
   * Dot product of two vectors: u · v = sum(u_i * v_i)
   */
  dotProduct(u, v) {
    if (!u || !v || u.length !== v.length) return 0;
    return u.reduce((sum, val, i) => sum + val * v[i], 0);
  }

  /**
   * L2 Norm (magnitude): ||u|| = sqrt(sum(u_i^2))
   */
  vectorMagnitude(u) {
    if (!u) return 0;
    return Math.sqrt(u.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Cosine Similarity: cos(theta) = (u · v) / (||u|| * ||v||)
   * Ranges from -1.0 (opposite) to +1.0 (identical direction)
   */
  cosineSimilarity(u, v) {
    const dot = this.dotProduct(u, v);
    const magU = this.vectorMagnitude(u);
    const magV = this.vectorMagnitude(v);
    if (magU === 0 || magV === 0) return 0;
    return Number((dot / (magU * magV)).toFixed(4));
  }

  /**
   * Euclidean Distance: d(u, v) = sqrt(sum((u_i - v_i)^2))
   */
  euclideanDistance(u, v) {
    if (!u || !v || u.length !== v.length) return 0;
    const sumSquares = u.reduce((sum, val, i) => sum + Math.pow(val - v[i], 2), 0);
    return Number(Math.sqrt(sumSquares).toFixed(4));
  }

  /**
   * Vector Angle in degrees: arccos(cosine) * 180 / PI
   */
  vectorAngleDegrees(cosSim) {
    // Clamp to [-1, 1] to avoid floating point NaN in acos
    const clamped = Math.max(-1.0, Math.min(1.0, cosSim));
    const radians = Math.acos(clamped);
    return Number(((radians * 180) / Math.PI).toFixed(2));
  }

  /**
   * Computes nearest neighbors for a target word within the dataset
   */
  findNearestNeighbors(targetWord, mode = 'meaning', topK = 5) {
    const targetObj = mode === 'meaning' ? this.getMeaningVector(targetWord) : this.getSpellingVector(targetWord);
    if (!targetObj) return [];

    let datasetWords = [];
    if (mode === 'meaning') {
      datasetWords = Object.keys(this.meaningDataset);
    } else {
      datasetWords = this.spellingAnchors;
    }

    const results = [];
    datasetWords.forEach((word) => {
      if (word.toLowerCase() === targetWord.toLowerCase()) return;
      const otherObj = mode === 'meaning' ? this.getMeaningVector(word) : this.getSpellingVector(word);
      if (otherObj) {
        const cos = this.cosineSimilarity(targetObj.vector, otherObj.vector);
        const dist = this.euclideanDistance(targetObj.vector, otherObj.vector);
        results.push({
          word,
          category: otherObj.category,
          cosineSimilarity: cos,
          euclideanDistance: dist,
          pos3d: otherObj.pos3d,
          color: otherObj.color
        });
      }
    });

    results.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);
    return results.slice(0, topK);
  }
}

// Global instance
window.embeddingsEngine = new EmbeddingsEngine();
