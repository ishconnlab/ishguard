export class AIReader {
  constructor() {
    this.name = 'ISHGuard AI Reader';
    this.version = '1.0.0';
  }

  analyze(content, options = {}) {
    if (!content || content.trim().length < 10) {
      return { error: 'Content too short to analyze' };
    }
    const text = content.replace(/<[^>]+>/g, '').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;

    return {
      summary: this.summarize(text, wordCount),
      keyPoints: this.extractKeyPoints(text, wordCount),
      studyNotes: this.createStudyNotes(text, words, sentences),
      concepts: this.extractConcepts(words),
      flashcards: this.generateFlashcards(sentences),
      revisionNotes: this.createRevisionNotes(text, wordCount),
      wordCount,
      sentenceCount,
      estimatedReadTime: Math.max(1, Math.ceil(wordCount / 200)) + ' min'
    };
  }

  summarize(text, wordCount) {
    if (wordCount < 50) return text.substring(0, 200);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return text.substring(0, 300);

    const scored = sentences.map(s => ({
      sentence: s.trim(),
      score: this.scoreSentence(s, text, wordCount)
    }));

    const summaryCount = Math.max(1, Math.min(5, Math.ceil(sentences.length / 5)));
    const top = scored.sort((a, b) => b.score - a.score).slice(0, summaryCount)
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence));

    return top.map(s => s.sentence).join('. ') + '.';
  }

  scoreSentence(sentence, fullText, wordCount) {
    let score = 0;
    const s = sentence.toLowerCase();
    const importantTerms = [
      'therefore', 'significant', 'important', 'key', 'critical',
      'essential', 'primary', 'major', 'fundamental', 'crucial',
      'conclusion', 'result', 'finding', 'discovery', 'reveal',
      'introduce', 'propose', 'develop', 'create', 'establish',
      'however', 'furthermore', 'moreover', 'consequently',
      'in summary', 'in conclusion', 'overall', 'finally'
    ];
    for (const term of importantTerms) {
      if (s.includes(term)) score += 2;
    }
    const firstQuarter = fullText.substring(0, Math.floor(fullText.length / 4)).toLowerCase();
    const lastQuarter = fullText.substring(Math.floor(fullText.length * 3 / 4)).toLowerCase();
    if (firstQuarter.includes(sentence.toLowerCase().substring(0, 30))) score += 3;
    if (lastQuarter.includes(sentence.toLowerCase().substring(0, 30))) score += 2;
    if (sentence.length > 80 && sentence.length < 300) score += 1;
    if (/\d+%/.test(s) || /\d+ percent/.test(s)) score += 1;
    if (s.includes(' vs ') || s.includes(' versus ')) score += 1;
    const wordArr = sentence.split(/\s+/).filter(w => w.length > 0);
    const rareWords = wordArr.filter(w => w.length > 8).length;
    score += rareWords * 0.5;
    return score;
  }

  extractKeyPoints(text, wordCount) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keySentences = sentences
      .map(s => ({ sentence: s.trim(), score: this.scoreSentence(s, text, wordCount) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(8, Math.max(3, Math.ceil(sentences.length / 4))))
      .map(s => s.sentence);
    return keySentences;
  }

  createStudyNotes(text, words, sentences) {
    const wordCount = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const avgSentenceLength = sentences.length > 0
      ? Math.round(sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(w => w.length > 0).length, 0) / sentences.length)
      : 0;

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    const paragraphCount = paragraphs.length;

    const questions = sentences
      .filter(s => s.trim().endsWith('?'))
      .slice(0, 5)
      .map(s => s.trim());

    const stats = {
      totalWords: wordCount,
      uniqueWords,
      avgSentenceLength,
      paragraphCount,
      complexity: wordCount > 0 && uniqueWords > 0
        ? (uniqueWords / wordCount > 0.6 ? 'Advanced' : uniqueWords / wordCount > 0.4 ? 'Intermediate' : 'Basic')
        : 'Unknown',
      readingLevel: avgSentenceLength > 25 ? 'Advanced' : avgSentenceLength > 15 ? 'Intermediate' : 'Basic'
    };

    const keyTerms = this.extractKeyTerms(words, 10);
    const sections = this.detectSections(text);

    return { stats, keyTerms, sections, questions };
  }

  extractConcepts(words) {
    const freq = {};
    for (const word of words) {
      const w = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (w.length > 4 && !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'which', 'what', 'when', 'where', 'about', 'would', 'could', 'should', 'there', 'these', 'those', 'after', 'before', 'between', 'other', 'while', 'because'].includes(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, frequency: count }));
  }

  extractKeyTerms(words, maxTerms) {
    const freq = {};
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = (words[i] + ' ' + words[i + 1]).toLowerCase().replace(/[^a-z\s]/g, '');
      if (bigram.split(' ').every(w => w.length > 2)) {
        freq[bigram] = (freq[bigram] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms)
      .map(([term, count]) => ({ term, frequency: count }));
  }

  detectSections(text) {
    const sectionHeaders = text.match(/^#{1,3}\s+.+$/gm) ||
      text.match(/^[A-Z][A-Z\s]+$/gm) ||
      text.match(/\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\n/g);
    if (!sectionHeaders) return [];
    return sectionHeaders.map(h => h.trim().replace(/^#+\s*/, '')).filter(h => h.length > 2 && h.length < 100);
  }

  generateFlashcards(sentences) {
    const candidates = sentences
      .filter(s => s.length > 40 && s.length < 300 && !s.trim().endsWith('?'))
      .slice(0, 10);
    return candidates.map(s => {
      const trimmed = s.trim();
      const words = trimmed.split(/\s+/);
      const blankIndex = Math.min(words.length - 1, Math.floor(words.length / 2));
      const answer = words[blankIndex].replace(/[^a-zA-Z]/g, '');
      words[blankIndex] = '________';
      return {
        question: words.join(' '),
        answer,
        original: trimmed
      };
    });
  }

  createRevisionNotes(text, wordCount) {
    const bulletPoints = text.split(/[.!?]+\s+/)
      .filter(s => s.trim().length > 50)
      .slice(0, 8)
      .map(s => s.trim().replace(/^[-\s]+/, ''));
    let difficulty = 'basic';
    if (wordCount > 500) difficulty = 'intermediate';
    if (wordCount > 1500) difficulty = 'advanced';
    return {
      difficulty,
      bulletPoints,
      studyTip: wordCount > 1000
        ? 'Break this into 10-minute reading sessions for better retention'
        : 'Quick read — take notes on key concepts'
    };
  }

  translate(content, targetLang = 'simple') {
    if (!content) return { error: 'No content provided' };
    const text = content.replace(/<[^>]+>/g, '').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (targetLang === 'simple') {
      const simplified = sentences.map(s => {
        const sw = s.split(/\s+/).filter(w => w.length > 0);
        const simple = sw.map(w => {
          if (w.length > 8) return '[simplified]';
          return w;
        }).join(' ');
        return simple;
      }).join('. ');
      return {
        original: text,
        simplified,
        summary: this.summarize(text, words.length),
        originalWords: words.length,
        simplifiedWords: simplified.split(/\s+/).length
      };
    }
    return { error: `Unsupported target: ${targetLang}` };
  }

  compareTexts(textA, textB) {
    if (!textA || !textB) return { error: 'Both texts required' };
    const a = textA.replace(/<[^>]+>/g, '').trim();
    const b = textB.replace(/<[^>]+>/g, '').trim();
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    const common = [...wordsA].filter(w => wordsB.has(w));
    const similarity = wordsA.size > 0 || wordsB.size > 0
      ? (common.length * 2) / (wordsA.size + wordsB.size)
      : 0;
    return {
      similarity: Math.round(similarity * 100) / 100,
      commonTerms: common.slice(0, 20),
      uniqueToA: [...wordsA].filter(w => !wordsB.has(w)).slice(0, 20),
      uniqueToB: [...wordsB].filter(w => !wordsA.has(w)).slice(0, 20),
      lengthA: a.length,
      lengthB: b.length
    };
  }
}
