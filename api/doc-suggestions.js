const fs = require('node:fs');
const path = require('node:path');
const { findDuplicate } = require('../tools/faq-kb-lib');
const {
  getRuntimeDocIndexPath,
  getRuntimeFaqPath,
  readJsonPreferRuntime
} = require('../tools/runtime-kb-paths');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOC_INDEX_PATH = path.join(ROOT_DIR, 'knowledge-base', 'doc-index.json');
const DOC_INDEX_RUNTIME_PATH = getRuntimeDocIndexPath();
const FAQ_BASE_PATH = path.join(ROOT_DIR, 'knowledge-base', 'faq', 'en');

const DOMAINS = ['employment', 'property', 'relocation'];

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

function inferQuestion(item) {
  const category = normalizeCategory(item && item.category ? item.category : '');
  const title = String(item && item.title ? item.title : '').trim() || 'this document';

  if (category === 'employment') {
    return `What should I know about ${title} for employment in Singapore?`;
  }
  if (category === 'property') {
    return `What are the key property and housing points from ${title} in Singapore?`;
  }
  if (category === 'relocation') {
    return `What are the key relocation and first-settlement points from ${title} in Singapore?`;
  }
  return `What are the key recruitment and employment points from ${title} in Singapore?`;
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function loadFaqMap() {
  const map = {
    employment: [],
    property: []
  };

  for (const domain of DOMAINS) {
    const filePath = path.join(FAQ_BASE_PATH, `${domain}.json`);
    const runtimePath = getRuntimeFaqPath('en', domain);
    const parsed = readJsonPreferRuntime(filePath, runtimePath, { items: [] });
    map[domain] = Array.isArray(parsed && parsed.items) ? parsed.items : [];
  }

  return map;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const threshold = req.query && req.query.threshold ? Number(req.query.threshold) : 0.72;
  const limit = req.query && req.query.limit ? Number(req.query.limit) : 200;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 1000) : 200;

  const index = readJsonPreferRuntime(DOC_INDEX_PATH, DOC_INDEX_RUNTIME_PATH, { items: [] });
  const items = Array.isArray(index && index.items) ? index.items : [];
  const faqMap = loadFaqMap();

  const suggestions = [];

  for (const item of items) {
    const domain = normalizeCategory(item && item.category ? item.category : '');
    const question = inferQuestion(item);
    const duplicate = findDuplicate(faqMap[domain], question, threshold);

    suggestions.push({
      id: `${domain}:${item.file || 'unknown'}:${item.chunkIndex || 0}`,
      domain,
      file: item.file || '',
      title: item.title || '',
      chunkIndex: item.chunkIndex || 0,
      question,
      source: item.source || '',
      url: item.url || '',
      duplicate: Boolean(duplicate),
      duplicateType: duplicate ? duplicate.type : null,
      duplicateScore: duplicate ? Number(duplicate.score.toFixed(3)) : null
    });
  }

  const pending = suggestions.filter((item) => !item.duplicate);

  res.status(200).json({
    ok: true,
    threshold,
    count: suggestions.length,
    pendingCount: pending.length,
    items: suggestions.slice(0, safeLimit)
  });
};
