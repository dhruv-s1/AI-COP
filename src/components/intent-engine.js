/**
 * Client-Side Smart Retrieval & Intent Classifier Engine
 * Zero LLMs, Zero External APIs, 100% Local In-Browser Execution.
 * 
 * Features:
 * - Text Preprocessing & Stop-word Filtering
 * - Synonym Expansion Dictionary
 * - Levenshtein Distance Typo Tolerance (Fuzzy Match)
 * - BM25 / TF-IDF Vector Keyword Relevance Scoring
 * - Short-Term Conversation Context Memory
 * - Strict Confidence Thresholding (High / Medium / Low)
 */

import faqData from '../data/faq-data.json';

const STOP_WORDS = new Set(faqData.stopWords || []);
const SYNONYMS = faqData.synonyms || {};
const INTENTS = faqData.intents || [];

// Fast Levenshtein Edit Distance algorithm for typo tolerance
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

class IntentEngine {
  constructor() {
    this.intents = INTENTS;
    this.contextMemory = {
      lastIntentId: null,
      lastTopic: null
    };
    this.tokenIDF = {};
    this.buildIDF();
  }

  // Preprocess text: lowercase, strip punctuation, filter stop words
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text.toLowerCase().replace(/[^\w\s]/gi, ' ');
    return cleaned.split(/\s+/).filter(t => t.length > 0 && !STOP_WORDS.has(t));
  }

  // Expand tokens using synonym dictionary
  expandTokenSynonyms(token) {
    const set = new Set([token]);
    for (const [canonical, list] of Object.entries(SYNONYMS)) {
      if (canonical === token || list.includes(token)) {
        set.add(canonical);
        list.forEach(s => set.add(s));
      }
    }
    return Array.from(set);
  }

  // Build Inverse Document Frequency (IDF) weights across intent corpus
  buildIDF() {
    const totalDocs = this.intents.length;
    const docFreq = {};

    this.intents.forEach(intent => {
      const intentTokens = new Set();
      intent.patterns.forEach(p => {
        this.tokenize(p).forEach(t => intentTokens.add(t));
      });
      intentTokens.forEach(t => {
        docFreq[t] = (docFreq[t] || 0) + 1;
      });
    });

    for (const [token, freq] of Object.entries(docFreq)) {
      this.tokenIDF[token] = Math.log(1 + (totalDocs / (freq + 1)));
    }
  }

  // Compute fuzzy match score between user token and target token (typo tolerance)
  fuzzyMatchRatio(userToken, targetToken) {
    if (userToken === targetToken) return 1.0;
    if (targetToken.includes(userToken) || userToken.includes(targetToken)) return 0.85;

    if (userToken.length > 3 && targetToken.length > 3) {
      const dist = getLevenshteinDistance(userToken, targetToken);
      if (dist === 1) return 0.82;
      if (dist === 2 && userToken.length > 5) return 0.65;
    }
    return 0;
  }

  // Short-term Context Memory: Resolve pronouns like "it", "that", "download it", "is it free"
  resolveContext(rawQuery) {
    const lower = rawQuery.toLowerCase().trim();
    const pronouns = ['it', 'that', 'this', 'download it', 'where is it', 'is it free', 'can i download it', 'link'];
    const containsPronoun = pronouns.some(p => lower.includes(p));

    if (containsPronoun && this.contextMemory.lastIntentId) {
      return `${rawQuery} ${this.contextMemory.lastTopic || ''}`;
    }
    return rawQuery;
  }

  // Main Classification Pipeline
  classify(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return this.buildFallbackResponse();
    }

    const resolvedQuery = this.resolveContext(rawQuery);
    const queryTokens = this.tokenize(resolvedQuery);

    if (queryTokens.length === 0) {
      return this.buildFallbackResponse();
    }

    const scoredIntents = [];

    for (const intent of this.intents) {
      let score = 0;
      const lowerQueryStr = resolvedQuery.toLowerCase();

      // 1. Exact Phrase Matching Boost
      for (const pattern of intent.patterns) {
        const lowerPattern = pattern.toLowerCase();
        if (lowerQueryStr.includes(lowerPattern)) {
          score += 3.0 * lowerPattern.length;
        }
      }

      // 2. BM25 / TF-IDF Vector & Fuzzy Pattern Scoring
      for (const qToken of queryTokens) {
        const expandedQueryTokens = this.expandTokenSynonyms(qToken);

        for (const intentPattern of intent.patterns) {
          const patternTokens = this.tokenize(intentPattern);

          for (const exToken of expandedQueryTokens) {
            const tokenWeight = this.tokenIDF[exToken] || 1.0;

            for (const pToken of patternTokens) {
              const matchRatio = this.fuzzyMatchRatio(exToken, pToken);
              if (matchRatio > 0) {
                score += matchRatio * tokenWeight * (exToken.length + pToken.length);
              }
            }
          }
        }
      }

      if (score > 0) {
        scoredIntents.push({ intent, score });
      }
    }

    // Sort by highest score descending
    scoredIntents.sort((a, b) => b.score - a.score);

    if (scoredIntents.length === 0) {
      return this.buildFallbackResponse();
    }

    const best = scoredIntents[0];
    const runnerUps = scoredIntents.slice(1, 3).map(s => s.intent);

    // Normalize confidence score between 0.0 and 1.0
    const confidenceScore = Math.min(1.0, best.score / 22.0);

    // Update Context Memory if confidence is valid
    if (confidenceScore >= 0.30 && best.intent) {
      this.contextMemory.lastIntentId = best.intent.id;
      this.contextMemory.lastTopic = best.intent.id.replace('event_', '').replace('_', ' ');
    }

    // ━━ CONFIDENCE EVALUATION ━━
    if (confidenceScore >= 0.58) {
      // HIGH CONFIDENCE
      return {
        confidence: 'HIGH',
        score: confidenceScore,
        answer: best.intent.answer,
        quickChips: best.intent.quickChips || ["Registration", "5 Events", "Rulebook"],
        navAction: best.intent.navAction || null
      };
    } else if (confidenceScore >= 0.30) {
      // MEDIUM CONFIDENCE: Answer + Suggested Related Possibilities
      const suggestions = runnerUps.map(i => i.quickChips ? i.quickChips[0] : i.id).filter(Boolean);
      return {
        confidence: 'MEDIUM',
        score: confidenceScore,
        answer: `${best.intent.answer}\n\n💡 *Related topics you might also be looking for:*`,
        quickChips: [...new Set([...(best.intent.quickChips || []), ...suggestions])].slice(0, 4),
        navAction: best.intent.navAction || null
      };
    } else {
      // LOW CONFIDENCE / NO HALLUCINATION FALLBACK
      return this.buildFallbackResponse();
    }
  }

  buildFallbackResponse() {
    return {
      confidence: 'LOW',
      score: 0.0,
      answer: "I couldn't confidently identify what you meant. I can help with **Registration**, **Rulebook**, **5 Events**, **Schedule**, **Eligibility**, **Venue**, and **Contact**.",
      quickChips: ["Registration", "5 Events", "Rulebook", "Venue", "Schedule", "Contact"],
      navAction: { "type": "navigate", "route": "#/about", "label": "ℹ️ Visit Help & FAQ Section" }
    };
  }
}

export const intentEngine = new IntentEngine();
