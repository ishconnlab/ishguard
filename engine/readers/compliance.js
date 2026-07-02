const ALLOWED_SCHEMES = ['http:', 'https:', 'ftp:'];
const BLOCKED_DOMAINS = [
  'patreon.com', 'onlyfans.com', 'substack.com',
  'nytimes.com', 'wsj.com', 'ft.com', 'bloomberg.com',
  'washingtonpost.com', 'theatlantic.com', 'economist.com',
  'hbr.org', 'nature.com', 'sciencedirect.com',
  'elsevier.com', 'springer.com', 'ieee.org', 'acm.org'
];
const BLOCKED_PATTERNS = [
  /\.pdf\?.*token=/i, /\.epub\?.*token=/i, /\.mp4\?.*token=/i,
  /\/paywall\//i, /\/subscribe\//i, /\/membership\//i,
  /\/checkout\//i, /\/purchase\//i, /\/login\?.*redirect/i,
  /\.m3u8/i, /\.ts\?/i, /drm=/i, /license=/i
];
const DRM_HEADERS = ['x-drm', 'x-encrypted', 'x-protected', 'content-protection'];
const ALLOWED_EXTENSIONS = ['.pdf', '.epub', '.html', '.htm', '.txt', '.md', '.csv', '.json',
  '.xml', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.mp4', '.webm', '.mp3', '.ogg', '.wav',
  '.doc', '.docx', '.odt', '.rtf',
  '.ppt', '.pptx', '.xls', '.xlsx', '.csv'];

export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, reason: 'No URL provided' };
  }
  try {
    const parsed = new URL(url);
    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
      return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}` };
    }
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    for (const domain of BLOCKED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { valid: false, reason: `Domain requires subscription: ${domain}` };
      }
    }
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(url)) {
        return { valid: false, reason: 'URL appears to contain restricted content' };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

export function detectFileType(url, contentType) {
  const ext = url ? '.' + url.split('?')[0].split('/').pop().split('.').pop().toLowerCase() : '';
  if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
    const typeMap = {
      '.pdf': 'pdf', '.epub': 'epub',
      '.html': 'html', '.htm': 'html', '.txt': 'text', '.md': 'markdown',
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image',
      '.webp': 'image', '.svg': 'image',
      '.mp4': 'video', '.webm': 'video',
      '.mp3': 'audio', '.ogg': 'audio', '.wav': 'audio',
      '.doc': 'document', '.docx': 'document', '.odt': 'document', '.rtf': 'document',
      '.ppt': 'presentation', '.pptx': 'presentation',
      '.xls': 'spreadsheet', '.xlsx': 'spreadsheet', '.csv': 'spreadsheet',
      '.json': 'data', '.xml': 'data'
    };
    return { type: typeMap[ext] || 'unknown', extension: ext, verified: true };
  }
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes('application/pdf')) return { type: 'pdf', extension: '.pdf', verified: true };
    if (ct.includes('application/epub')) return { type: 'epub', extension: '.epub', verified: true };
    if (ct.includes('text/html')) return { type: 'html', extension: '.html', verified: true };
    if (ct.includes('image/')) return { type: 'image', extension: '.' + ct.split('/')[1], verified: true };
    if (ct.includes('video/')) return { type: 'video', extension: '.' + ct.split('/')[1], verified: true };
    if (ct.includes('audio/')) return { type: 'audio', extension: '.' + ct.split('/')[1], verified: true };
    if (ct.includes('text/')) return { type: 'text', extension: '.txt', verified: true };
  }
  return { type: 'unknown', extension: '', verified: false };
}

export function detectPageType(url, contentSample) {
  const u = url.toLowerCase();
  if (u.includes('/pdf') || u.endsWith('.pdf') || /\.pdf\?/.test(u)) return 'pdf';
  if (u.includes('/epub') || u.endsWith('.epub')) return 'epub';
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return 'image';
  if (/\.(mp4|webm)(\?|$)/i.test(url) || u.includes('/video') || u.includes('/embed')) return 'video';
  if (/\.(mp3|ogg|wav)(\?|$)/i.test(url)) return 'audio';
  if (contentSample) {
    const s = contentSample.toLowerCase();
    if (s.includes('<article') || s.includes('article class') || s.includes('article ') ||
        s.includes('<main') || s.includes('post-content') || s.includes('entry-content')) return 'article';
    if (s.includes('<!doctype html') || s.includes('<html')) return 'webpage';
  }
  if (u.includes('/article') || u.includes('/blog') || u.includes('/post') ||
      u.includes('/news') || u.includes('/story') || u.includes('/read')) return 'article';
  return 'webpage';
}

export function checkDrm(headers) {
  if (!headers) return { drmProtected: false };
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  for (const drmHeader of DRM_HEADERS) {
    if (lower[drmHeader] && lower[drmHeader] !== 'none') {
      return { drmProtected: true, reason: `DRM header detected: ${drmHeader}` };
    }
  }
  if (lower['content-type'] && (
    lower['content-type'].includes('application/encrypted') ||
    lower['content-type'].includes('application/x-drm'))) {
    return { drmProtected: true, reason: 'Encrypted content type' };
  }
  return { drmProtected: false };
}

export function isDirectDownload(url) {
  if (!url) return false;
  const ext = url.split('?')[0].split('/').pop().split('.').pop().toLowerCase();
  const directExts = ['pdf', 'epub', 'txt', 'md', 'csv', 'json', 'xml',
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'mp4', 'webm', 'mp3', 'ogg', 'wav',
    'doc', 'docx', 'odt', 'rtf', 'zip'];
  if (directExts.includes(ext)) return true;
  if (url.includes('/download/') || url.includes('/dl/') || url.includes('/file/') ||
      url.includes('download=') || url.includes('?format=')) return true;
  return false;
}

export function isLikelyArticle(url, contentSample) {
  if (!contentSample) return false;
  const s = contentSample;
  const articleSignals = [
    '<article', 'entry-content', 'post-content', 'article-body',
    'article__content', 'story-body', 'main-content', 'content-body',
    'article-header', 'byline', 'author', 'published-date',
    'word-count', 'reading-time'
  ];
  let signalCount = 0;
  for (const signal of articleSignals) {
    if (s.toLowerCase().includes(signal)) signalCount++;
  }
  const textRatio = s.replace(/<[^>]+>/g, '').trim().length / (s.length || 1);
  return signalCount >= 2 || textRatio > 0.4;
}

export function estimateContentLength(contentSample) {
  if (!contentSample) return 0;
  const text = contentSample.replace(/<[^>]+>/g, '').trim();
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;
  return { words: wordCount, characters: charCount, estimatedReadTime: Math.max(1, Math.ceil(wordCount / 200)) + ' min' };
}
