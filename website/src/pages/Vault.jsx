import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Trash2, FileText, Image, BarChart3, Archive, Bookmark, ExternalLink, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const STORAGE_KEY = 'ishguard_vault';
const API_BASE = 'http://localhost:9721';

function loadLocal() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLocal(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

const categoryIcons = { articles: FileText, pdfs: FileText, images: Image, notes: FileText, summaries: BookOpen, bookmarks: Bookmark };

export default function Vault() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [readerText, setReaderText] = useState('');
  const [readerResult, setReaderResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localMode, setLocalMode] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveUrl, setSaveUrl] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCategory, setSaveCategory] = useState('bookmarks');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    setItems(loadLocal());
    fetch(`${API_BASE}/api/vault/items`).then(r => r.ok && r.json().then(d => { setItems(d.items || d); setLocalMode(false); })).catch(() => {});
  }, []);

  const handleSave = () => {
    if (!saveUrl.trim()) return;
    const newItem = { id: `v_${Date.now()}`, url: saveUrl.trim(), title: saveTitle.trim() || saveUrl.split('/').pop() || 'Saved Page', category: saveCategory, type: saveCategory === 'pdfs' ? 'pdf' : saveCategory === 'images' ? 'image' : 'bookmark', savedAt: new Date().toISOString() };
    const updated = [newItem, ...items];
    setItems(updated);
    saveLocal(updated);
    setShowSaveModal(false);
    setSaveUrl('');
    setSaveTitle('');
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    const updated = items.filter(i => i.id !== showDeleteConfirm);
    setItems(updated);
    saveLocal(updated);
    if (selectedItem?.id === showDeleteConfirm) setSelectedItem(null);
    setShowDeleteConfirm(null);
  };

  const handleAnalyze = () => {
    if (!readerText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const words = readerText.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const sentences = readerText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const freq = {};
      words.forEach(w => { const lw = w.toLowerCase().replace(/[^a-z]/g, ''); if (lw.length > 4) freq[lw] = (freq[lw] || 0) + 1; });
      const concepts = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));
      setReaderResult({
        summary: sentences.slice(0, 3).join('. ') + '.',
        keyPoints: sentences.slice(0, 5),
        wordCount,
        uniqueWords: uniqueWords.size,
        readTime: Math.ceil(wordCount / 200),
        concepts,
        sentenceCount: sentences.length,
      });
      setLoading(false);
    }, 800);
  };

  const handleSaveReader = () => {
    if (!readerResult) return;
    const newItem = { id: `v_${Date.now()}`, title: readerText.split('\n')[0].slice(0, 60) || 'AI Analysis', category: 'summaries', type: 'analysis', savedAt: new Date().toISOString(), textContent: readerText, hasAiSummary: true };
    const updated = [newItem, ...items];
    setItems(updated);
    saveLocal(updated);
    setShowReader(false);
    setReaderText('');
    setReaderResult(null);
  };

  const categories = ['all', ...new Set(items.map(i => i.category))];
  const filtered = items.filter(i => {
    if (filter !== 'all' && i.category !== filter) return false;
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Content Vault</h1>
            <p className="text-sm text-gray-500 mt-1">Save, organize, and analyze content offline</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={localMode ? 'warning' : 'success'} size="sm" dot>{localMode ? 'Offline Mode' : 'Agent Connected'}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setShowReader(!showReader)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${showReader ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            {showReader ? 'Back to Vault' : 'AI Reader'}
          </button>
          {!showReader && (
            <>
              <button onClick={() => setShowSaveModal(true)} className="px-4 py-2 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand-dark transition-all">+ Save Content</button>
              <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] max-w-[280px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Search vault..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/30" />
              </div>
            </>
          )}
        </div>

        {!showReader && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === cat ? 'bg-brand/10 text-brand border border-brand/20' : 'text-gray-500 hover:text-gray-300'}`}>
                {cat === 'all' ? 'All' : cat}
                {cat !== 'all' && <span className="ml-1 text-gray-600">({items.filter(i => i.category === cat).length})</span>}
              </button>
            ))}
          </div>
        )}

        {showReader ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card glass>
              <h3 className="text-sm font-semibold text-white mb-3">Content Input</h3>
              <textarea value={readerText} onChange={e => setReaderText(e.target.value)} placeholder="Paste article text, notes, or any content to analyze..." className="w-full h-64 bg-dark-900/50 border border-white/10 rounded-lg p-4 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-brand/30" />
              <div className="flex gap-2 mt-3">
                <Button size="sm" icon={BarChart3} onClick={handleAnalyze} disabled={loading || !readerText.trim()}>{loading ? 'Analyzing...' : 'AI Analyze'}</Button>
                <Button size="sm" variant="secondary" icon={BookOpen} onClick={handleSaveReader} disabled={!readerResult}>Save to Vault</Button>
              </div>
            </Card>
            {readerResult && (
              <Card glass>
                <h3 className="text-sm font-semibold text-white mb-3">AI Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Summary</h4>
                    <p className="text-sm text-gray-300">{readerResult.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                      {readerResult.keyPoints.slice(0, 5).map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>{readerResult.wordCount} words</span>
                    <span>{readerResult.uniqueWords} unique words</span>
                    <span>{readerResult.sentenceCount} sentences</span>
                    <span>{readerResult.readTime} min read</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {readerResult.concepts.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] border border-brand/20">{c.word} ({c.count})</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {filtered.length === 0 ? (
                <Card glass className="text-center py-12">
                  <Archive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-white mb-1">Vault is Empty</h3>
                  <p className="text-sm text-gray-500 mb-4">Save articles, PDFs, notes, and more to your secure vault.</p>
                  <Button size="sm" icon={Plus} onClick={handleSave}>Save Your First Item</Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filtered.map(item => {
                    const Icon = categoryIcons[item.category] || FileText;
                    return (
                      <div key={item.id} onClick={() => setSelectedItem(item)} className={`glass-card rounded-lg p-4 cursor-pointer transition-all hover:border-brand/20 ${selectedItem?.id === item.id ? 'border-brand/30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-brand flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{item.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.url || new Date(item.savedAt).toLocaleDateString()}</div>
                          </div>
                          <Badge variant="info" size="sm">{item.category}</Badge>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-gray-500 hover:text-risk transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <Card glass className="sticky top-24">
                <h3 className="text-sm font-semibold text-white mb-4">
                  {selectedItem ? selectedItem.title || 'Item Details' : 'Vault Info'}
                </h3>
                {selectedItem ? (
                  <div className="space-y-3 text-sm">
                    <div><span className="text-gray-500">Category:</span> <span className="text-white capitalize">{selectedItem.category}</span></div>
                    {selectedItem.url && <div><span className="text-gray-500">URL:</span> <a href={selectedItem.url} className="text-brand hover:underline block truncate">{selectedItem.url}</a></div>}
                    <div><span className="text-gray-500">Saved:</span> <span className="text-white">{new Date(selectedItem.savedAt).toLocaleString()}</span></div>
                    {selectedItem.hasAiSummary && <Badge variant="success" size="sm">AI Analyzed</Badge>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    <p>Select an item to view details.</p>
                    <div className="mt-4 space-y-2 text-xs text-gray-600">
                      <p><span className="text-white">{items.length}</span> total items</p>
                      <p><span className="text-white">{categories.length - 1}</span> categories</p>
                      <p><span className="text-white">{items.filter(i => i.hasAiSummary).length}</span> AI analyses</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Item"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Delete</Button>
          </>
        }>
        <p className="text-sm text-gray-400">Are you sure you want to delete this item from your vault? This action cannot be undone.</p>
      </Modal>

      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title="Save to Vault"
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!saveUrl.trim()}>Save</Button>
          </>
        }>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">URL</label>
            <input type="url" value={saveUrl} onChange={e => setSaveUrl(e.target.value)} placeholder="https://example.com/article" autoFocus
              className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title (optional)</label>
            <input type="text" value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Auto-detected from URL"
              className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={saveCategory} onChange={e => setSaveCategory(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand/30">
              <option value="bookmarks">Bookmark</option>
              <option value="articles">Article</option>
              <option value="pdfs">PDF</option>
              <option value="notes">Note</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
