#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {
  findDuplicate,
  nextFaqId
} = require('./faq-kb-lib');

const ROOT_DIR = path.resolve(__dirname, '..');

const DOMAIN_CONFIG = {
  employment: { prefix: 'EMP' },
  property: { prefix: 'PRO' }
};

const LANGUAGE_TO_FILENAME = {
  en: 'en',
  ko: 'ko',
  zh: 'zh'
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function usage() {
  console.log('Usage: node tools/faq-add-from-llm.js --input <payload.json>');
}

function parseArgs(argv) {
  const args = { input: '' };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--input') {
      args.input = argv[i + 1] || '';
      i += 1;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getDomainFilePath(language, domain) {
  const langDir = LANGUAGE_TO_FILENAME[language];
  return path.join(ROOT_DIR, 'knowledge-base', 'faq', langDir, `${domain}.json`);
}

function requireText(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required text field: ${name}`);
  }
  return String(value).trim();
}

function toList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildEntry(id, language, domain, block, fallbackBlock = null) {
  const source = block || fallbackBlock || {};
  return {
    id,
    category: domain,
    internalCategory: requireText('internalCategory', source.internalCategory || 'General'),
    question: requireText('question', source.question),
    shortAnswer: requireText('shortAnswer', source.shortAnswer),
    detailedAnswer: requireText('detailedAnswer', source.detailedAnswer),
    thingsToNote: requireText('thingsToNote', source.thingsToNote),
    relatedTopics: toList(source.relatedTopics),
    keywords: toList(source.keywords),
    language,
    updatedAt: today(),
    sourceType: 'approved_suggestion',
    riskLevel: source.riskLevel || 'medium',
    sourceRefs: toList(source.sourceRefs)
  };
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a JSON object.');
  }

  const rawDomain = String(payload.domain || '').trim().toLowerCase();
  const domain = rawDomain === 'recruitment' ? 'employment' : rawDomain;
  if (!DOMAIN_CONFIG[domain]) {
    throw new Error('domain must be one of: recruitment, employment, property');
  }

  if (!payload.english || typeof payload.english !== 'object') {
    throw new Error('english block is required.');
  }

  return domain;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    usage();
    process.exit(1);
  }

  const inputPath = path.resolve(ROOT_DIR, args.input);
  const payload = readJson(inputPath);
  const domain = validatePayload(payload);
  const prefix = DOMAIN_CONFIG[domain].prefix;

  const enPath = getDomainFilePath('en', domain);
  const koPath = getDomainFilePath('ko', domain);
  const zhPath = getDomainFilePath('zh', domain);

  const enData = readJson(enPath);
  const koData = readJson(koPath);
  const zhData = readJson(zhPath);

  const incomingQuestion = requireText('english.question', payload.english.question);
  const duplicate = findDuplicate(enData.items, incomingQuestion);

  if (duplicate) {
    console.log(JSON.stringify({
      status: 'duplicate',
      duplicateType: duplicate.type,
      score: duplicate.score,
      id: duplicate.item.id,
      question: duplicate.item.question
    }, null, 2));
    return;
  }

  const id = nextFaqId(enData.items, prefix);

  const enEntry = buildEntry(id, 'en', domain, payload.english);
  const koEntry = buildEntry(id, 'ko', domain, payload.korean, payload.english);
  const zhEntry = buildEntry(id, 'zh', domain, payload.chinese, payload.english);

  enData.items.push(enEntry);
  koData.items.push(koEntry);
  zhData.items.push(zhEntry);

  enData.meta.entryCount = enData.items.length;
  koData.meta.entryCount = koData.items.length;
  zhData.meta.entryCount = zhData.items.length;
  enData.meta.version = today();
  koData.meta.version = today();
  zhData.meta.version = today();

  writeJson(enPath, enData);
  writeJson(koPath, koData);
  writeJson(zhPath, zhData);

  console.log(JSON.stringify({
    status: 'inserted',
    id,
    domain,
    files: [enPath, koPath, zhPath]
  }, null, 2));
}

main();
