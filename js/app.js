/**
 * LLM Pipeline Explorer - Main Application Controller (5-Slide White & Blue Vertical Edition)
 * Manages UI interactions, smooth vertical slide transitions, IntersectionObserver tracking,
 * keyboard navigation, and data flow between state, tokenizer, and embeddings engines.
 */

document.addEventListener('DOMContentLoaded', () => {
  let visualizer3D = null;
  let visualizer2D = null;
  let currentActiveSlide = 1;

  const app = {
    init() {
      this.bindVerticalSlideNavigation();
      this.bindSentenceModule();
      this.bindVocabularyModule();
      this.bindTokenizationModule();
      this.bindEmbeddingModule();
      this.bindSimilarityExplorer();
      this.bindModalEvents();

      // Initial Pipeline Data Generation
      this.generateInitialPipeline();

      // Setup IntersectionObserver for auto-tracking active slide on scroll
      this.setupSlideScrollObserver();

      // Keyboard Up/Down navigation
      this.setupKeyboardNavigation();

      // Subscribe to state updates
      window.pipelineState.subscribe('sentences', () => this.updateSentenceStats());
    },

    // ==========================================
    // VERTICAL SLIDE NAVIGATION (5 SLIDES)
    // ==========================================
    bindVerticalSlideNavigation() {
      // Horizontal header stepper clicks
      document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', () => {
          const stage = parseInt(item.getAttribute('data-stage'), 10);
          this.scrollToSlide(stage);
        });
      });

      // Floating vertical dots on right edge
      document.querySelectorAll('.slide-nav-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const slide = parseInt(dot.getAttribute('data-slide'), 10);
          this.scrollToSlide(slide);
        });
      });

      // Slide "Next" buttons with data-next-slide
      document.querySelectorAll('[data-next-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = parseInt(btn.getAttribute('data-next-slide'), 10);
          this.scrollToSlide(target);
        });
      });

      // Slide "Prev" buttons with data-prev-slide
      document.querySelectorAll('[data-prev-slide]').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = parseInt(btn.getAttribute('data-prev-slide'), 10);
          this.scrollToSlide(target);
        });
      });

      // Floating Up/Down arrow buttons
      const btnPrevFloat = document.getElementById('btn-prev-slide-float');
      const btnNextFloat = document.getElementById('btn-next-slide-float');

      if (btnPrevFloat) {
        btnPrevFloat.addEventListener('click', () => {
          if (currentActiveSlide > 1) {
            this.scrollToSlide(currentActiveSlide - 1);
          }
        });
      }

      if (btnNextFloat) {
        btnNextFloat.addEventListener('click', () => {
          if (currentActiveSlide < 5) {
            this.scrollToSlide(currentActiveSlide + 1);
          }
        });
      }

      // Reset All button
      const resetBtn = document.getElementById('btn-reset-pipeline');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Reset entire pipeline session to defaults?')) {
            window.pipelineState.resetToDefault();
            this.generateInitialPipeline();
            this.scrollToSlide(1);
          }
        });
      }

      // Expose globally
      window.scrollToSlide = (num) => this.scrollToSlide(num);
    },

    scrollToSlide(slideNumber) {
      const slideEl = document.getElementById(`slide-${slideNumber}`);
      if (!slideEl) return;

      currentActiveSlide = slideNumber;
      window.pipelineState.markStageComplete(slideNumber);
      window.pipelineState.setState({ currentStage: slideNumber });

      // Smooth scroll into view
      slideEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      this.updateActiveSlideIndicators(slideNumber);

      // If entering visualizer slide, trigger size refresh
      if (slideNumber === 4 || slideNumber === 5) {
        setTimeout(() => {
          if (visualizer3D) {
            visualizer3D.onWindowResize();
            const currentWord = window.pipelineState.getState().selectedVectorWord || 'artificial';
            visualizer3D.highlightWord(currentWord);
          }
          if (visualizer2D) {
            visualizer2D.resize();
          }
        }, 120);
      }
    },

    updateActiveSlideIndicators(slideNumber) {
      currentActiveSlide = slideNumber;

      // Update Horizontal Header Stepper
      document.querySelectorAll('.step-item').forEach(item => {
        const itemStage = parseInt(item.getAttribute('data-stage'), 10);
        item.classList.remove('active');
        if (itemStage === slideNumber) {
          item.classList.add('active');
        }
        if (window.pipelineState.getState().completedStages.has(itemStage)) {
          item.classList.add('completed');
        }
      });

      // Update Vertical Floating Dots
      document.querySelectorAll('.slide-nav-dot').forEach(dot => {
        const dotSlide = parseInt(dot.getAttribute('data-slide'), 10);
        dot.classList.remove('active');
        if (dotSlide === slideNumber) {
          dot.classList.add('active');
        }
      });

      // Update Header Subtitle
      const stageTitles = [
        "1. Vocabulary Builder",
        "2. Tokenization",
        "3. Final Token Count",
        "4. Vector Embeddings",
        "5. 2D & 3D Vector Space & Similarity"
      ];
      const stageSub = document.getElementById('header-current-stage');
      if (stageSub) {
        stageSub.textContent = stageTitles[slideNumber - 1] || "LLM Pipeline";
      }
    },

    setupSlideScrollObserver() {
      const options = {
        root: null,
        rootMargin: '-20% 0px -50% 0px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const slideId = entry.target.id;
            const slideNum = parseInt(slideId.replace('slide-', ''), 10);
            if (slideNum && slideNum !== currentActiveSlide) {
              this.updateActiveSlideIndicators(slideNum);
              window.pipelineState.markStageComplete(slideNum);
              if (slideNum === 5) {
                if (visualizer3D) visualizer3D.onWindowResize();
                if (visualizer2D) visualizer2D.resize();
              }
            }
          }
        });
      }, options);

      document.querySelectorAll('.slide-section').forEach(section => {
        observer.observe(section);
      });
    },

    setupKeyboardNavigation() {
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
          return;
        }

        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
          e.preventDefault();
          if (currentActiveSlide < 5) {
            this.scrollToSlide(currentActiveSlide + 1);
          }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          if (currentActiveSlide > 1) {
            this.scrollToSlide(currentActiveSlide - 1);
          }
        }
      });
    },

    // ==========================================
    // INITIALIZATION & PIPELINE DATA
    // ==========================================
    generateInitialPipeline() {
      const state = window.pipelineState.getState();
      const { vocabList, vocabMap } = window.tokenizerEngine.buildVocabulary(state.sentences);
      window.pipelineState.setState({ vocabulary: vocabList, vocabMap });

      this.renderVocabularyTable();
      this.runTokenizeSentence(state.sentences[state.selectedSentenceIndex || 0]);

      setTimeout(() => {
        this.initVisualizers();
      }, 150);
    },

    initVisualizers() {
      const container3D = document.getElementById('threejs-canvas-container');
      if (container3D && !visualizer3D) {
        visualizer3D = new window.VectorVisualizer3D('threejs-canvas-container');
        visualizer3D.loadVectors('meaning', 'all');
      }

      const canvas2D = document.getElementById('canvas-2d-viewport');
      if (canvas2D && !visualizer2D) {
        visualizer2D = new window.VectorVisualizer2D('canvas-2d-viewport');
        visualizer2D.loadVectors('meaning', 'all');
      }

      window.on3DPointSelected = (word, data) => this.handlePointSelected(word, data);
      window.on2DPointSelected = (word, data) => this.handlePointSelected(word, data);

      this.updateVisualizerHUD('artificial');
    },

    // ==========================================
    // MODULE 1: SENTENCE INPUT
    // ==========================================
    bindSentenceModule() {
      const sentenceTextarea = document.getElementById('sentence-input-textarea');
      const addSentenceBtn = document.getElementById('btn-add-sentence');
      const clearSentencesBtn = document.getElementById('btn-clear-sentences');
      const restoreSentencesBtn = document.getElementById('btn-restore-sentences');
      const createVocabBtn = document.getElementById('btn-create-vocabulary');

      const state = window.pipelineState.getState();
      sentenceTextarea.value = state.sentences.join('\n');
      this.updateSentenceStats();

      sentenceTextarea.addEventListener('input', () => {
        const lines = sentenceTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
        window.pipelineState.setState({ sentences: lines });
        this.updateSentenceStats();
      });

      addSentenceBtn.addEventListener('click', () => {
        const sample = "Deep neural networks transform linguistic tokens into high-dimensional geometric representations.";
        sentenceTextarea.value = (sentenceTextarea.value.trim() + '\n' + sample).trim();
        const lines = sentenceTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
        window.pipelineState.setState({ sentences: lines });
        this.updateSentenceStats();
      });

      clearSentencesBtn.addEventListener('click', () => {
        sentenceTextarea.value = "";
        window.pipelineState.setState({ sentences: [] });
        this.updateSentenceStats();
      });

      restoreSentencesBtn.addEventListener('click', () => {
        const defs = window.pipelineState.defaultSentences;
        sentenceTextarea.value = defs.join('\n');
        window.pipelineState.setState({ sentences: [...defs] });
        this.updateSentenceStats();
      });

      createVocabBtn.addEventListener('click', () => {
        const lines = sentenceTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          alert('Please enter at least one sentence.');
          return;
        }

        window.pipelineState.setState({ sentences: lines });
        const { vocabList, vocabMap } = window.tokenizerEngine.buildVocabulary(lines);
        window.pipelineState.setState({ vocabulary: vocabList, vocabMap });

        this.renderVocabularyTable();
        this.updateSentenceSelectorDropdown();

        const curIdx = window.pipelineState.getState().selectedSentenceIndex;
        this.runTokenizeSentence(lines[curIdx] || lines[0]);

        if (window.gsap) {
          gsap.from('#vocab-card', {
            scale: 0.98,
            duration: 0.4,
            borderColor: '#2563eb',
            boxShadow: '0 0 25px rgba(37, 99, 235, 0.3)',
            ease: 'power2.out'
          });
        }

        this.showToast('Vocabulary successfully created!');
      });
    },

    updateSentenceStats() {
      const state = window.pipelineState.getState();
      const sentences = state.sentences;
      const totalSentences = sentences.length;

      let totalWords = 0;
      let totalChars = 0;

      sentences.forEach(s => {
        totalWords += s.trim().split(/\s+/).filter(Boolean).length;
        totalChars += s.length;
      });

      document.getElementById('stat-total-sentences').textContent = totalSentences;
      document.getElementById('stat-total-words').textContent = totalWords;
      document.getElementById('stat-total-chars').textContent = totalChars;
    },

    // ==========================================
    // MODULE 2: VOCABULARY BUILDER
    // ==========================================
    bindVocabularyModule() {
      const searchInput = document.getElementById('vocab-search-input');
      const sortIdBtn = document.getElementById('sort-vocab-id');
      const sortFreqBtn = document.getElementById('sort-vocab-freq');
      const sortTokenBtn = document.getElementById('sort-vocab-token');
      const downloadJsonBtn = document.getElementById('btn-download-vocab-json');
      const downloadCsvBtn = document.getElementById('btn-download-vocab-csv');

      searchInput.addEventListener('input', (e) => {
        window.pipelineState.setState({ vocabSearchQuery: e.target.value.toLowerCase().trim() });
        this.renderVocabularyTable();
      });

      sortIdBtn.addEventListener('click', () => {
        const state = window.pipelineState.getState();
        const asc = state.vocabSortBy === 'id' ? !state.vocabSortAsc : true;
        window.pipelineState.setState({ vocabSortBy: 'id', vocabSortAsc: asc });
        this.renderVocabularyTable();
      });

      sortFreqBtn.addEventListener('click', () => {
        const state = window.pipelineState.getState();
        const asc = state.vocabSortBy === 'freq' ? !state.vocabSortAsc : false;
        window.pipelineState.setState({ vocabSortBy: 'freq', vocabSortAsc: asc });
        this.renderVocabularyTable();
      });

      sortTokenBtn.addEventListener('click', () => {
        const state = window.pipelineState.getState();
        const asc = state.vocabSortBy === 'token' ? !state.vocabSortAsc : true;
        window.pipelineState.setState({ vocabSortBy: 'token', vocabSortAsc: asc });
        this.renderVocabularyTable();
      });

      downloadJsonBtn.addEventListener('click', () => this.downloadVocabulary('json'));
      downloadCsvBtn.addEventListener('click', () => this.downloadVocabulary('csv'));
    },

    renderVocabularyTable() {
      const state = window.pipelineState.getState();
      const tbody = document.getElementById('vocab-table-body');
      const vocabSizeEl = document.getElementById('vocab-size-badge');

      if (!tbody) return;
      tbody.innerHTML = '';

      let list = [...(state.vocabulary || [])];
      vocabSizeEl.textContent = `${list.length} tokens`;

      if (state.vocabSearchQuery) {
        list = list.filter(item => item.token.toLowerCase().includes(state.vocabSearchQuery));
      }

      list.sort((a, b) => {
        if (state.vocabSortBy === 'id') {
          return state.vocabSortAsc ? a.id - b.id : b.id - a.id;
        } else if (state.vocabSortBy === 'freq') {
          return state.vocabSortAsc ? a.frequency - b.frequency : b.frequency - a.frequency;
        } else {
          return state.vocabSortAsc ? a.token.localeCompare(b.token) : b.token.localeCompare(a.token);
        }
      });

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-slate-400 py-4">No tokens match your search.</td></tr>`;
        return;
      }

      list.forEach(item => {
        const tr = document.createElement('tr');
        const isSpecial = item.isSpecial || item.id === 0;

        tr.innerHTML = `
          <td class="font-mono font-bold ${isSpecial ? 'text-amber-600' : 'text-blue-600'}">${item.id}</td>
          <td>
            <span class="inline-flex items-center gap-1.5 font-mono px-2 py-0.5 rounded ${isSpecial ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}">
              ${this.escapeHtml(item.token)}
            </span>
          </td>
          <td class="font-mono font-semibold text-slate-700">${item.frequency}</td>
          <td>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${isSpecial ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
              ${isSpecial ? 'Reserved Marker' : 'Standard Token'}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    },

    downloadVocabulary(format) {
      const vocab = window.pipelineState.getState().vocabulary || [];
      if (vocab.length === 0) {
        alert('Vocabulary is empty.');
        return;
      }

      let content = '';
      let filename = `vocabulary.${format}`;
      let mimeType = '';

      if (format === 'json') {
        content = JSON.stringify(vocab, null, 2);
        mimeType = 'application/json';
      } else {
        content = 'ID,Token,Frequency,IsSpecial\n' + vocab.map(i => `${i.id},"${i.token.replace(/"/g, '""')}",${i.frequency},${i.isSpecial}`).join('\n');
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    // ==========================================
    // MODULE 3: TOKENIZATION
    // ==========================================
    bindTokenizationModule() {
      const dropdown = document.getElementById('tokenize-sentence-select');
      const customInput = document.getElementById('tokenize-custom-input');
      const tokenizeBtn = document.getElementById('btn-run-tokenization');

      this.updateSentenceSelectorDropdown();

      dropdown.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
          const idx = parseInt(val, 10);
          const s = window.pipelineState.getState().sentences[idx];
          if (s) {
            this.runTokenizeSentence(s);
          }
        }
      });

      tokenizeBtn.addEventListener('click', () => {
        const mode = dropdown.value;
        let sentence = "";
        if (mode === 'custom') {
          sentence = customInput.value.trim();
        } else {
          const idx = parseInt(mode, 10);
          sentence = window.pipelineState.getState().sentences[idx] || "";
        }

        if (!sentence) {
          alert('Please enter or select a sentence to tokenize.');
          return;
        }

        this.runTokenizeSentence(sentence);
        this.showToast('Sentence tokenized successfully!');
      });
    },

    updateSentenceSelectorDropdown() {
      const dropdown = document.getElementById('tokenize-sentence-select');
      if (!dropdown) return;

      const sentences = window.pipelineState.getState().sentences || [];
      dropdown.innerHTML = '';

      sentences.forEach((s, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.textContent = `Sentence ${idx + 1}: "${s.length > 50 ? s.substring(0, 50) + '...' : s}"`;
        dropdown.appendChild(opt);
      });

      const customOpt = document.createElement('option');
      customOpt.value = 'custom';
      customOpt.textContent = '✏️ Enter New Custom Sentence...';
      dropdown.appendChild(customOpt);
    },

    runTokenizeSentence(sentence) {
      const state = window.pipelineState.getState();
      const result = window.tokenizerEngine.tokenizeSentence(
        sentence,
        state.vocabMap,
        state.fallbackMode || 'character'
      );

      window.pipelineState.setState({
        activeSentenceToTokenize: sentence,
        tokenizationResult: result
      });

      this.renderTokenizationUI(result);
      this.renderTokenCountUI(result);
    },

    renderTokenizationUI(result) {
      if (!result) return;

      document.getElementById('tokenized-sentence-raw-preview').textContent = `"${result.sentence}"`;

      const chipRow = document.getElementById('token-pills-row');
      chipRow.innerHTML = '';

      const sequenceBox = document.getElementById('token-id-sequence-box');
      sequenceBox.textContent = `[ ${result.tokenDetails.map(t => t.id).join(', ')} ]`;

      result.tokenDetails.forEach((item) => {
        const isUnknown = item.status === 'Unknown';
        const pill = document.createElement('div');
        pill.className = `token-pill ${isUnknown ? 'token-pill-unknown' : 'token-pill-known'}`;
        pill.innerHTML = `
          <span>${this.escapeHtml(item.token)}</span>
          <span class="token-id-badge">ID: ${item.id}</span>
        `;

        pill.addEventListener('click', () => {
          this.openTokenModal(item);
        });

        chipRow.appendChild(pill);
      });

      const tbody = document.getElementById('tokenization-table-body');
      tbody.innerHTML = '';

      result.tokenDetails.forEach((item) => {
        const isUnknown = item.status === 'Unknown';
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td class="font-mono text-slate-500">${item.position}</td>
          <td class="font-mono font-bold ${isUnknown ? 'text-rose-600' : 'text-blue-700'}">${this.escapeHtml(item.token)}</td>
          <td class="font-mono font-bold ${isUnknown ? 'text-rose-600' : 'text-slate-900'}">${item.id}</td>
          <td>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${isUnknown ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
              ${item.status}
            </span>
          </td>
        `;
        tr.addEventListener('click', () => this.openTokenModal(item));
        tbody.appendChild(tr);
      });
    },

    openTokenModal(item) {
      const modal = document.getElementById('token-modal');
      const title = document.getElementById('modal-token-title');
      const details = document.getElementById('modal-token-details');

      title.textContent = `Token: "${item.token}"`;
      details.innerHTML = `
        <div class="space-y-3">
          <div class="flex justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
            <span class="text-slate-600 text-sm font-medium">Vocabulary Token ID</span>
            <span class="font-mono font-bold ${item.id === 0 ? 'text-rose-600' : 'text-blue-600'}">${item.id}</span>
          </div>
          <div class="flex justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
            <span class="text-slate-600 text-sm font-medium">Status</span>
            <span class="font-bold ${item.status === 'Known' ? 'text-emerald-600' : 'text-rose-600'}">${item.status}</span>
          </div>
          <div class="flex justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
            <span class="text-slate-600 text-sm font-medium">Corpus Frequency</span>
            <span class="font-mono text-slate-800 font-semibold">${item.frequency} appearance(s)</span>
          </div>
          <div class="flex justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
            <span class="text-slate-600 text-sm font-medium">Position in Sentence</span>
            <span class="font-mono text-slate-800 font-semibold">${item.position}</span>
          </div>
          <div class="text-xs text-slate-600 mt-2 p-3 bg-blue-50/70 border border-blue-100 rounded-md leading-relaxed">
            ${item.id === 0 ? '⚠️ This word is not present in the generated vocabulary and receives the unknown token ID 0.' : '✅ This word was found in the vocabulary and maps directly to its assigned embedding vector.'}
          </div>
        </div>
      `;
      modal.classList.add('active');
    },

    // ==========================================
    // MODULE 4: TOKEN COUNT
    // ==========================================
    renderTokenCountUI(result) {
      if (!result) return;
      const stats = result.stats;

      const counterEl = document.getElementById('final-token-counter-val');
      if (window.gsap) {
        gsap.to(counterEl, {
          innerText: stats.finalTokenCount,
          duration: 0.6,
          snap: { innerText: 1 },
          ease: 'power2.out'
        });
      } else {
        counterEl.textContent = stats.finalTokenCount;
      }

      document.getElementById('count-original-words').textContent = stats.originalWordCount;
      document.getElementById('count-original-tokens').textContent = stats.originalTokenCount;
      document.getElementById('count-known-tokens').textContent = stats.knownTokenCount;
      document.getElementById('count-unknown-tokens').textContent = stats.unknownTokenCount;
      document.getElementById('count-fallback-pieces').textContent = stats.fallbackPiecesCount;
      document.getElementById('count-final-tokens').textContent = stats.finalTokenCount;

      const origSeqEl = document.getElementById('transform-original-tokens');
      const finalSeqEl = document.getElementById('transform-final-tokens');

      origSeqEl.innerHTML = result.rawTokens.map(t => {
        return `<span class="px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-semibold">${this.escapeHtml(t)}</span>`;
      }).join(' ');

      finalSeqEl.innerHTML = result.expandedSequence.map(item => {
        const isFallback = item.isUnknownFallback;
        return `<span class="px-2.5 py-1 rounded ${isFallback ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'bg-blue-50 text-blue-800 border border-blue-200'} font-mono text-xs font-semibold">${this.escapeHtml(item.piece)}</span>`;
      }).join(' ');
    },

    // ==========================================
    // MODULE 5: VECTOR EMBEDDINGS
    // ==========================================
    bindEmbeddingModule() {
      const modeSpellingBtn = document.getElementById('btn-emb-spelling');
      const modeMeaningBtn = document.getElementById('btn-emb-meaning');
      const wordSelect = document.getElementById('emb-word-select');
      const customWordInput = document.getElementById('emb-custom-word-input');
      const testCustomWordBtn = document.getElementById('btn-test-custom-word');

      modeMeaningBtn.addEventListener('click', () => {
        modeMeaningBtn.classList.add('btn-primary');
        modeMeaningBtn.classList.remove('btn-secondary');
        modeSpellingBtn.classList.remove('btn-primary');
        modeSpellingBtn.classList.add('btn-secondary');

        window.pipelineState.setState({ embeddingMode: 'meaning' });
        this.updateEmbeddingWordsDropdown('meaning');
        this.renderEmbeddingDetails(wordSelect.value || 'artificial', 'meaning');

        if (visualizer3D) visualizer3D.loadVectors('meaning');
        if (visualizer2D) visualizer2D.loadVectors('meaning');
      });

      modeSpellingBtn.addEventListener('click', () => {
        modeSpellingBtn.classList.add('btn-primary');
        modeSpellingBtn.classList.remove('btn-secondary');
        modeMeaningBtn.classList.remove('btn-primary');
        modeMeaningBtn.classList.add('btn-secondary');

        window.pipelineState.setState({ embeddingMode: 'spelling' });
        this.updateEmbeddingWordsDropdown('spelling');
        this.renderEmbeddingDetails(wordSelect.value || 'cat', 'spelling');

        if (visualizer3D) visualizer3D.loadVectors('spelling');
        if (visualizer2D) visualizer2D.loadVectors('spelling');
      });

      wordSelect.addEventListener('change', (e) => {
        const mode = window.pipelineState.getState().embeddingMode || 'meaning';
        this.renderEmbeddingDetails(e.target.value, mode);
        if (visualizer3D) visualizer3D.highlightWord(e.target.value);
        if (visualizer2D) {
          visualizer2D.selectedWord = e.target.value;
          visualizer2D.render();
        }
      });

      testCustomWordBtn.addEventListener('click', () => {
        const word = customWordInput.value.trim().toLowerCase();
        if (!word) return;
        window.pipelineState.setState({ customEmbeddingInput: word });

        const mode = window.pipelineState.getState().embeddingMode || 'meaning';
        this.renderEmbeddingDetails(word, mode);

        if (visualizer3D) {
          visualizer3D.loadVectors(mode);
          visualizer3D.highlightWord(word);
        }
        if (visualizer2D) {
          visualizer2D.loadVectors(mode);
          visualizer2D.selectedWord = word;
          visualizer2D.render();
        }
        this.showToast(`Vector computed for "${word}"!`);
      });

      this.updateEmbeddingWordsDropdown('meaning');
      this.renderEmbeddingDetails('artificial', 'meaning');
    },

    updateEmbeddingWordsDropdown(mode) {
      const select = document.getElementById('emb-word-select');
      select.innerHTML = '';

      let words = [];
      if (mode === 'meaning') {
        words = Object.keys(window.embeddingsEngine.getMeaningDataset());
      } else {
        words = window.embeddingsEngine.spellingAnchors;
      }

      words.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        select.appendChild(opt);
      });
    },

    renderEmbeddingDetails(word, mode) {
      const target = mode === 'meaning'
        ? window.embeddingsEngine.getMeaningVector(word)
        : window.embeddingsEngine.getSpellingVector(word);

      if (!target) return;

      document.getElementById('emb-current-word').textContent = target.word;
      document.getElementById('emb-current-category').textContent = target.category || 'General';
      document.getElementById('emb-coord-x').textContent = target.pos3d[0];
      document.getElementById('emb-coord-y').textContent = target.pos3d[1];
      document.getElementById('emb-coord-z').textContent = target.pos3d[2];

      const tbody = document.getElementById('emb-dimensions-table-body');
      tbody.innerHTML = '';

      const dimLabels = mode === 'meaning'
        ? window.embeddingsEngine.semanticDimensions
        : [
            "Length (norm)", "Vowel Ratio", "Initial Consonant", "Cat Overlap",
            "Car Overlap", "Dog Overlap", "Edit Sim (Cat)", "Bigram Diversity"
          ];

      target.vector.forEach((val, idx) => {
        const tr = document.createElement('tr');
        const pct = Math.min(100, Math.max(0, (val + 1) * 50));
        tr.innerHTML = `
          <td class="font-mono text-slate-500 font-semibold">Dim ${idx + 1}</td>
          <td class="font-bold text-slate-800">${dimLabels[idx] || `Feature ${idx + 1}`}</td>
          <td class="font-mono text-blue-600 font-bold">${val.toFixed(3)}</td>
          <td>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
              <div class="h-2.5 rounded-full" style="width: ${pct}%; background: ${target.color || '#2563eb'}"></div>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });

      this.updateVisualizerHUD(target.word, target);
    },

    // ==========================================
    // MODULE 6: 2D/3D VISUALIZER & SIMILARITY
    // ==========================================
    bindSimilarityExplorer() {
      const view3DBtn = document.getElementById('btn-view-3d');
      const view2DBtn = document.getElementById('btn-view-2d');
      const container3D = document.getElementById('vis-3d-wrap');
      const container2D = document.getElementById('vis-2d-wrap');

      view3DBtn.addEventListener('click', () => {
        view3DBtn.classList.add('btn-primary');
        view3DBtn.classList.remove('btn-secondary');
        view2DBtn.classList.remove('btn-primary');
        view2DBtn.classList.add('btn-secondary');
        container3D.style.display = 'block';
        container2D.style.display = 'none';
        if (visualizer3D) visualizer3D.onWindowResize();
      });

      view2DBtn.addEventListener('click', () => {
        view2DBtn.classList.add('btn-primary');
        view2DBtn.classList.remove('btn-secondary');
        view3DBtn.classList.remove('btn-primary');
        view3DBtn.classList.add('btn-secondary');
        container3D.style.display = 'none';
        container2D.style.display = 'block';
        if (visualizer2D) visualizer2D.resize();
      });

      const resetCamBtn = document.getElementById('btn-reset-camera');
      if (resetCamBtn) {
        resetCamBtn.addEventListener('click', () => {
          if (visualizer3D) visualizer3D.resetCamera();
          if (visualizer2D) visualizer2D.resetView();
        });
      }

      document.querySelectorAll('.btn-category-filter').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-category-filter').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.getAttribute('data-category');
          const mode = window.pipelineState.getState().embeddingMode || 'meaning';
          if (visualizer3D) visualizer3D.loadVectors(mode, cat);
          if (visualizer2D) visualizer2D.loadVectors(mode, cat);
        });
      });

      const selectWordA = document.getElementById('sim-word-a-select');
      const selectWordB = document.getElementById('sim-word-b-select');
      const calcSimBtn = document.getElementById('btn-calculate-similarity');

      this.populateSimilarityDropdowns();

      calcSimBtn.addEventListener('click', () => {
        const w1 = selectWordA.value;
        const w2 = selectWordB.value;
        this.runSimilarityComparison(w1, w2);
      });

      this.runSimilarityComparison('king', 'queen');
    },

    populateSimilarityDropdowns() {
      const s1 = document.getElementById('sim-word-a-select');
      const s2 = document.getElementById('sim-word-b-select');
      s1.innerHTML = '';
      s2.innerHTML = '';

      const words = Object.keys(window.embeddingsEngine.getMeaningDataset());
      words.forEach(w => {
        const o1 = document.createElement('option');
        o1.value = w;
        o1.textContent = w;
        if (w === 'king') o1.selected = true;
        s1.appendChild(o1);

        const o2 = document.createElement('option');
        o2.value = w;
        o2.textContent = w;
        if (w === 'queen') o2.selected = true;
        s2.appendChild(o2);
      });
    },

    runSimilarityComparison(wordA, wordB) {
      const mode = window.pipelineState.getState().embeddingMode || 'meaning';
      const objA = mode === 'meaning' ? window.embeddingsEngine.getMeaningVector(wordA) : window.embeddingsEngine.getSpellingVector(wordA);
      const objB = mode === 'meaning' ? window.embeddingsEngine.getMeaningVector(wordB) : window.embeddingsEngine.getSpellingVector(wordB);

      if (!objA || !objB) return;

      const dot = window.embeddingsEngine.dotProduct(objA.vector, objB.vector);
      const magA = window.embeddingsEngine.vectorMagnitude(objA.vector);
      const magB = window.embeddingsEngine.vectorMagnitude(objB.vector);
      const cosSim = window.embeddingsEngine.cosineSimilarity(objA.vector, objB.vector);
      const eucDist = window.embeddingsEngine.euclideanDistance(objA.vector, objB.vector);
      const angle = window.embeddingsEngine.vectorAngleDegrees(cosSim);

      document.getElementById('sim-calc-word-a').textContent = wordA;
      document.getElementById('sim-calc-word-b').textContent = wordB;
      document.getElementById('sim-val-cosine').textContent = cosSim.toFixed(4);
      document.getElementById('sim-val-angle').textContent = `${angle}°`;
      document.getElementById('sim-val-dot').textContent = dot.toFixed(4);
      document.getElementById('sim-val-mag-a').textContent = magA.toFixed(4);
      document.getElementById('sim-val-mag-b').textContent = magB.toFixed(4);
      document.getElementById('sim-val-euclidean').textContent = eucDist.toFixed(4);

      const bar = document.getElementById('sim-progress-bar');
      const pct = Math.max(0, Math.min(100, cosSim * 100));
      bar.style.width = `${pct}%`;

      if (visualizer3D) {
        visualizer3D.highlightWord(wordA);
      }
    },

    handlePointSelected(word, data) {
      this.updateVisualizerHUD(word, data);
      this.showToast(`Selected word: "${word}"`);
    },

    updateVisualizerHUD(word, optionalData) {
      const hudEl = document.getElementById('vis-hud-card');
      if (!hudEl) return;

      const mode = window.pipelineState.getState().embeddingMode || 'meaning';
      const data = optionalData || (mode === 'meaning' ? window.embeddingsEngine.getMeaningVector(word) : window.embeddingsEngine.getSpellingVector(word));

      if (!data) return;

      document.getElementById('hud-word-title').textContent = data.word;
      document.getElementById('hud-word-category').textContent = data.category || 'General';
      document.getElementById('hud-coord-x').textContent = data.pos3d[0];
      document.getElementById('hud-coord-y').textContent = data.pos3d[1];
      document.getElementById('hud-coord-z').textContent = data.pos3d[2];

      const neighbors = window.embeddingsEngine.findNearestNeighbors(word, mode, 3);
      const listEl = document.getElementById('hud-neighbors-list');
      listEl.innerHTML = '';

      neighbors.forEach(n => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between py-1 border-b border-slate-100 text-xs';
        item.innerHTML = `
          <span class="font-mono font-bold text-slate-800">${n.word}</span>
          <span class="text-blue-600 font-mono font-semibold">cos: ${n.cosineSimilarity.toFixed(3)}</span>
        `;
        listEl.appendChild(item);
      });
    },

    // ==========================================
    // MODALS & TOAST UTILITIES
    // ==========================================
    bindModalEvents() {
      const modal = document.getElementById('token-modal');
      const closeBtn = document.getElementById('btn-close-modal');

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('active');
        });
      }
    },

    showToast(message) {
      let toast = document.getElementById('app-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `
          position: fixed;
          bottom: 2rem;
          left: 2rem;
          background: #ffffff;
          border: 1px solid #bfdbfe;
          color: #0f172a;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.15);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          transform: translateY(10px);
        `;
        document.body.appendChild(toast);
      }

      toast.innerHTML = `<span style="color:#2563eb">✓</span> ${message}`;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 3000);
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  app.init();
});
