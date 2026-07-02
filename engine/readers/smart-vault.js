import { analyzeContent, extractTextFromHtml, cleanHtml, extractMetadata, classifyContent } from './content-capture.js';
import { AIReader } from './ai-reader.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const VAULT_ROOT = path.join(os.homedir(), 'ISHGuard', 'vault');
const VAULT_INDEX = path.join(VAULT_ROOT, 'index.json');

const VAULT_CATEGORIES = {
  articles: { name: 'Articles', icon: '📄', path: 'articles' },
  pdfs: { name: 'PDFs', icon: '📕', path: 'pdfs' },
  images: { name: 'Images', icon: '🖼️', path: 'images' },
  notes: { name: 'Notes', icon: '📝', path: 'notes' },
  summaries: { name: 'AI Summaries', icon: '🤖', path: 'summaries' },
  bookmarks: { name: 'Bookmarks', icon: '🔖', path: 'bookmarks' }
};

function ensureVault() {
  for (const cat of Object.values(VAULT_CATEGORIES)) {
    const dir = path.join(VAULT_ROOT, cat.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(VAULT_INDEX)) {
    fs.writeFileSync(VAULT_INDEX, JSON.stringify({ items: [], version: '2.0', created: new Date().toISOString() }, null, 2));
  }
}

function loadIndex() {
  ensureVault();
  try {
    return JSON.parse(fs.readFileSync(VAULT_INDEX, 'utf-8'));
  } catch {
    return { items: [], version: '2.0', created: new Date().toISOString() };
  }
}

function saveIndex(index) {
  ensureVault();
  fs.writeFileSync(VAULT_INDEX, JSON.stringify(index, null, 2));
}

function generateId() {
  return 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

export class SmartVault {
  constructor() {
    this.aiReader = new AIReader();
    ensureVault();
  }

  analyze(url, contentSample = '', contentType = '', headers = {}) {
    return analyzeContent(url, contentSample, contentType, headers);
  }

  classify(url, contentSample, contentType) {
    return classifyContent(url, contentSample, contentType);
  }

  getCategories() {
    return Object.entries(VAULT_CATEGORIES).map(([key, val]) => ({
      id: key,
      ...val,
      count: this.getItemCount(key)
    }));
  }

  getItemCount(category) {
    const index = loadIndex();
    return index.items.filter(i => i.category === category || i.type === category).length;
  }

  getStats() {
    const index = loadIndex();
    const totalItems = index.items.length;
    const categoryCounts = {};
    for (const item of index.items) {
      const cat = item.category || 'uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const totalSize = index.items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
    return {
      totalItems,
      categoryCounts,
      totalSize,
      categories: this.getCategories(),
      lastSaved: index.items.length > 0 ? index.items[index.items.length - 1].savedAt : null,
      vaultPath: VAULT_ROOT
    };
  }

  saveContent({ url, title, content, textContent, type, category, metadata, tags, source }) {
    ensureVault();
    const classification = classifyContent(url, content || '', type || '');
    const cat = category || classification.category || 'articles';
    const catDir = VAULT_CATEGORIES[cat]?.path || 'articles';
    const id = generateId();
    const filename = classification.suggestedFilename || `content_${id}.html`;
    const filePath = path.join(VAULT_ROOT, catDir, filename);
    const meta = extractMetadata(content) || {};

    const item = {
      id,
      url,
      title: title || meta.title || meta.ogTitle || filename,
      filename,
      type: type || classification.category || 'webpage',
      category: cat,
      tags: tags || classification.tags || [],
      metadata: {
        ...meta,
        description: metadata?.description || meta.description || meta.ogDescription || '',
        author: metadata?.author || meta.author || '',
        publishDate: metadata?.publishDate || meta.publishDate || '',
        source: source || 'manual',
        ogImage: meta.ogImage || ''
      },
      fileSize: (content || '').length + (textContent || '').length,
      savedAt: new Date().toISOString(),
      accessedAt: new Date().toISOString(),
      hasAiSummary: false,
      notes: ''
    };

    const storeContent = content || '';
    const storeText = textContent || extractTextFromHtml(content || '') || '';
    const payload = { item, content: storeContent, textContent: storeText };

    try {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
      const index = loadIndex();
      index.items.push(item);
      saveIndex(index);
      return { success: true, item, filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getContent(itemId) {
    const index = loadIndex();
    const item = index.items.find(i => i.id === itemId);
    if (!item) return { error: 'Item not found' };
    const catDir = VAULT_CATEGORIES[item.category]?.path || 'articles';
    const filePath = path.join(VAULT_ROOT, catDir, item.filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return { ...data, item };
    } catch {
      return { error: 'Content file not found', item };
    }
  }

  deleteItem(itemId) {
    const index = loadIndex();
    const idx = index.items.findIndex(i => i.id === itemId);
    if (idx === -1) return { success: false, error: 'Item not found' };
    const item = index.items[idx];
    const catDir = VAULT_CATEGORIES[item.category]?.path || 'articles';
    const filePath = path.join(VAULT_ROOT, catDir, item.filename);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    index.items.splice(idx, 1);
    saveIndex(index);
    return { success: true };
  }

  listItems(category, sortBy = 'savedAt', order = 'desc') {
    const index = loadIndex();
    let items = [...index.items];
    if (category && category !== 'all') {
      items = items.filter(i => i.category === category || i.type === category);
    }
    items.sort((a, b) => {
      const dir = order === 'asc' ? 1 : -1;
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title);
      if (sortBy === 'size') return dir * ((a.fileSize || 0) - (b.fileSize || 0));
      return dir * (new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
    });
    return items;
  }

  searchItems(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const index = loadIndex();
    return index.items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.url || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (item.metadata?.author || '').toLowerCase().includes(q) ||
      (item.metadata?.description || '').toLowerCase().includes(q)
    );
  }

  addNotes(itemId, notes) {
    const index = loadIndex();
    const item = index.items.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found' };
    item.notes = notes;
    item.updatedAt = new Date().toISOString();
    saveIndex(index);
    return { success: true, item };
  }

  addTags(itemId, tags) {
    const index = loadIndex();
    const item = index.items.find(i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found' };
    const newTags = Array.isArray(tags) ? tags : [tags];
    item.tags = [...new Set([...(item.tags || []), ...newTags])];
    item.updatedAt = new Date().toISOString();
    saveIndex(index);
    return { success: true, item };
  }

  bookmarkPage(url, title, metadata = {}) {
    const id = generateId();
    const item = {
      id,
      url,
      title: title || url,
      filename: '',
      type: 'bookmark',
      category: 'bookmarks',
      tags: ['bookmark'],
      metadata: { ...metadata, source: 'bookmark' },
      fileSize: 0,
      savedAt: new Date().toISOString(),
      accessedAt: new Date().toISOString(),
      hasAiSummary: false,
      notes: ''
    };
    const index = loadIndex();
    index.items.push(item);
    saveIndex(index);
    return { success: true, item };
  }

  analyzeItem(itemId) {
    const result = this.getContent(itemId);
    if (result.error) return result;
    const text = result.textContent || extractTextFromHtml(result.content || '');
    if (!text || text.trim().length < 10) {
      return { error: 'Content too short for AI analysis' };
    }
    const analysis = this.aiReader.analyze(text);
    const index = loadIndex();
    const item = index.items.find(i => i.id === itemId);
    if (item) {
      item.hasAiSummary = true;
      item.aiAnalysisDate = new Date().toISOString();
      saveIndex(index);
    }
    return { analysis, item: result.item };
  }

  summarizeItem(itemId) {
    const result = this.analyzeItem(itemId);
    if (result.error) return result;
    const summary = {
      summary: result.analysis.summary,
      keyPoints: result.analysis.keyPoints,
      concepts: result.analysis.concepts,
      wordCount: result.analysis.wordCount,
      estimatedReadTime: result.analysis.estimatedReadTime
    };
    const catDir = VAULT_CATEGORIES.summaries?.path || 'summaries';
    const summaryFile = path.join(VAULT_ROOT, catDir, `summary_${itemId}.json`);
    try {
      fs.writeFileSync(summaryFile, JSON.stringify({ itemId, summary, createdAt: new Date().toISOString() }, null, 2));
    } catch {}
    return summary;
  }

  getAISummary(itemId) {
    const catDir = VAULT_CATEGORIES.summaries?.path || 'summaries';
    const summaryFile = path.join(VAULT_ROOT, catDir, `summary_${itemId}.json`);
    try {
      return JSON.parse(fs.readFileSync(summaryFile, 'utf-8'));
    } catch {
      return null;
    }
  }

  createStudyNotes(itemId) {
    const result = this.analyzeItem(itemId);
    if (result.error) return result;
    return {
      revisionNotes: result.analysis.revisionNotes,
      flashcards: result.analysis.flashcards,
      studyNotes: result.analysis.studyNotes,
      keyPoints: result.analysis.keyPoints
    };
  }

  getTags() {
    const index = loadIndex();
    const tagSet = new Set();
    for (const item of index.items) {
      for (const tag of (item.tags || [])) tagSet.add(tag);
    }
    return [...tagSet].sort();
  }

  compareItems(itemIdA, itemIdB) {
    const a = this.getContent(itemIdA);
    const b = this.getContent(itemIdB);
    if (a.error) return a;
    if (b.error) return b;
    const textA = a.textContent || extractTextFromHtml(a.content || '');
    const textB = b.textContent || extractTextFromHtml(b.content || '');
    return this.aiReader.compareTexts(textA, textB);
  }

  clearAll() {
    try {
      for (const cat of Object.values(VAULT_CATEGORIES)) {
        const dir = path.join(VAULT_ROOT, cat.path);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            fs.unlinkSync(path.join(dir, file));
          }
        }
      }
      saveIndex({ items: [], version: '2.0', created: new Date().toISOString() });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getVaultPath() {
    return VAULT_ROOT;
  }

  exportItem(itemId, format = 'json') {
    const result = this.getContent(itemId);
    if (result.error) return result;
    if (format === 'text') return { format: 'text', content: result.textContent || '' };
    if (format === 'html') return { format: 'html', content: result.content || '' };
    return { format: 'json', data: result };
  }
}
