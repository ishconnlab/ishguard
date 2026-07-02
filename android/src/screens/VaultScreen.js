import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../components/Theme';

const CATEGORIES = [
  { id: 'articles', name: 'Articles', icon: 'file-document-outline' },
  { id: 'pdfs', name: 'PDFs', icon: 'file-pdf-box' },
  { id: 'notes', name: 'Notes', icon: 'note-text-outline' },
  { id: 'summaries', name: 'AI Summaries', icon: 'lightbulb-on-outline' },
  { id: 'bookmarks', name: 'Bookmarks', icon: 'bookmark-outline' },
];

const STORAGE_KEY = '@ishguard_vault';

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [urlInput, setUrlInput] = useState('');
  const [showReader, setShowReader] = useState(false);
  const [readerText, setReaderText] = useState('');
  const [readerResult, setReaderResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoading(false);
  };

  const saveItems = async (newItems) => {
    setItems(newItems);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems)); } catch {}
  };

  const addBookmark = async () => {
    if (!urlInput.trim()) return;
    const newItem = { id: Date.now().toString(), url: urlInput.trim(), title: urlInput.trim().split('/').pop() || urlInput.trim(), category: 'bookmarks', type: 'bookmark', savedAt: new Date().toISOString() };
    await saveItems([newItem, ...items]);
    setUrlInput('');
  };

  const deleteItem = (id) => {
    Alert.alert('Delete Item', 'Remove this item from vault?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = items.filter(i => i.id !== id);
        await saveItems(updated);
      }},
    ]);
  };

  const analyzeText = () => {
    if (!readerText.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const words = readerText.split(/\s+/).filter(w => w.length > 0);
      const sentences = readerText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const freq = {};
      words.forEach(w => { const lw = w.toLowerCase().replace(/[^a-z]/g, ''); if (lw.length > 4) freq[lw] = (freq[lw] || 0) + 1; });
      const concepts = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word]) => word);

      setReaderResult({
        summary: sentences.length > 0 ? sentences.slice(0, 3).join('. ') + '.' : 'No sentences found in text.',
        keyPoints: sentences.slice(0, 5),
        wordCount: words.length,
        readTime: Math.max(1, Math.ceil(words.length / 200)),
        concepts,
      });
      setAnalyzing(false);
    }, 600);
  };

  const saveReaderResult = async () => {
    if (!readerResult) return;
    const newItem = { id: Date.now().toString(), title: readerText.split('\n')[0]?.slice(0, 60) || 'AI Analysis', category: 'summaries', type: 'analysis', savedAt: new Date().toISOString(), hasAiSummary: true };
    await saveItems([newItem, ...items]);
    setShowReader(false);
    setReaderText('');
    setReaderResult(null);
  };

  const categories = ['all', ...CATEGORIES.map(c => c.id)];
  const filtered = items.filter(i => filter === 'all' || i.category === filter);

  if (showReader) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { setShowReader(false); setReaderResult(null); setReaderText(''); }} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color={colors.primary} />
          <Text style={styles.backLink}>Back to Vault</Text>
        </TouchableOpacity>
        <View style={styles.sectionHeader}>
          <Icon name="lightbulb-on-outline" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>AI Reader</Text>
        </View>
        <TextInput style={styles.readerInput} multiline placeholder="Paste text to analyze..." placeholderTextColor={colors.onSurfaceMuted} value={readerText} onChangeText={setReaderText} />
        <View style={styles.readerActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={analyzeText} disabled={!readerText.trim() || analyzing}>
            {analyzing ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>AI Analyze</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={saveReaderResult} disabled={!readerResult}>
            <Icon name="content-save-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Save to Vault</Text>
          </TouchableOpacity>
        </View>
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.analyzingText}>Analyzing content...</Text>
          </View>
        )}
        {readerResult && !analyzing && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Summary</Text>
            <Text style={styles.resultText}>{readerResult.summary}</Text>
            <Text style={styles.resultLabel}>Key Points</Text>
            {readerResult.keyPoints.slice(0, 5).map((p, i) => (
              <Text key={i} style={styles.bulletText}>• {p}</Text>
            ))}
            <View style={styles.statsRow}>
              <Icon name="counter" size={14} color={colors.onSurfaceMuted} />
              <Text style={styles.stat}>{readerResult.wordCount} words</Text>
              <Icon name="clock-outline" size={14} color={colors.onSurfaceMuted} />
              <Text style={styles.stat}>{readerResult.readTime} min read</Text>
            </View>
            {readerResult.concepts.length > 0 && (
              <>
                <Text style={styles.resultLabel}>Concepts</Text>
                <View style={styles.tagRow}>
                  {readerResult.concepts.map((c, i) => (
                    <View key={i} style={styles.tag}><Text style={styles.tagText}>{c}</Text></View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.addSection}>
        <TextInput style={styles.urlInput} placeholder="Enter URL to save..." placeholderTextColor={colors.onSurfaceMuted} value={urlInput} onChangeText={setUrlInput} onSubmitEditing={addBookmark} returnKeyType="done" />
        <TouchableOpacity style={styles.primaryButton} onPress={addBookmark} disabled={!urlInput.trim()}>
          <Icon name="bookmark-plus-outline" size={20} color={colors.onPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.primaryButtonText}>Save Bookmark</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.readerToggle} onPress={() => setShowReader(true)} activeOpacity={0.7}>
        <Icon name="lightbulb-on" size={22} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <Text style={styles.readerToggleText}>Open AI Reader</Text>
        <Icon name="chevron-right" size={20} color={colors.onSurfaceMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <View style={styles.categoryRow}>
        {categories.map(cat => {
          const catObj = CATEGORIES.find(c => c.id === cat);
          return (
            <TouchableOpacity key={cat} style={[styles.categoryChip, filter === cat && styles.activeChip]} onPress={() => setFilter(cat)}>
              {cat !== 'all' && <Icon name={catObj?.icon || 'folder'} size={14} color={filter === cat ? colors.primary : colors.onSurfaceVariant} />}
              <Text style={[styles.categoryText, filter === cat && styles.activeText]}>{cat === 'all' ? 'All' : cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.analyzingText}>Loading vault...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="archive-outline" size={48} color={colors.onSurfaceMuted} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyDesc}>Save your first bookmark or analyze content with AI Reader</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemCard} onLongPress={() => deleteItem(item.id)} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Icon name={CATEGORIES.find(c => c.id === item.category)?.icon || 'file-document-outline'} size={22} color={colors.primary} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                <Text style={styles.itemDate}>{new Date(item.savedAt).toLocaleDateString()}</Text>
              </View>
              {item.hasAiSummary && (
                <View style={styles.aiBadge}>
                  <Icon name="lightning-bolt" size={10} color={colors.safe} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  backLink: { fontSize: typography.sizes.sm, color: colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  addSection: { marginBottom: spacing.md },
  urlInput: { backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md, color: colors.onSurface, fontSize: typography.sizes.sm, marginBottom: spacing.sm },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 10, padding: spacing.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: spacing.sm, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  primaryButtonText: { color: colors.onPrimary, fontWeight: typography.weights.semibold },
  secondaryButton: { backgroundColor: colors.surfaceVariant, borderRadius: 10, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.primary + '30' },
  secondaryButtonText: { color: colors.primary, fontWeight: typography.weights.semibold },
  readerToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  readerToggleText: { color: colors.onSurface, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  readerInput: { backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md, color: colors.onSurface, fontSize: typography.sizes.sm, minHeight: 150, textAlignVertical: 'top', marginBottom: spacing.sm },
  readerActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  analyzingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  analyzingText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, backgroundColor: colors.surfaceVariant },
  activeChip: { backgroundColor: colors.primary + '30' },
  categoryText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant },
  activeText: { color: colors.primary },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.onSurface },
  emptyDesc: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceVariant, borderRadius: 10, padding: spacing.md, marginBottom: spacing.xs, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  itemIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: typography.sizes.sm, color: colors.onSurface, fontWeight: typography.weights.medium },
  itemDate: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.safe + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  aiBadgeText: { fontSize: 9, color: colors.safe, fontWeight: typography.weights.bold },
  resultCard: { backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: spacing.md, marginTop: spacing.sm },
  resultLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.onSurface, marginTop: spacing.sm, marginBottom: spacing.xs },
  resultText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, lineHeight: 20 },
  bulletText: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant, marginLeft: spacing.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  stat: { fontSize: typography.sizes.xs, color: colors.onSurfaceMuted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.primary + '20', borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  tagText: { fontSize: typography.sizes.xs, color: colors.primary },
});
