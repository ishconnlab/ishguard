import { validateUrl, detectFileType, detectPageType, checkDrm, isDirectDownload, isLikelyArticle, estimateContentLength } from './compliance.js';

export function analyzeContent(url, contentSample = '', contentType = '', headers = {}) {
  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) {
    return { canSave: false, reason: urlCheck.reason };
  }
  const drm = checkDrm(headers);
  if (drm.drmProtected) {
    return { canSave: false, reason: drm.reason };
  }
  const fileInfo = detectFileType(url, contentType);
  const pageType = detectPageType(url, contentSample);
  const directLink = isDirectDownload(url);
  const isArticle = isLikelyArticle(url, contentSample);
  const contentLen = estimateContentLength(contentSample);

  const actions = [];
  if (directLink && fileInfo.verified) {
    actions.push({ action: 'download', label: `Download ${fileInfo.type.toUpperCase()}`, priority: 1 });
    actions.push({ action: 'save-to-vault', label: 'Save to Vault', priority: 2 });
  }
  if (pageType === 'article' || isArticle) {
    actions.push({ action: 'save-offline', label: 'Save for Offline Reading', priority: 1 });
    actions.push({ action: 'summarize', label: 'AI Summarize Page', priority: 2 });
    actions.push({ action: 'bookmark', label: 'Bookmark Page', priority: 3 });
  }
  if (pageType === 'webpage' && !isArticle) {
    actions.push({ action: 'save-offline', label: 'Save Page', priority: 2 });
    actions.push({ action: 'bookmark', label: 'Bookmark Page', priority: 3 });
  }
  if (fileInfo.type === 'image') {
    actions.push({ action: 'save-images', label: 'Save Image', priority: 1 });
    actions.push({ action: 'save-to-vault', label: 'Save to Vault', priority: 2 });
  }
  if (pageType === 'video' || fileInfo.type === 'video') {
    actions.push({ action: 'bookmark', label: 'Save Link + Summary', priority: 1 });
    actions.push({ action: 'save-to-vault', label: 'Save to Vault', priority: 2 });
  }
  if (contentLen.words > 0 && (pageType === 'article' || isArticle)) {
    actions.push({ action: 'extract-text', label: 'Extract Text Content', priority: 2 });
  }

  return {
    canSave: true,
    url,
    urlCheck,
    drm,
    fileInfo,
    pageType,
    directLink,
    isArticle,
    contentLength: contentLen,
    actions: actions.sort((a, b) => a.priority - b.priority),
    metadata: extractMetadata(contentSample)
  };
}

export function extractMetadata(contentSample) {
  if (!contentSample) return {};
  const meta = {};
  const titleMatch = contentSample.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();
  const descMatch = contentSample.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) meta.description = descMatch[1];
  const ogTitle = contentSample.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitle) meta.ogTitle = ogTitle[1];
  const ogDesc = contentSample.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (ogDesc) meta.ogDescription = ogDesc[1];
  const ogImage = contentSample.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImage) meta.ogImage = ogImage[1];
  const authorMatch = contentSample.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i) ||
    contentSample.match(/<[^>]+class=["'][^"']*author[^"']*["'][^>]*>([^<]+)</i);
  if (authorMatch) meta.author = authorMatch[1].trim();
  const dateMatch = contentSample.match(/<meta\s+name=["'](?:publication_date|date)["']\s+content=["']([^"']+)["']/i) ||
    contentSample.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  if (dateMatch) meta.publishDate = dateMatch[1];
  return meta;
}

export function extractTextFromHtml(html) {
  if (!html) return '';
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

export function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:[^\s"'`]*/gi, '');
}

export function extractImagesFromHtml(html, baseUrl) {
  const imgs = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const src = match[1];
      if (src.startsWith('data:')) continue;
      const url = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      imgs.push({ url, alt: altMatch ? altMatch[1] : '', source: 'html' });
    } catch {}
  }
  return imgs;
}

export function extractLinksFromHtml(html, baseUrl) {
  const links = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1];
      if (href.startsWith('#') || href.startsWith('javascript:')) continue;
      const url = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      if (text && url) links.push({ url, text });
    } catch {}
  }
  return links;
}

export function classifyContent(url, contentSample, contentType) {
  const fileInfo = detectFileType(url, contentType);
  const pageType = detectPageType(url, contentSample);
  const urlCheck = validateUrl(url);
  const isDirect = isDirectDownload(url);
  const isArticle = isLikelyArticle(url, contentSample);
  const contentLen = estimateContentLength(contentSample);

  let category;
  if (isDirect && fileInfo.type === 'pdf') category = 'pdf';
  else if (isDirect && fileInfo.type === 'epub') category = 'epub';
  else if (fileInfo.type === 'image') category = 'image';
  else if (fileInfo.type === 'video') category = 'video';
  else if (isArticle || pageType === 'article') category = 'article';
  else category = 'webpage';

  return {
    category,
    tags: generateTags(url, category, pageType, fileInfo, contentLen),
    urlCheck,
    isDirect,
    suggestedFilename: generateFilename(url, category)
  };
}

function generateTags(url, category, pageType, fileInfo, contentLen) {
  const tags = [category];
  if (pageType !== category) tags.push(pageType);
  if (fileInfo.extension) tags.push(fileInfo.extension.replace('.', ''));
  if (contentLen.words > 1000) tags.push('long-read');
  else if (contentLen.words > 0) tags.push('short');
  if (url.toLowerCase().includes('/blog')) tags.push('blog');
  if (url.toLowerCase().includes('/news') || url.toLowerCase().includes('/article')) tags.push('news');
  return [...new Set(tags)];
}

function generateFilename(url, category) {
  try {
    const parsed = new URL(url);
    let name = parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname;
    name = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
    const extMap = { pdf: '.pdf', epub: '.epub', image: '.jpg', video: '.mp4', article: '.html', webpage: '.html' };
    return name + (extMap[category] || '.html');
  } catch {
    return 'content_' + Date.now() + '.html';
  }
}
