/**
 * State Management for LLM Pipeline Explorer
 * Central reactive store with pub/sub pattern for UI synchronization.
 */

class PipelineState {
  constructor() {
    this.listeners = new Map();

    // Initial default sentences as requested
    this.defaultSentences = [
      "I love learning about artificial intelligence.",
      "I am building an LLM pipeline explorer.",
      "Artificial intelligence is interesting."
    ];

    this.state = {
      currentStage: 1,
      completedStages: new Set([1]),
      sentences: [...this.defaultSentences],
      
      // Vocabulary
      // Array of { id: number, token: string, frequency: number, isSpecial: boolean }
      vocabulary: [],
      vocabMap: new Map(), // token -> { id, frequency }
      
      // Fallback character vocabulary (ID 0 reserved for [UNK])
      fallbackCharVocab: new Map(),
      
      // Tokenization
      selectedSentenceIndex: 0,
      customSentenceInput: "",
      activeSentenceToTokenize: "",
      tokenizationResult: null,
      
      // Fallback configuration
      fallbackMode: 'character', // 'character' | 'subword'
      
      // Embeddings
      embeddingMode: 'meaning', // 'meaning' | 'spelling'
      selectedVectorWord: 'artificial',
      comparisonWordA: 'king',
      comparisonWordB: 'queen',
      customEmbeddingInput: '',
      
      // Filters and views
      vocabSearchQuery: '',
      vocabSortBy: 'id', // 'id' | 'frequency' | 'token'
      vocabSortAsc: true,
      
      // 3D Visualizer settings
      visualizerSelectedCategory: 'all'
    };

    // Load from local storage if available
    this.loadState();
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Determine which keys changed
    const changedKeys = Object.keys(updates);
    changedKeys.forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => callback(this.state[key], oldState[key], this.state));
      }
    });

    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => callback(this.state, changedKeys));
    }

    this.saveState();
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  saveState() {
    try {
      const serializableState = {
        sentences: this.state.sentences,
        completedStages: Array.from(this.state.completedStages),
        currentStage: this.state.currentStage,
        fallbackMode: this.state.fallbackMode,
        embeddingMode: this.state.embeddingMode,
        selectedSentenceIndex: this.state.selectedSentenceIndex
      };
      sessionStorage.setItem('llm_explorer_state', JSON.stringify(serializableState));
    } catch (e) {
      console.warn('SessionStorage save failed:', e);
    }
  }

  loadState() {
    try {
      const saved = sessionStorage.getItem('llm_explorer_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sentences && Array.isArray(parsed.sentences) && parsed.sentences.length > 0) {
          this.state.sentences = parsed.sentences;
        }
        if (parsed.completedStages) {
          this.state.completedStages = new Set(parsed.completedStages);
        }
        if (parsed.currentStage) {
          this.state.currentStage = parsed.currentStage;
        }
        if (parsed.fallbackMode) {
          this.state.fallbackMode = parsed.fallbackMode;
        }
        if (parsed.embeddingMode) {
          this.state.embeddingMode = parsed.embeddingMode;
        }
        if (parsed.selectedSentenceIndex !== undefined) {
          this.state.selectedSentenceIndex = parsed.selectedSentenceIndex;
        }
      }
    } catch (e) {
      console.warn('SessionStorage load failed:', e);
    }
  }

  markStageComplete(stageNumber) {
    const completed = new Set(this.state.completedStages);
    completed.add(stageNumber);
    this.setState({ completedStages: completed });
  }

  resetToDefault() {
    sessionStorage.removeItem('llm_explorer_state');
    this.state.sentences = [...this.defaultSentences];
    this.state.completedStages = new Set([1]);
    this.state.currentStage = 1;
    this.state.selectedSentenceIndex = 0;
    this.state.vocabulary = [];
    this.state.tokenizationResult = null;
    this.saveState();
  }
}

// Global instance
window.pipelineState = new PipelineState();
