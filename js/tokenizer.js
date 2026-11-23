/**
 * Tokenizer & Vocabulary Builder Engine
 * Handles token extraction, ID assignment, unknown token detection,
 * character-level fallback, and subword fallback tokenization.
 */

class TokenizerEngine {
  constructor() {
    // Separate fallback vocabulary for characters (1-based to avoid 0 which is [UNK])
    this.fallbackCharVocab = new Map();
    this.initFallbackCharVocab();

    // Educational subword vocabulary dictionary for Mode 2
    this.commonSubwords = [
      "un", "re", "in", "dis", "pre", "anti", "auto", "inter",
      "ing", "ed", "tion", "sion", "ment", "ness", "ity", "able", "ible", "al", "ic", "ive", "ous", "ful", "less", "ly", "er", "est",
      "learn", "build", "artific", "intel", "lig", "ence", "robot", "ics", "model", "vector", "embed", "deep", "neural", "explore", "pipe", "line"
    ];
  }

  /**
   * Initializes a fixed fallback character vocabulary so characters get stable non-zero IDs
   */
  initFallbackCharVocab() {
    this.fallbackCharVocab.clear();
    // Standard ASCII printable characters + common unicode punctuation
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?;:'\"-()[]{}@#$%^&*+=<>~`/\\| \n";
    let id = 100; // Start at 100 to visually distinguish character fallback IDs from primary word token IDs
    for (const ch of chars) {
      if (!this.fallbackCharVocab.has(ch)) {
        this.fallbackCharVocab.set(ch, id++);
      }
    }
  }

  getCharFallbackId(char) {
    if (this.fallbackCharVocab.has(char)) {
      return this.fallbackCharVocab.get(char);
    }
    // Dynamic assignment for unseen symbols
    const newId = 100 + this.fallbackCharVocab.size;
    this.fallbackCharVocab.set(char, newId);
    return newId;
  }

  /**
   * Tokenizes raw text into words and punctuation tokens preserving punctuation.
   * e.g., "Hello, world!" -> ["Hello", ",", "world", "!"]
   */
  extractTokens(text) {
    if (!text || typeof text !== 'string') return [];
    
    // Regex matching sequences of alphanumeric/hyphen words, or individual punctuation marks, ignoring empty spaces
    // Supports standard unicode letters and punctuation
    const tokenRegex = /[\w'-]+|[^\s\w]/g;
    const tokens = [];
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      const token = match[0].trim();
      if (token.length > 0) {
        tokens.push(token);
      }
    }

    return tokens;
  }

  /**
   * Builds the vocabulary from an array of sentences.
   * Rule:
   * 1. Extract unique tokens.
   * 2. Reserve ID 0 for [UNK].
   * 3. Assign IDs starting from 1 in order of first appearance.
   * 4. Count frequency of every token.
   * 5. Repeated tokens reuse the same ID.
   */
  buildVocabulary(sentences) {
    const vocabList = [
      { id: 0, token: "[UNK]", frequency: 0, isSpecial: true, description: "Unknown token marker reserved for unseen words" }
    ];
    const vocabMap = new Map();
    vocabMap.set("[UNK]", { id: 0, frequency: 0, isSpecial: true });

    let currentId = 1;

    sentences.forEach((sentence) => {
      const tokens = this.extractTokens(sentence);
      tokens.forEach((token) => {
        if (vocabMap.has(token)) {
          const entry = vocabMap.get(token);
          entry.frequency += 1;
        } else {
          const entry = {
            id: currentId++,
            token: token,
            frequency: 1,
            isSpecial: false
          };
          vocabMap.set(token, entry);
          vocabList.push(entry);
        }
      });
    });

    return { vocabList, vocabMap };
  }

  /**
   * Tokenizes a specific sentence against the vocabulary
   */
  tokenizeSentence(sentence, vocabMap, fallbackMode = 'character') {
    const rawTokens = this.extractTokens(sentence);
    const tokenDetails = [];
    const unknownTokens = [];

    rawTokens.forEach((token, index) => {
      const position = index + 1;
      if (vocabMap.has(token) && token !== "[UNK]") {
        const item = vocabMap.get(token);
        tokenDetails.push({
          position,
          token,
          id: item.id,
          frequency: item.frequency,
          status: 'Known'
        });
      } else {
        tokenDetails.push({
          position,
          token,
          id: 0,
          frequency: 0,
          status: 'Unknown'
        });
        unknownTokens.push({
          position,
          token
        });
      }
    });

    // Generate fallback expansion
    const fallbackExpansions = [];
    const expandedSequence = [];

    let totalFallbackPieces = 0;

    tokenDetails.forEach((item) => {
      if (item.status === 'Known') {
        expandedSequence.push({
          piece: item.token,
          id: item.id,
          type: 'original',
          isUnknownFallback: false
        });
      } else {
        // Unknown token fallback
        if (fallbackMode === 'character') {
          const chars = Array.from(item.token);
          const charPieces = chars.map((ch) => {
            const charId = this.getCharFallbackId(ch);
            return {
              char: ch,
              id: charId
            };
          });

          fallbackExpansions.push({
            originalToken: item.token,
            originalId: 0,
            position: item.position,
            mode: 'character',
            pieces: charPieces,
            count: charPieces.length
          });

          totalFallbackPieces += charPieces.length;

          charPieces.forEach((p) => {
            expandedSequence.push({
              piece: p.char,
              id: p.id,
              type: 'char-fallback',
              isUnknownFallback: true,
              parentToken: item.token
            });
          });
        } else {
          // Subword fallback mode
          const subwordPieces = this.decomposeSubwords(item.token);
          
          fallbackExpansions.push({
            originalToken: item.token,
            originalId: 0,
            position: item.position,
            mode: 'subword',
            pieces: subwordPieces,
            count: subwordPieces.length
          });

          totalFallbackPieces += subwordPieces.length;

          subwordPieces.forEach((p) => {
            expandedSequence.push({
              piece: p.piece,
              id: p.id,
              type: 'subword-fallback',
              isUnknownFallback: true,
              parentToken: item.token
            });
          });
        }
      }
    });

    // Word count calculation
    const words = sentence.trim().split(/\s+/).filter(Boolean);

    const stats = {
      originalWordCount: words.length,
      originalTokenCount: rawTokens.length,
      knownTokenCount: tokenDetails.filter(t => t.status === 'Known').length,
      unknownTokenCount: unknownTokens.length,
      fallbackPiecesCount: totalFallbackPieces,
      finalTokenCount: expandedSequence.length
    };

    return {
      sentence,
      rawTokens,
      tokenDetails,
      unknownTokens,
      fallbackExpansions,
      expandedSequence,
      stats
    };
  }

  /**
   * Educational subword tokenizer: greedy longest-match algorithm
   * Breaks word into common affixes and root chunks
   */
  decomposeSubwords(word) {
    const pieces = [];
    let remaining = word.toLowerCase();
    let currentIdOffset = 500; // Subwords get 500+ IDs

    // Prefix checking
    for (const prefix of ["un", "re", "in", "dis", "pre", "anti", "auto", "inter"]) {
      if (remaining.startsWith(prefix) && remaining.length > prefix.length + 1) {
        pieces.push({
          piece: prefix + "##",
          id: currentIdOffset++,
          isAffix: true,
          explanation: "Prefix morpheme"
        });
        remaining = remaining.substring(prefix.length);
        break;
      }
    }

    // Suffix checking
    let matchedSuffix = null;
    for (const suffix of ["tion", "sion", "ment", "ness", "ity", "able", "ible", "ing", "ed", "al", "ic", "ive", "ous", "ful", "less", "ly", "er", "est", "ics"]) {
      if (remaining.endsWith(suffix) && remaining.length > suffix.length) {
        matchedSuffix = {
          piece: "##" + suffix,
          id: currentIdOffset + 50,
          isAffix: true,
          explanation: "Suffix morpheme"
        };
        remaining = remaining.substring(0, remaining.length - suffix.length);
        break;
      }
    }

    // Check stem or break stem into chunks
    if (remaining.length > 0) {
      // If stem is 4 chars or less, keep whole; otherwise split into syllable-sized n-grams
      if (remaining.length <= 4) {
        pieces.push({
          piece: remaining,
          id: currentIdOffset + 10,
          isAffix: false,
          explanation: "Stem / root unit"
        });
      } else {
        const mid = Math.ceil(remaining.length / 2);
        const part1 = remaining.slice(0, mid);
        const part2 = remaining.slice(mid);
        pieces.push({
          piece: part1,
          id: currentIdOffset + 11,
          isAffix: false,
          explanation: "Stem subword part 1"
        });
        pieces.push({
          piece: "##" + part2,
          id: currentIdOffset + 12,
          isAffix: false,
          explanation: "Stem subword part 2"
        });
      }
    }

    if (matchedSuffix) {
      pieces.push(matchedSuffix);
    }

    return pieces;
  }
}

// Global instance
window.tokenizerEngine = new TokenizerEngine();
