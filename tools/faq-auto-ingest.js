const fs = require('node:fs');
const path = require('node:path');
const { findDuplicate, nextFaqId } = require('./faq-kb-lib');
const {
  getRuntimeFaqPath,
  readJsonPreferRuntime,
  writeJsonWithRuntimeFallback
} = require('./runtime-kb-paths');

const ROOT_DIR = path.resolve(__dirname, '..');
const FAQ_BASE_PATH = path.join(ROOT_DIR, 'knowledge-base', 'faq');
const TMP_EVENT_PATH = path.join('/tmp', 'question-singapore-contact-events.json');

const DOMAIN_PREFIX = {
  employment: 'EMP',
  property: 'PRO',
  relocation: 'REL'
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

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
  if (lang === 'ko' || lang === 'en' || lang === 'zh') {
    return lang;
  }
  return 'en';
}

function toKeywords(question = '', answer = '') {
  const text = `${question} ${answer}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  return [...new Set(text)].slice(0, 12);
}

function toShortAnswer(answer = '') {
  const normalized = String(answer || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'No answer text was provided.';
  }
  if (normalized.length <= 220) {
    return normalized;
  }
  return `${normalized.slice(0, 217)}...`;
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function appendEventLog(event) {
  try {
    const existing = readJson(TMP_EVENT_PATH, []);
    const logs = Array.isArray(existing) ? existing : [];
    logs.unshift({ ...event, createdAt: nowIso() });
    writeJson(TMP_EVENT_PATH, logs.slice(0, 400));
  } catch (error) {
    // Ignore event log write failures in restricted runtime.
  }
}

function buildFaqFilePath(language, domain) {
  return path.join(FAQ_BASE_PATH, language, `${domain}.json`);
}

function upsertAnsweredKnowledge(payload) {
  const category = normalizeCategory(payload.category);
  const language = normalizeLanguage(payload.language);
  const question = String(payload.question || '').trim();
  const answer = String(payload.answer || '').trim();

  if (!question || !answer) {
    return { ok: false, reason: 'missing_question_or_answer' };
  }

  const filePath = buildFaqFilePath(language, category);
  const runtimePath = getRuntimeFaqPath(language, category);
  const faqData = readJsonPreferRuntime(filePath, runtimePath, { meta: {}, items: [] });
  const items = Array.isArray(faqData.items) ? faqData.items : [];

  const duplicate = findDuplicate(items, question, 0.82);
  if (duplicate) {
    return {
      ok: true,
      action: 'skipped-duplicate',
      duplicateType: duplicate.type,
      duplicateScore: Number(duplicate.score.toFixed(3)),
      id: duplicate.item && duplicate.item.id ? duplicate.item.id : null,
      language,
      category
    };
  }

  const prefix = DOMAIN_PREFIX[category] || 'PRO';
  const id = nextFaqId(items, prefix);
  const entry = {
    id,
    category,
    internalCategory: payload.internalCategory ? String(payload.internalCategory) : 'Contact Form Q&A',
    question,
    shortAnswer: toShortAnswer(answer),
    detailedAnswer: answer,
    thingsToNote: 'This entry was auto-captured from inquiry form and admin response. Validate against latest official guidance when needed.',
    relatedTopics: ['Contact Form', 'Admin Reply'],
    keywords: toKeywords(question, answer),
    language,
    updatedAt: today(),
    sourceType: 'auto_contact_qa',
    riskLevel: 'medium',
    sourceRefs: []
  };

  items.push(entry);
  faqData.items = items;

  faqData.meta = faqData.meta && typeof faqData.meta === 'object' ? faqData.meta : {};
  faqData.meta.entryCount = items.length;
  faqData.meta.version = today();
  faqData.meta.updatedAt = nowIso();

  const writeResult = writeJsonWithRuntimeFallback(filePath, runtimePath, faqData);

  return {
    ok: true,
    action: 'inserted',
    id,
    language,
    category,
    runtimeWrite: Boolean(writeResult.runtime)
  };
}

function ingestKnowledgeEvent(eventType, payload) {
  const safeType = String(eventType || '').trim();
  appendEventLog({
    type: safeType,
    category: normalizeCategory(payload && payload.category),
    language: normalizeLanguage(payload && payload.language),
    question: payload && payload.question ? String(payload.question).slice(0, 220) : '',
    hasAnswer: Boolean(payload && payload.answer)
  });

  if (safeType === 'answered') {
    return upsertAnsweredKnowledge(payload || {});
  }

  return {
    ok: true,
    action: 'logged-only'
  };
}

module.exports = {
  ingestKnowledgeEvent
};