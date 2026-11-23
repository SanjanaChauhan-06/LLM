# LLM Pipeline Explorer (White & Blue Vertical Slide Edition)

An interactive, visual learning platform designed to explain how Large Language Models (LLMs) process human language — transforming raw text sentences into tokens, vocabulary integers, fallback units, and high-dimensional vector representations.

![Theme](https://img.shields.io/badge/Template-White%20%26%20Blue-blue)
![Layout](https://img.shields.io/badge/Layout-Vertical%20Slide%20Presentation-0284c7)
![3D Engine](https://img.shields.io/badge/3D%20Engine-Three.js-purple)
![Animations](https://img.shields.io/badge/Animations-GSAP-green)

---

## 🎨 Design & Navigation Architecture

- **White & Blue Modern Laboratory Palette**: High-contrast white surfaces (`#ffffff`), pale blue accents (`#eff6ff`, `#dbeafe`), electric and royal blues (`#2563eb`, `#1d4ed8`, `#0284c7`), dark charcoal headings (`#0f172a`), and clean elevation shadows.
- **Streamlined 5-Slide Vertical Presentation**:
  1. **Slide 01 — Vocabulary Builder**: Sentence input workspace, live corpus metrics, unique token cataloging, and vocabulary export (JSON/CSV).
  2. **Slide 02 — Tokenization Engine**: Maps sentence tokens to vocabulary integer IDs, flags unseen tokens (ID 0), and inspects token frequency and status.
  3. **Slide 03 — Final Token Count**: Tally of tokens entering the context window and side-by-side sequence transformation.
  4. **Slide 04 — Vector Embeddings**: Meaning-based vs. spelling-based representation, multi-dimensional feature decomposition, and custom word vector inference.
  5. **Slide 05 — 2D & 3D Similarity Explorer**: Interactive Three.js 3D vector space, 2D coordinate plane, category filtering, and mathematical similarity workbench (Cosine Similarity, Angle, Dot Product, Euclidean Distance).
- **Multiple Ways to Slide Vertically**:
  - **Floating Dot Navigator**: Numbered indicator dots fixed to the right screen edge with hover tooltips.
  - **Sticky Header Stepper**: Synchronizes in real time with your vertical position via `IntersectionObserver`.
  - **Floating Arrow Buttons & Keyboard Navigation**: Glide smoothly through slides using on-screen Up/Down buttons or your keyboard's `ArrowUp` / `ArrowDown` (or `PageUp` / `PageDown`).
  - **Slide Action Bars**: Every slide includes prominent "Previous Slide ↑" and "Next Slide ↓" action buttons.

The platform features an 8-stage interactive pipeline:

1. **Pipeline Overview**: High-level visual map detailing text preprocessing, token indexing, and geometric projection into $\mathbb{R}^d$.
2. **Module 1 & 2: Sentence Input & Vocabulary Builder**:
   - Multiline textarea with default sentences:
     - *"I love learning about artificial intelligence."*
     - *"I am building an LLM pipeline explorer."*
     - *"Artificial intelligence is interesting."*
   - Real-time sentence, word, and character metrics with full punctuation preservation.
   - Dynamic vocabulary generator that catalogs unique tokens in order of appearance.
   - **ID 0 is strictly reserved for `[UNK]`**, with normal tokens starting from ID 1.
   - Searchable, sortable vocabulary table with JSON and CSV export.
3. **Module 3: Tokenization**:
   - Maps raw sentence text to vocabulary integer IDs.
   - Distinct visual badges for Known (cyan/blue) and Unknown (warning red/orange) tokens.
   - Clickable token pills revealing frequency, vocabulary index, and status in an inspector modal.
4. **Module 4: Unknown Token Handling (Fallback Strategies)**:
   - **Mode A: Character-Level Fallback**: Decomposes unknown words into individual characters, each assigned a stable, non-zero ID from a dedicated fallback character vocabulary (never assigning ID 0 to valid pieces).
   - **Mode B: Subword Tokenization (BPE-like)**: Demonstrates how modern LLMs (e.g. GPT-4, LLaMA, Gemini) decompose unseen compound words into prefix, stem, and suffix subword morphemes (e.g. `robot` + `##ics`).
5. **Module 5: Final Token Count & Transformation**:
   - Visual comparison: Raw Tokens $\rightarrow$ Fallback Expansion.
   - Large animated counter tracking the total resulting tokens fed into the context window.
   - Detailed metric breakdown: Original Words, Original Tokens, Known Tokens, Unknown Tokens, Fallback Pieces Created, Final Token Count.
6. **Module 6: Vector Embeddings (Spelling vs. Meaning)**:
   - **A. Spelling-Based Vectors**: Orthographic feature vector based on length, vowel ratio, character overlap with reference anchors (`cat`, `car`, `dog`), edit distance, and n-gram diversity.
   - **B. Meaning-Based Semantic Embeddings**: Precomputed multi-dimensional semantic feature dataset (Royalty, Fruit, Vehicle, Tech, Animal, Emotion) with full coordinate breakdowns.
   - Allows users to enter any custom word to dynamically compute and visualize its vector coordinates.
7. **Module 7: 2D & 3D Vector Space & Similarity Explorer**:
   - **3D Three.js Explorer**: Full interactive orbit controls (left drag to rotate, scroll to zoom, right drag to pan, node click to inspect).
   - Crisp floating canvas labels, glowing halos, 3D coordinate axes, reference ground grid, and dashed connection lines to top nearest neighbors with similarity score tags.
   - **2D Coordinate Plane**: Interactive Cartesian canvas plane.
   - **Mathematical Similarity Workbench**:
     - Cosine Similarity: $\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$
     - Angular Distance: $\theta^\circ = \arccos(\text{cosine})$
     - Dot Product: $\mathbf{u} \cdot \mathbf{v} = \sum u_i v_i$
     - Euclidean Distance: $d(\mathbf{u}, \mathbf{v}) = \sqrt{\sum (u_i - v_i)^2}$
8. **Module 8: Pipeline Summary & Session Export**:
   - Full end-to-end recap of the processed sentence.
   - Export session state as JSON for reporting or classroom grading.

---

## 🚀 Running the Project Locally

No build tools or server installation are required. You can run the application directly in any modern browser:

### Option 1: Direct File Open
Open `index.html` directly in Google Chrome, Firefox, Safari, or Microsoft Edge.

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 🛠️ Technology Stack

- **HTML5 & CSS3**: Modern dark-themed AI research dashboard theme, glassmorphism cards, responsive layouts.
- **Vanilla JavaScript (ES6+)**: Modular architecture (`state.js`, `tokenizer.js`, `embeddings.js`, `visualizer3d.js`, `visualizer2d.js`, `app.js`).
- **Three.js (r128)**: 3D scene, dynamic lighting, custom canvas sprite labels, raycasting, and orbit manipulation.
- **GSAP (3.12)**: Smooth animated counters and card transitions.
- **Canvas 2D API**: Interactive coordinate plane rendering.
