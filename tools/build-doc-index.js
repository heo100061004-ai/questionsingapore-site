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
    category: normalizeCategory(fileMeta.category || manifest.defaults.category || 'property'),
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

  const localManifest = readManifestAt(MANIFEST_PATH);
  const runtimeManifest = readManifestAt(RUNTIME_MANIFEST_PATH);

  const mergedManifest = {
    defaults: {
      ...(localManifest.defaults || {}),
      ...(runtimeManifest.defaults || {})
    },
    files: [...(runtimeManifest.files || []), ...(localManifest.files || [])]
  };

  const localFiles = fs.existsSync(RAW_DOC_DIR)
    ? fs
        .readdirSync(RAW_DOC_DIR)
        .filter((name) => !name.startsWith('.'))
        .filter((name) => name !== 'manifest.json' && name !== 'manifest.sample.json')
        .map((name) => ({ dir: RAW_DOC_DIR, fileName: name }))
    : [];

  const runtimeFiles = fs.existsSync(RUNTIME_RAW_DOC_DIR)
    ? fs
        .readdirSync(RUNTIME_RAW_DOC_DIR)
        .filter((name) => !name.startsWith('.'))
        .filter((name) => name !== 'manifest.json' && name !== 'manifest.sample.json')
        .map((name) => ({ dir: RUNTIME_RAW_DOC_DIR, fileName: name }))
    : [];

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

    const chunks = splitIntoChunks(text, 1200);
    chunks.forEach((chunk, idx) => {
      items.push({
        id: `doc-${path.basename(fileName, ext)}-${idx + 1}`,
        title: meta.title,
        file: fileName,
        category: meta.category,
        language: meta.language,
        source: meta.source,
        url: meta.url,
        keywords: meta.keywords,
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
