const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const {
  getRuntimeDocIndexPath,
  writeJsonWithRuntimeFallback
} = require('./runtime-kb-paths');

const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_DOC_DIR = path.join(ROOT_DIR, 'knowledge-base', 'raw-docs');
const CATEGORY_RAW_DOC_DIRS = {
  employment: path.join(RAW_DOC_DIR, 'employment'),
  property: path.join(RAW_DOC_DIR, 'property'),
  relocation: path.join(RAW_DOC_DIR, 'relocation')
};
const MANIFEST_PATH = path.join(RAW_DOC_DIR, 'manifest.json');
const RUNTIME_RAW_DOC_DIR = path.join('/tmp', 'question-singapore-raw-docs');
const RUNTIME_MANIFEST_PATH = path.join(RUNTIME_RAW_DOC_DIR, 'manifest.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'knowledge-base', 'doc-index.json');
const RUNTIME_OUTPUT_PATH = getRuntimeDocIndexPath();

const SUPPORTED_EXTENSIONS = new Set([
  '.txt',
  '.text',
  '.md',
  '.json',
  '.pdf',
  '.docx',
  '.doc',
  '.rtf',
  '.html',
  '.htm',
  '.csv',
  '.tsv',
  '.xml',
  '.yaml',
  '.yml',
  '.log'
]);

const CATEGORY_HINTS = {
  employment: ['employment', 'recruitment', 'ep', 'work pass', 's pass', 'mom', 'job', 'hiring', 'career', '취업', '채용', '고용', '就业'],
  property: ['property', 'housing', 'hdb', 'condo', 'tenancy', 'rent', 'lease', 'ura', '집', '주거', '임대', '부동산', '房地产'],
  relocation: ['relocation', 'move', 'settle', 'settlement', 'school', 'bank', 'transport', '정착', '이사', '리로케이션', '搬迁']
};

const KEYWORD_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were', 'will', 'can', 'into', 'about', 'have', 'has', 'had',
  'you', 'your', 'our', 'but', 'not', 'its', 'their', 'they', 'them', 'may', 'should', 'must', 'after', 'before', 'when', 'where',
  'what', 'which', 'who', 'how', 'also', 'than', 'then', 'more', 'less', 'very', 'http', 'https', 'www', 'com', 'org', 'net',
  '및', '또는', '그리고', '에서', '으로', '합니다', '있는', '대한', '관련', '수', '등', 'the', 'of', 'to', 'in', 'on', 'at', 'by'
]);

function normalizeCategory(value = '') {
  const category = String(value || '').toLowerCase();
  if (category.includes('recruitment') || category.includes('채용') || category.includes('employment') || category.includes('고용') || category.includes('就业')) {
    return 'employment';
  }
  if (category.includes('property') || category.includes('부동산') || category.includes('房地产')) {
    return 'property';
  }
  if (category.includes('relocation') || category.includes('리로케이션') || category.includes('搬迁')) {
    return 'relocation';
  }
  return 'employment';
}

function normalizeLanguage(value = '') {
  const lang = String(value || '').toLowerCase();
  if (lang === 'ko' || lang === 'en' || lang === 'zh' || lang === 'multi') {
    return lang;
  }
  return 'en';
}

function splitIntoChunks(text, maxLen = 1200) {
  const normalized = String(text || '').replace(/\r/g, '').trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';

  for (const paragraph of paragraphs) {
    if (!buffer) {
      buffer = paragraph;
      continue;
    }

    if (`${buffer}\n\n${paragraph}`.length <= maxLen) {
      buffer = `${buffer}\n\n${paragraph}`;
      continue;
    }

    chunks.push(buffer);
    buffer = paragraph;
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks;
}

function detectFirstUrl(text = '') {
  const match = String(text || '').match(/https?:\/\/[^\s)\]}>"']+/i);
  return match ? String(match[0]).trim() : '';
}

function inferSourceName(url, fallback = 'Uploaded Document') {
  const value = String(url || '').trim();
  if (!value) {
    return fallback;
  }

  try {
    const parsed = new URL(value);
    const host = String(parsed.hostname || '').replace(/^www\./i, '');
    return host || fallback;
  } catch (error) {
    return fallback;
  }
}

function scoreCategorySignals(text = '', hints = []) {
  const source = String(text || '').toLowerCase();
  return hints.reduce((sum, hint) => {
    if (!hint) {
      return sum;
    }
    const normalizedHint = String(hint).toLowerCase();
    return source.includes(normalizedHint) ? sum + 1 : sum;
  }, 0);
}

function inferCategoryFromContent(fileName = '', text = '', fallback = 'employment') {
  const source = `${String(fileName || '')}\n${String(text || '').slice(0, 5000)}`;
  const scores = Object.entries(CATEGORY_HINTS)
    .map(([category, hints]) => ({
      category,
      score: scoreCategorySignals(source, hints)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scores[0];
  if (!best || best.score <= 0) {
    return normalizeCategory(fallback);
  }
  return normalizeCategory(best.category);
}

function inferKeywords(text = '', title = '', maxKeywords = 8) {
  const combined = `${String(title || '')} ${String(text || '').slice(0, 6000)}`.toLowerCase();
  const tokens = combined
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .filter((token) => !KEYWORD_STOPWORDS.has(token));

  const counts = new Map();
  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([token]) => token);
}

function enrichMeta(meta, fileName, text) {
  const safeMeta = meta || {};
  const title = String(safeMeta.title || fileName || 'Untitled').trim();
  const language = normalizeLanguage(safeMeta.language || 'en');
  const detectedUrl = detectFirstUrl(text);
  const url = String(safeMeta.url || detectedUrl || '').trim();
  const source = String(safeMeta.source || inferSourceName(url) || 'Uploaded Document').trim();
  const category = inferCategoryFromContent(fileName, text, safeMeta.category || 'employment');

  const providedKeywords = Array.isArray(safeMeta.keywords)
    ? safeMeta.keywords.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const autoKeywords = inferKeywords(text, title, 8);
  const keywords = [...new Set([...providedKeywords, ...autoKeywords])].slice(0, 10);

  return {
    title,
    language,
    category,
    source,
    url,
    keywords
  };
}

function readManifestAt(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return { defaults: {}, files: [] };
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      defaults: parsed && parsed.defaults ? parsed.defaults : {},
      files: Array.isArray(parsed && parsed.files) ? parsed.files : []
    };
  } catch (error) {
    return { defaults: {}, files: [] };
  }
}

function findMeta(manifest, fileName) {
  const fileMeta = (manifest.files || []).find((item) => item && item.file === fileName) || {};
  return {
    title: fileMeta.title || fileName,
    language: normalizeLanguage(fileMeta.language || manifest.defaults.language || 'en'),
    category: normalizeCategory(fileMeta.category || manifest.defaults.category || 'employment'),
    source: String(fileMeta.source || manifest.defaults.source || 'Uploaded Document'),
    url: String(fileMeta.url || manifest.defaults.url || ''),
    keywords: Array.isArray(fileMeta.keywords) ? fileMeta.keywords.map((item) => String(item)) : []
  };
}

function extractPdfText(filePath) {
  const result = spawnSync('pdftotext', ['-layout', '-nopgbrk', filePath, '-'], {
    encoding: 'utf8'
  });

  if (result.error || result.status !== 0) {
    return '';
  }

  return String(result.stdout || '').trim();
}

function commandExists(name) {
  const result = spawnSync('which', [name], { encoding: 'utf8' });
  return !result.error && result.status === 0;
}

function extractPdfTextWithOcr(filePath) {
  if (!commandExists('pdftoppm') || !commandExists('tesseract')) {
    return '';
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-doc-ocr-'));
  try {
    const pngPrefix = path.join(tempDir, 'page');
    const render = spawnSync('pdftoppm', ['-png', filePath, pngPrefix], { encoding: 'utf8' });
    if (render.error || render.status !== 0) {
      return '';
    }

    const images = fs
      .readdirSync(tempDir)
      .filter((name) => name.endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, 'en'));

    if (!images.length) {
      return '';
    }

    const chunks = [];
    for (const image of images) {
      const imagePath = path.join(tempDir, image);
      const ocr = spawnSync('tesseract', [imagePath, 'stdout', '-l', 'eng+kor+chi_sim'], {
        encoding: 'utf8'
      });
      if (ocr.error || ocr.status !== 0) {
        continue;
      }
      const text = String(ocr.stdout || '').trim();
      if (text) {
        chunks.push(text);
      }
    }

    return chunks.join('\n\n').trim();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // Use macOS textutil for office-rich formats.
  if (ext === '.docx' || ext === '.doc' || ext === '.rtf' || ext === '.html' || ext === '.htm') {
    const result = spawnSync('textutil', ['-convert', 'txt', '-stdout', filePath], {
      encoding: 'utf8'
    });

    if (result.error || result.status !== 0) {
      return '';
    }

    return String(result.stdout || '').trim();
  }

  const raw = fs.readFileSync(filePath, 'utf8');

  if (ext === '.json') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.content === 'string') {
          return parsed.content;
        }
        if (typeof parsed.text === 'string') {
          return parsed.text;
        }
      }
    } catch (error) {
      // Continue with plain text fallback.
    }
  }

  return raw;
}

function buildDocIndex() {
  if (!fs.existsSync(RAW_DOC_DIR) && !fs.existsSync(RUNTIME_RAW_DOC_DIR)) {
    console.log('No raw-docs directory found.');
    return;
  }

  Object.values(CATEGORY_RAW_DOC_DIRS).forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });

  const localManifest = readManifestAt(MANIFEST_PATH);
  const runtimeManifest = readManifestAt(RUNTIME_MANIFEST_PATH);

  const mergedManifest = {
    defaults: {
      ...(localManifest.defaults || {}),
      ...(runtimeManifest.defaults || {})
    },
    files: [...(runtimeManifest.files || []), ...(localManifest.files || [])]
  };

  const localFiles = [];
  const scanDirectory = (dir, baseDir = dir) => {
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.readdirSync(dir)
      .filter((name) => !name.startsWith('.'))
      .filter((name) => name !== 'manifest.json' && name !== 'manifest.sample.json')
      .forEach((name) => {
        const fullPath = path.join(dir, name);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath, baseDir);
          return;
        }
        localFiles.push({ dir: baseDir, fileName: name });
      });
  };

  scanDirectory(RAW_DOC_DIR);
  Object.values(CATEGORY_RAW_DOC_DIRS).forEach((dir) => scanDirectory(dir));

  const runtimeFiles = [];
  const scanRuntimeDirectory = (dir, baseDir = dir) => {
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.readdirSync(dir)
      .filter((name) => !name.startsWith('.'))
      .filter((name) => name !== 'manifest.json' && name !== 'manifest.sample.json')
      .forEach((name) => {
        const fullPath = path.join(dir, name);
        if (fs.statSync(fullPath).isDirectory()) {
          scanRuntimeDirectory(fullPath, baseDir);
          return;
        }
        runtimeFiles.push({ dir: baseDir, fileName: name });
      });
  };

  scanRuntimeDirectory(RUNTIME_RAW_DOC_DIR);

  // Runtime uploads should override same filename from local directory.
  const mergedByName = new Map();
  [...localFiles, ...runtimeFiles].forEach((item) => {
    mergedByName.set(item.fileName, item);
  });
  const files = Array.from(mergedByName.values());

  const items = [];
  const warnings = [];

  for (const fileEntry of files) {
    const fileName = fileEntry.fileName;
    const ext = path.extname(fileName).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      continue;
    }

    const fullPath = path.join(fileEntry.dir, fileName);
    const meta = findMeta(mergedManifest, fileName);

    let text = '';
    if (ext === '.pdf') {
      let usedOcr = false;
      text = extractPdfText(fullPath);
      if (!text) {
        text = extractPdfTextWithOcr(fullPath);
        usedOcr = Boolean(text);
      }
      if (!text) {
        warnings.push(`Skip ${fileName}: PDF extraction failed. Install pdftotext (poppler), or pdftoppm+tesseract for OCR.`);
        continue;
      }
      if (usedOcr) {
        warnings.push(`OCR used for ${fileName} (scanned PDF).`);
      }
    } else {
      try {
        text = extractText(fullPath);
      } catch (error) {
        warnings.push(`Skip ${fileName}: failed to read text.`);
        continue;
      }
    }

    const enrichedMeta = enrichMeta(meta, fileName, text);
    const chunks = splitIntoChunks(text, 1200);
    chunks.forEach((chunk, idx) => {
      items.push({
        id: `doc-${path.basename(fileName, ext)}-${idx + 1}`,
        title: enrichedMeta.title,
        file: fileName,
        category: enrichedMeta.category,
        language: enrichedMeta.language,
        source: enrichedMeta.source,
        url: enrichedMeta.url,
        keywords: enrichedMeta.keywords,
        text: chunk,
        chunkIndex: idx + 1
      });
    });
  }

  const output = {
    version: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    count: items.length,
    items
  };

  const writeResult = writeJsonWithRuntimeFallback(OUTPUT_PATH, RUNTIME_OUTPUT_PATH, output);

  console.log(`Built doc index: ${items.length} chunks -> ${writeResult.target}`);
  warnings.forEach((msg) => console.warn(msg));

  return {
    ...output,
    outputPath: writeResult.target,
    runtimeWrite: Boolean(writeResult.runtime)
  };
}

if (require.main === module) {
  buildDocIndex();
}

module.exports = {
  buildDocIndex
};
