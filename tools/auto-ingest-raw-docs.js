const fs = require('node:fs');
const path = require('node:path');
const { buildDocIndex } = require('./build-doc-index');
const { runDocSync } = require('./sync-doc-index-to-faq');

const ROOT_DIR = path.resolve(__dirname, '..');
const LOCAL_RAW_DOC_DIR = path.join(ROOT_DIR, 'knowledge-base', 'raw-docs');
const RUNTIME_RAW_DOC_DIR = path.join('/tmp', 'question-singapore-raw-docs');
const CATEGORY_ROOTS = {
  employment: path.join(LOCAL_RAW_DOC_DIR, 'employment'),
  property: path.join(LOCAL_RAW_DOC_DIR, 'property'),
  relocation: path.join(LOCAL_RAW_DOC_DIR, 'relocation')
};

const LOCAL_STATE_PATH = path.join(LOCAL_RAW_DOC_DIR, 'auto-ingest-state.json');
const RUNTIME_STATE_PATH = path.join('/tmp', 'question-singapore-auto-ingest-state.json');

const LOCAL_ARCHIVE_PATH = path.join(LOCAL_RAW_DOC_DIR, 'update-archive.json');
const RUNTIME_ARCHIVE_PATH = path.join('/tmp', 'question-singapore-update-archive.json');

const AUTO_SCAN_INTERVAL_MS = 45000;
const MAX_ARCHIVE_ITEMS = 600;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeJsonWithFallback(primaryPath, runtimePath, value) {
  try {
    writeJson(primaryPath, value);
    return primaryPath;
  } catch (error) {
    writeJson(runtimePath, value);
    return runtimePath;
  }
}

function ensureCategoryDirectories() {
  Object.values(CATEGORY_ROOTS).forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

function listRawDocFiles() {
  ensureCategoryDirectories();
  const collected = [];

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) {
      return;
    }

    fs.readdirSync(dir)
      .filter((name) => !name.startsWith('.'))
      .filter((name) => name !== 'manifest.json' && name !== 'manifest.sample.json')
      .filter((name) => name !== 'auto-ingest-state.json' && name !== 'update-archive.json')
      .forEach((name) => {
        const fullPath = path.join(dir, name);
        if (fs.statSync(fullPath).isDirectory()) {
          return;
        }
        collected.push({ dir, fileName: name });
      });
  };

  scanDir(LOCAL_RAW_DOC_DIR);
  Object.values(CATEGORY_ROOTS).forEach(scanDir);
  scanDir(RUNTIME_RAW_DOC_DIR);

  const mergedByName = new Map();
  collected.forEach((entry) => {
    mergedByName.set(entry.fileName, entry);
  });

  return Array.from(mergedByName.values()).map((entry) => {
    const fullPath = path.join(entry.dir, entry.fileName);
    const stat = fs.statSync(fullPath);
    return {
      file: entry.fileName,
      size: Number(stat.size || 0),
      mtimeMs: Number(stat.mtimeMs || 0),
      signature: `${Number(stat.size || 0)}:${Math.floor(Number(stat.mtimeMs || 0))}`
    };
  });
}

function loadState() {
  if (fs.existsSync(RUNTIME_STATE_PATH)) {
    return readJson(RUNTIME_STATE_PATH, { processed: {}, lastScanAt: 0 });
  }
  return readJson(LOCAL_STATE_PATH, { processed: {}, lastScanAt: 0 });
}

function saveState(state) {
  return writeJsonWithFallback(LOCAL_STATE_PATH, RUNTIME_STATE_PATH, state);
}

function loadArchive() {
  if (fs.existsSync(RUNTIME_ARCHIVE_PATH)) {
    return readJson(RUNTIME_ARCHIVE_PATH, { version: 1, updatedAt: '', entries: [] });
  }
  return readJson(LOCAL_ARCHIVE_PATH, { version: 1, updatedAt: '', entries: [] });
}

function appendArchive(entry) {
  const archive = loadArchive();
  const entries = Array.isArray(archive.entries) ? archive.entries : [];

  entries.unshift(entry);
  const trimmed = entries.slice(0, MAX_ARCHIVE_ITEMS);

  const next = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: trimmed
  };

  const target = writeJsonWithFallback(LOCAL_ARCHIVE_PATH, RUNTIME_ARCHIVE_PATH, next);
  return { target, total: trimmed.length };
}

function summarizeSyncResult(syncResult) {
  const inserted = Array.isArray(syncResult && syncResult.inserted) ? syncResult.inserted : [];
  const skipped = Array.isArray(syncResult && syncResult.skipped) ? syncResult.skipped : [];
  const localizedInserted = Array.isArray(syncResult && syncResult.localizedInserted) ? syncResult.localizedInserted : [];

  return {
    insertedCount: inserted.length,
    skippedCount: skipped.length,
    localizedCount: localizedInserted.length,
    inserted,
    skipped,
    localizedInserted
  };
}

function inferCategoryByFileName(fileName = '') {
  const name = String(fileName || '').toLowerCase();
  if (name.includes('property') || name.includes('housing') || name.includes('hdb') || name.includes('condo') || name.includes('rent') || name.includes('lease')) {
    return 'property';
  }
  if (name.includes('relocation') || name.includes('move') || name.includes('settle') || name.includes('school') || name.includes('transport')) {
    return 'relocation';
  }
  return 'employment';
}

function resolveCategoryFromFile(fileName = '') {
  const baseName = String(fileName || '').toLowerCase();
  const fromName = inferCategoryByFileName(baseName);
  const categoryDir = CATEGORY_ROOTS[fromName];
  if (categoryDir) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  return fromName;
}

async function maybeAutoIngestRawDocs(options = {}) {
  const force = Boolean(options.force);
  const trigger = String(options.trigger || 'system');
  const requestedFiles = Array.isArray(options.files)
    ? options.files.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const nowMs = Date.now();

  const state = loadState();
  const cooldownMs = Number.isFinite(Number(options.cooldownMs))
    ? Number(options.cooldownMs)
    : AUTO_SCAN_INTERVAL_MS;

  if (!force && nowMs - Number(state.lastScanAt || 0) < cooldownMs) {
    return {
      ok: true,
      ingested: false,
      reason: 'cooldown',
      scannedAt: new Date(nowMs).toISOString()
    };
  }

  const discovered = listRawDocFiles();
  const discoveredMap = new Map(discovered.map((item) => [item.file, item]));
  const candidates = requestedFiles.length
    ? requestedFiles.map((file) => discoveredMap.get(file)).filter(Boolean)
    : discovered;

  const changed = candidates.filter((item) => {
    const prev = state.processed && state.processed[item.file];
    return !prev || prev.signature !== item.signature;
  });

  if (!changed.length) {
    const nextState = {
      ...state,
      lastScanAt: nowMs
    };
    saveState(nextState);
    return {
      ok: true,
      ingested: false,
      reason: 'no-change',
      scannedAt: new Date(nowMs).toISOString()
    };
  }

  buildDocIndex();
  const changedNames = changed.map((item) => item.file);
  const syncResult = await runDocSync({
    files: changedNames,
    threshold: 0.72,
    dryRun: false,
    syncLocales: true
  });

  changedNames.forEach((fileName) => {
    const category = resolveCategoryFromFile(fileName);
    const sourceDir = CATEGORY_ROOTS[category] || LOCAL_RAW_DOC_DIR;
    const sourcePath = path.join(sourceDir, fileName);
    const currentPath = path.join(LOCAL_RAW_DOC_DIR, fileName);
    if (fs.existsSync(currentPath) && !fs.existsSync(sourcePath)) {
      fs.copyFileSync(currentPath, sourcePath);
      fs.rmSync(currentPath);
    }
  });

  const processed = {
    ...(state.processed || {})
  };

  changed.forEach((item) => {
    processed[item.file] = {
      signature: item.signature,
      processedAt: new Date().toISOString(),
      size: item.size
    };
  });

  const nextState = {
    processed,
    lastScanAt: nowMs,
    updatedAt: new Date().toISOString()
  };
  saveState(nextState);

  const summary = summarizeSyncResult(syncResult);
  const archiveEntry = {
    id: `doc-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    trigger,
    files: changedNames,
    fileCount: changedNames.length,
    insertedCount: summary.insertedCount,
    skippedCount: summary.skippedCount,
    localizedCount: summary.localizedCount,
    inserted: summary.inserted,
    skipped: summary.skipped
  };
  const archiveWrite = appendArchive(archiveEntry);

  return {
    ok: true,
    ingested: true,
    trigger,
    files: changedNames,
    fileCount: changedNames.length,
    summary,
    archive: {
      path: archiveWrite.target,
      total: archiveWrite.total
    },
    scannedAt: new Date(nowMs).toISOString()
  };
}

function getDocUpdateArchive(limit = 120) {
  const archive = loadArchive();
  const all = Array.isArray(archive.entries) ? archive.entries : [];
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 120;

  return {
    ok: true,
    updatedAt: archive.updatedAt || '',
    total: all.length,
    count: Math.min(all.length, safeLimit),
    items: all.slice(0, safeLimit)
  };
}

module.exports = {
  maybeAutoIngestRawDocs,
  getDocUpdateArchive
};
