#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { findDuplicate, nextFaqId } = require('./faq-kb-lib');
const { buildDocIndex } = require('./build-doc-index');
const {
  getRuntimeDocIndexPath,
  getRuntimeFaqPath,
  readJsonPreferRuntime,
  writeJsonWithRuntimeFallback
} = require('./runtime-kb-paths');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOC_INDEX_PATH = path.join(ROOT_DIR, 'knowledge-base', 'doc-index.json');
const DOC_INDEX_RUNTIME_PATH = getRuntimeDocIndexPath();
const FAQ_BASE_PATH = path.join(ROOT_DIR, 'knowledge-base', 'faq');
const SOURCE_REGISTRY_PATH = path.join(ROOT_DIR, 'knowledge-base', 'sources', 'source-registry.json');

const DOMAIN_CONFIG = {
  employment: { prefix: 'EMP' },
  property: { prefix: 'PRO' },
  relocation: { prefix: 'REL' }
};

const LOCALES = ['ko', 'zh'];

function today() {
  return new Date().toISOString().slice(0, 10);
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

function toSafeKeywordList(rawKeywords, title) {
  const base = Array.isArray(rawKeywords) ? rawKeywords : [];
  const fromTitle = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .slice(0, 4);

  return [...new Set([...base.map((item) => String(item).trim()), ...fromTitle])].filter(Boolean).slice(0, 8);
}

function firstSentence(text = '') {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const parts = normalized.split(/(?<=[.!?])\s+/);
  if (!parts.length) {
    return normalized.slice(0, 220);
  }

  return parts[0].slice(0, 220);
}

function shorten(text = '', maxLen = 900) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) {
    return normalized;
  }
  return `${normalized.slice(0, maxLen - 3)}...`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJsonWithFallback(primaryPath, runtimePath, fallbackValue) {
  return readJsonPreferRuntime(primaryPath, runtimePath, fallbackValue);
}

function loadSourceRefMap() {
  try {
    if (!fs.existsSync(SOURCE_REGISTRY_PATH)) {
      return new Map();
    }

    const parsed = readJson(SOURCE_REGISTRY_PATH);
    const map = new Map();
    const sources = Array.isArray(parsed && parsed.sources) ? parsed.sources : [];

    for (const item of sources) {
      if (!item || !item.id || !item.url) {
        continue;
      }
      map.set(String(item.url), String(item.id));
    }

    return map;
  } catch (error) {
    return new Map();
  }
}

function loadFaq(domain) {
  const dataByLang = {};
  const pathByLang = {};
  const runtimePathByLang = {};

  ['en', ...LOCALES].forEach((lang) => {
    const filePath = path.join(FAQ_BASE_PATH, lang, `${domain}.json`);
    const runtimePath = getRuntimeFaqPath(lang, domain);
    pathByLang[lang] = filePath;
    runtimePathByLang[lang] = runtimePath;
    dataByLang[lang] = readJsonWithFallback(filePath, runtimePath, { meta: {}, items: [] });
  });

  return { pathByLang, runtimePathByLang, dataByLang };
}

function inferQuestion(item) {
  const category = normalizeCategory(item.category);
  const title = String(item.title || '').trim() || 'this document';

  if (category === 'employment') {
    return `What should I know about ${title} for recruitment and employment in Singapore?`;
  }
  if (category === 'property') {
    return `What are the key property and housing points from ${title} in Singapore?`;
  }
  if (category === 'relocation') {
    return `What are the key relocation and first-settlement points from ${title} in Singapore?`;
  }
  return `What are the key recruitment and employment points from ${title} in Singapore?`;
}

function buildFaqEntry(id, domain, item, sourceRefMap) {
  const url = String(item.url || '').trim();
  const sourceId = sourceRefMap.get(url);
  const sourceRefs = sourceId ? [sourceId] : [];
  const content = shorten(item.text || '');
  const summary = firstSentence(content);

  return {
    id,
    category: domain,
    internalCategory: String(item.title || item.file || 'Document Ingestion'),
    question: inferQuestion(item),
    shortAnswer: summary || 'Key information extracted from uploaded source document.',
    detailedAnswer: content || 'No detailed text was extracted from this document chunk.',
    thingsToNote: 'This entry was auto-generated from uploaded document content. Verify with official source when required.',
    relatedTopics: [String(item.source || 'Uploaded Document')],
    keywords: toSafeKeywordList(item.keywords, item.title),
    language: 'en',
    updatedAt: today(),
    sourceType: 'auto_doc_ingestion',
    riskLevel: 'medium',
    sourceRefs
  };
}

function parseArgs(argv) {
  const args = {
    threshold: 0.72,
    dryRun: false,
    syncLocales: true,
    files: []
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--threshold') {
      args.threshold = Number(argv[i + 1] || '0.72');
      i += 1;
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--no-locale-sync') {
      args.syncLocales = false;
    } else if (token === '--files') {
      args.files = String(argv[i + 1] || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      i += 1;
    }
  }

  return args;
}

function translateInstruction(language) {
  if (language === 'ko') {
    return 'Translate all text values to Korean.';
  }
  if (language === 'zh') {
    return 'Translate all text values to Simplified Chinese.';
  }
  return 'Keep text in English.';
}

async function translateFields(fields, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || language === 'en') {
    return fields;
  }

  const prompt = [
    'Translate the JSON values while preserving keys.',
    translateInstruction(language),
    'Return JSON only. Do not add commentary.',
    JSON.stringify(fields)
  ].join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a strict JSON translation engine.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      return fields;
    }

    const data = await response.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message
      ? String(data.choices[0].message.content || '').trim()
      : '';

    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return fields;
    }

    return {
      ...fields,
      ...parsed
    };
  } catch (error) {
    return fields;
  }
}

async function localizeEntry(baseEntry, language) {
  const translated = await translateFields({
    internalCategory: baseEntry.internalCategory,
    question: baseEntry.question,
    shortAnswer: baseEntry.shortAnswer,
    detailedAnswer: baseEntry.detailedAnswer,
    thingsToNote: baseEntry.thingsToNote,
    relatedTopics: baseEntry.relatedTopics,
    keywords: baseEntry.keywords
  }, language);

  return {
    ...baseEntry,
    internalCategory: String(translated.internalCategory || baseEntry.internalCategory),
    question: String(translated.question || baseEntry.question),
    shortAnswer: String(translated.shortAnswer || baseEntry.shortAnswer),
    detailedAnswer: String(translated.detailedAnswer || baseEntry.detailedAnswer),
    thingsToNote: String(translated.thingsToNote || baseEntry.thingsToNote),
    relatedTopics: Array.isArray(translated.relatedTopics) ? translated.relatedTopics : baseEntry.relatedTopics,
    keywords: Array.isArray(translated.keywords) ? translated.keywords : baseEntry.keywords,
    language,
    sourceType: 'auto_doc_ingestion_localized'
  };
}

async function runDocSync(options = {}) {
  const args = {
    threshold: Number.isFinite(Number(options.threshold)) ? Number(options.threshold) : 0.72,
    dryRun: Boolean(options.dryRun),
    syncLocales: options.syncLocales === undefined ? true : Boolean(options.syncLocales),
    files: Array.isArray(options.files)
      ? options.files.map((item) => String(item || '').trim()).filter(Boolean)
      : []
  };

  buildDocIndex();

  if (!fs.existsSync(DOC_INDEX_PATH) && !fs.existsSync(DOC_INDEX_RUNTIME_PATH)) {
    throw new Error('doc-index.json not found. Run build-doc-index first.');
  }

  const index = readJsonWithFallback(DOC_INDEX_PATH, DOC_INDEX_RUNTIME_PATH, { items: [] });
  const items = Array.isArray(index && index.items) ? index.items : [];

  const groupedByDomain = {
    employment: [],
    property: [],
    relocation: []
  };

  const fileAllowSet = new Set(args.files);

  for (const item of items) {
    if (fileAllowSet.size && !fileAllowSet.has(String(item.file || ''))) {
      continue;
    }
    const domain = normalizeCategory(item && item.category ? item.category : '');
    groupedByDomain[domain].push(item);
  }

  const sourceRefMap = loadSourceRefMap();
  const summary = {
    inserted: [],
    skipped: [],
    localizedInserted: [],
    dryRun: args.dryRun,
    syncLocales: args.syncLocales
  };

  for (const domain of Object.keys(DOMAIN_CONFIG)) {
    const docs = groupedByDomain[domain];
    if (!docs.length) {
      continue;
    }

    const { pathByLang, runtimePathByLang, dataByLang } = loadFaq(domain);
    const enData = dataByLang.en;
    const prefix = DOMAIN_CONFIG[domain].prefix;

    for (const docItem of docs) {
      const question = inferQuestion(docItem);
      const duplicate = findDuplicate(enData.items, question, args.threshold);

      if (duplicate) {
        summary.skipped.push({
          domain,
          reason: duplicate.type,
          score: Number(duplicate.score.toFixed(3)),
          file: docItem.file,
          question
        });
        continue;
      }

      const id = nextFaqId(enData.items, prefix);
      const entry = buildFaqEntry(id, domain, docItem, sourceRefMap);
      enData.items.push(entry);

      summary.inserted.push({
        id,
        domain,
        file: docItem.file,
        question: entry.question
      });

      if (args.syncLocales) {
        for (const locale of LOCALES) {
          const localeData = dataByLang[locale];
          if (!localeData || !Array.isArray(localeData.items)) {
            continue;
          }

          const already = localeData.items.some((item) => item && String(item.id) === id);
          if (already) {
            continue;
          }

          const localizedEntry = await localizeEntry(entry, locale);
          localeData.items.push(localizedEntry);
          summary.localizedInserted.push({
            id,
            domain,
            language: locale,
            file: docItem.file
          });
        }
      }
    }

    Object.entries(dataByLang).forEach(([lang, faqData]) => {
      if (!faqData || !faqData.meta || !Array.isArray(faqData.items)) {
        return;
      }
      faqData.meta.entryCount = faqData.items.length;
      faqData.meta.version = today();

      if (!args.dryRun) {
        writeJsonWithRuntimeFallback(pathByLang[lang], runtimePathByLang[lang], faqData);
      }
    });
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv);
  try {
    const summary = await runDocSync(args);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error && error.message ? error.message : 'Doc sync failed.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runDocSync
};
