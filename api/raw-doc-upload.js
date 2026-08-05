const fs = require('node:fs');
const path = require('node:path');
const { maybeAutoIngestRawDocs } = require('../tools/auto-ingest-raw-docs');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOCAL_RAW_DOC_DIR = path.join(ROOT_DIR, 'knowledge-base', 'raw-docs');
const CATEGORY_DIRS = {
  employment: path.join(LOCAL_RAW_DOC_DIR, 'employment'),
  property: path.join(LOCAL_RAW_DOC_DIR, 'property'),
  relocation: path.join(LOCAL_RAW_DOC_DIR, 'relocation')
};
const RUNTIME_RAW_DOC_DIR = path.join('/tmp', 'question-singapore-raw-docs');
const RUNTIME_CATEGORY_DIRS = {
  employment: path.join(RUNTIME_RAW_DOC_DIR, 'employment'),
  property: path.join(RUNTIME_RAW_DOC_DIR, 'property'),
  relocation: path.join(RUNTIME_RAW_DOC_DIR, 'relocation')
};
const RUNTIME_MANIFEST_PATH = path.join(RUNTIME_RAW_DOC_DIR, 'manifest.json');

function isAuthorized(req) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return true;
  }

  const incoming = (req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token'])) || '';
  return String(incoming) === String(token);
}

function normalizeLanguage(value) {
  const lang = String(value || '').toLowerCase();
  if (lang === 'ko' || lang === 'en' || lang === 'zh' || lang === 'multi') {
    return lang;
  }
  return 'en';
}

function normalizeCategory(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('employment') || text.includes('recruitment') || text.includes('고용')) {
    return 'employment';
  }
  if (text.includes('property') || text.includes('부동산')) {
    return 'property';
  }
  if (text.includes('relocation') || text.includes('리로케이션')) {
    return 'relocation';
  }
  return 'employment';
}

function sanitizeFileName(fileName) {
  const base = path.basename(String(fileName || 'upload.bin'));
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function resolveCategoryDirectory(category) {
  const normalized = normalizeCategory(category);
  return {
    category: normalized,
    localDir: CATEGORY_DIRS[normalized],
    runtimeDir: RUNTIME_CATEGORY_DIRS[normalized]
  };
}

function writeFileToPreferredDirectory(filePath, buffer, runtimePath) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (error) {
    fs.mkdirSync(path.dirname(runtimePath), { recursive: true });
    fs.writeFileSync(runtimePath, buffer);
    return runtimePath;
  }
}

function upsertManifest(files) {
  const current = readJson(RUNTIME_MANIFEST_PATH, { defaults: {}, files: [] });
  const defaults = current && current.defaults ? current.defaults : {};
  const list = Array.isArray(current && current.files) ? current.files : [];

  for (const file of files) {
    const idx = list.findIndex((item) => item && item.file === file.file);
    if (idx >= 0) {
      list[idx] = file;
    } else {
      list.push(file);
    }
  }

  writeJson(RUNTIME_MANIFEST_PATH, {
    defaults,
    files: list
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  const body = req.body || {};
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) {
    res.status(400).json({ ok: false, message: 'files is required' });
    return;
  }

  fs.mkdirSync(RUNTIME_RAW_DOC_DIR, { recursive: true });

  const manifestEntries = [];
  let savedCount = 0;
  const targetFolders = new Set();

  try {
    for (const file of files) {
      const safeName = sanitizeFileName(file.fileName || 'upload.bin');
      const contentBase64 = String(file.contentBase64 || '');
      if (!contentBase64) {
        continue;
      }

      const buffer = Buffer.from(contentBase64, 'base64');
      const { category, localDir, runtimeDir } = resolveCategoryDirectory(file.category);
      const fullPath = writeFileToPreferredDirectory(
        path.join(localDir, safeName),
        buffer,
        path.join(runtimeDir, safeName)
      );
      savedCount += 1;
      targetFolders.add(path.dirname(fullPath));

      manifestEntries.push({
        file: safeName,
        title: String(file.title || safeName),
        language: normalizeLanguage(file.language),
        category,
        source: String(file.source || 'Uploaded via Admin'),
        url: String(file.url || ''),
        savedPath: fullPath,
        keywords: Array.isArray(file.keywords)
          ? file.keywords.map((item) => String(item).trim()).filter(Boolean)
          : []
      });
    }

    upsertManifest(manifestEntries);

    let autoIngest = null;
    try {
      autoIngest = await maybeAutoIngestRawDocs({
        force: true,
        trigger: 'admin-upload',
        files: manifestEntries.map((item) => item.file)
      });
    } catch (autoError) {
      autoIngest = {
        ok: false,
        message: autoError && autoError.message ? autoError.message : 'auto-ingest failed'
      };
    }

    res.status(200).json({
      ok: true,
      savedCount,
      targetFolders: Array.from(targetFolders),
      autoIngest,
      runtimeRawDocsPath: RUNTIME_RAW_DOC_DIR,
      warning: process.env.ADMIN_API_TOKEN ? null : 'ADMIN_API_TOKEN is not set. Configure token for production safety.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error && error.message ? error.message : 'upload failed' });
  }
};
