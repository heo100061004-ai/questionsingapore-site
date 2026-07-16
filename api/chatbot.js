const fs = require('node:fs');
const path = require('node:path');
const { jaccardSimilarity } = require('../tools/faq-kb-lib');
const { addChatbotLog } = require('../tools/chatbot-log-store');
const {
  getRuntimeDocIndexPath,
  getRuntimeFaqPath,
  readJsonPreferRuntime
} = require('../tools/runtime-kb-paths');

const ROOT_DIR = path.resolve(__dirname, '..');
const FAQ_BASE_DIR = path.join(ROOT_DIR, 'knowledge-base', 'faq');
const SOURCE_REGISTRY_PATH = path.join(ROOT_DIR, 'knowledge-base', 'sources', 'source-registry.json');
const DOC_INDEX_PATH = path.join(ROOT_DIR, 'knowledge-base', 'doc-index.json');
const DOC_INDEX_RUNTIME_PATH = getRuntimeDocIndexPath();

const LANGUAGE_MAP = {
  ko: 'ko',
  en: 'en',
  zh: 'zh'
};

const DOMAINS = ['employment', 'property', 'relocation'];

function normalizeCategory(category = '') {
  const value = String(category || '').toLowerCase();
  if (value.includes('recruitment') || value.includes('채용') || value.includes('고용') || value.includes('employment') || value.includes('就业')) {
    return 'employment';
  }
  if (value.includes('부동산') || value.includes('property') || value.includes('房地产')) {
    return 'property';
  }
  if (value.includes('relocation') || value.includes('리로케이션') || value.includes('搬迁')) {
    return 'relocation';
  }
  return null;
}

function customizeGeneratedAnswer(answer, language) {
  const input = String(answer || '').trim();
  if (!input) {
    return '';
  }

  // Replace long direct quotes to reduce verbatim carryover risk.
  const noLongQuotes = input
    .replace(/"[^"\n]{160,}"/g, '"원문 인용 생략"')
    .replace(/“[^”\n]{160,}”/g, '"원문 인용 생략"');

  const normalized = noLongQuotes.replace(/\n{3,}/g, '\n\n').trim();
  const disclaimer = language === 'ko'
    ? '참고: 아래 답변은 등록된 자료를 재서술한 맞춤 요약이며, 원문 문장을 그대로 복제하지 않도록 구성되었습니다.'
    : language === 'zh'
      ? '说明：以下回答为基于已收录资料的重述摘要，已尽量避免直接复制原文句子。'
      : 'Note: This answer is a customized paraphrased summary based on indexed sources and is structured to avoid direct verbatim copying.';

  if (normalized.includes(disclaimer)) {
    return normalized;
  }

  return `${normalized}\n\n${disclaimer}`;
}

function loadFaqData(language, preferredDomain = null) {
  const langDir = LANGUAGE_MAP[language] || 'en';
  const orderedDomains = preferredDomain
    ? [preferredDomain, ...DOMAINS.filter((item) => item !== preferredDomain)]
    : [...DOMAINS];

  const items = [];

  for (const domain of orderedDomains) {
    const filePath = path.join(FAQ_BASE_DIR, langDir, `${domain}.json`);
    const runtimePath = getRuntimeFaqPath(langDir, domain);
    if (!fs.existsSync(filePath) && !fs.existsSync(runtimePath)) {
      continue;
    }

    try {
      const parsed = readJsonPreferRuntime(filePath, runtimePath, { items: [] });
      const domainItems = Array.isArray(parsed.items) ? parsed.items : [];
      for (const entry of domainItems) {
        items.push({ ...entry, _domain: domain });
      }
    } catch (error) {
      // Ignore malformed file and continue to next domain.
    }
  }

  return items;
}

function findBestFaqMatch(question, items) {
  let best = null;

  for (const item of items) {
    const scoreQuestion = jaccardSimilarity(question, item.question || '');
    const scoreKeywords = Array.isArray(item.keywords)
      ? item.keywords.reduce((max, keyword) => Math.max(max, jaccardSimilarity(question, keyword || '')), 0)
      : 0;
    const score = Math.max(scoreQuestion, scoreKeywords * 0.92);

    if (!best || score > best.score) {
      best = { item, score };
    }
  }

  return best;
}

function loadSourceRegistryMap() {
  try {
    if (!fs.existsSync(SOURCE_REGISTRY_PATH)) {
      return new Map();
    }

    const raw = fs.readFileSync(SOURCE_REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const sources = Array.isArray(parsed && parsed.sources) ? parsed.sources : [];
    const map = new Map();

    for (const source of sources) {
      if (!source || !source.id || !source.url) {
        continue;
      }
      map.set(String(source.id), {
        id: String(source.id),
        name: source.name ? String(source.name) : String(source.id),
        url: String(source.url)
      });
    }

    return map;
  } catch (error) {
    return new Map();
  }
}

function loadDocumentIndex(language, preferredDomain = null) {
  try {
    if (!fs.existsSync(DOC_INDEX_PATH) && !fs.existsSync(DOC_INDEX_RUNTIME_PATH)) {
      return [];
    }

    const parsed = readJsonPreferRuntime(DOC_INDEX_PATH, DOC_INDEX_RUNTIME_PATH, { items: [] });
    const items = Array.isArray(parsed && parsed.items) ? parsed.items : [];

    return items.filter((item) => {
      const itemLanguage = (item && item.language ? String(item.language) : 'en').toLowerCase();
      const itemDomain = normalizeCategory(item && item.category ? item.category : '') || 'employment';

      const languageMatch = itemLanguage === language || itemLanguage === 'multi' || itemLanguage === 'en';
      const domainMatch = preferredDomain ? itemDomain === preferredDomain : true;
      return languageMatch && domainMatch;
    });
  } catch (error) {
    return [];
  }
}

function buildContextCandidates(language, preferredDomain = null) {
  const sourceMap = loadSourceRegistryMap();
  const faqItems = loadFaqData(language, preferredDomain);
  const docs = loadDocumentIndex(language, preferredDomain);

  const faqCandidates = faqItems.map((item) => {
    const refs = Array.isArray(item && item.sourceRefs)
      ? item.sourceRefs
          .map((id) => sourceMap.get(String(id)))
          .filter(Boolean)
          .map((source) => ({ label: source.name, url: source.url }))
      : [];

    return {
      type: 'faq',
      category: item && item._domain ? String(item._domain) : String(item.category || ''),
      language,
      title: item && item.question ? String(item.question) : '',
      text: [item.shortAnswer, item.detailedAnswer, item.thingsToNote].filter(Boolean).join(' '),
      keywords: Array.isArray(item && item.keywords) ? item.keywords : [],
      refs
    };
  });

  const docCandidates = docs.map((item) => {
    const refs = [];
    if (item && item.url) {
      refs.push({ label: item.source || item.title || 'Source', url: String(item.url) });
    }

    return {
      type: 'doc',
      category: item && item.category ? String(item.category) : '',
      language: item && item.language ? String(item.language) : 'en',
      title: item && item.title ? String(item.title) : '',
      text: item && item.text ? String(item.text) : '',
      keywords: Array.isArray(item && item.keywords) ? item.keywords : [],
      refs
    };
  });

  return [...docCandidates, ...faqCandidates];
}

function rankContextMatches(question, candidates) {
  const scored = [];

  for (const candidate of candidates) {
    const scoreTitle = jaccardSimilarity(question, candidate.title || '');
    const scoreBody = jaccardSimilarity(question, candidate.text || '');
    const scoreKeywords = Array.isArray(candidate.keywords)
      ? candidate.keywords.reduce((max, keyword) => Math.max(max, jaccardSimilarity(question, keyword || '')), 0)
      : 0;

    const score = Math.max(scoreTitle, scoreBody * 0.96, scoreKeywords * 0.9);
    if (score > 0) {
      scored.push({
        ...candidate,
        score
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score);
}

function dedupeReferences(items) {
  const seen = new Set();
  const refs = [];

  for (const item of items) {
    const list = Array.isArray(item.refs) ? item.refs : [];
    for (const ref of list) {
      if (!ref || !ref.url) {
        continue;
      }
      const key = String(ref.url);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      refs.push({
        label: ref.label ? String(ref.label) : 'Source',
        url: key
      });
    }
  }

  return refs.slice(0, 5);
}

function getResponsePolicy(domain) {
  if (domain === 'relocation') {
    return {
      summaryStyle: 'high-level',
      showLinks: false,
      maxRefs: 0
    };
  }

  if (domain === 'property') {
    return {
      summaryStyle: 'concise',
      showLinks: true,
      maxRefs: 3
    };
  }

  return {
    summaryStyle: 'balanced',
    showLinks: true,
    maxRefs: 5
  };
}

function formatRefsForAnswer(refs, language, policy) {
  const safePolicy = policy || getResponsePolicy(null);
  if (!safePolicy.showLinks) {
    return '';
  }

  if (!Array.isArray(refs) || !refs.length) {
    return '';
  }

  const limited = refs.slice(0, Math.max(0, Number(safePolicy.maxRefs || 0)));
  if (!limited.length) {
    return '';
  }

  const heading = language === 'ko'
    ? '참고 링크'
    : language === 'zh'
      ? '参考链接'
      : 'Reference Links';

  const lines = limited.map((ref) => `- ${ref.label}: ${ref.url}`);
  return `\n\n${heading}:\n${lines.join('\n')}`;
}

function composeFaqAnswer(item, language) {
  const notePrefix = language === 'ko'
    ? '참고'
    : language === 'zh'
      ? '提示'
      : 'Note';

  const lines = [];
  if (item.shortAnswer) {
    lines.push(item.shortAnswer);
  }
  if (item.detailedAnswer) {
    lines.push(item.detailedAnswer);
  }
  if (item.thingsToNote) {
    lines.push(`${notePrefix}: ${item.thingsToNote}`);
  }

  return lines.join('\n\n');
}

function buildContextPrompt(question, language, contextItems = [], policy) {
  const langInstruction = language === 'ko'
    ? 'Respond in Korean.'
    : language === 'zh'
      ? 'Respond in Simplified Chinese.'
      : 'Respond in English.';

  const safePolicy = policy || getResponsePolicy(null);
  const styleInstruction = safePolicy.summaryStyle === 'high-level'
    ? 'Use plain, high-level summary with practical steps. Avoid detailed line-by-line extraction.'
    : safePolicy.summaryStyle === 'concise'
      ? 'Keep summary concise and practical. Prioritize 3-5 key points only.'
      : 'Keep a balanced summary with practical checklist style.';

  const safeContextItems = Array.isArray(contextItems) ? contextItems : [];
  const contextText = safeContextItems
    .map((item, index) => {
      const body = String(item.text || '').slice(0, 900);
      return `Context ${index + 1} [${item.type}/${item.category}] ${item.title}\n${body}`;
    })
    .join('\n\n');

  return [
    'You are an AI Q&A assistant for Question Singapore website.',
    'Use only the provided context. If context is insufficient, say what is missing and suggest inquiry form.',
    'Provide general informational guidance only. Avoid legal, tax, or immigration determinations.',
    'If the question is high risk, explicitly recommend contacting a qualified professional.',
    'Keep answer concise and practical, 4-8 sentences, with actionable checklist style.',
    styleInstruction,
    'Rewrite in your own words. Do not copy source text verbatim.',
    'Do not quote more than 12 consecutive words from any single source line.',
    'Prefer summary and actionable interpretation over direct quotation.',
    langInstruction,
    'Do not fabricate links or regulations.',
    `Retrieved context:\n${contextText}`,
    `User question: ${question}`
  ].join(' ');
}

async function callOpenAI(question, language, contextItems) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const preferredDomain = normalizeCategory((contextItems && contextItems[0] && contextItems[0].category) || '');
  const policy = getResponsePolicy(preferredDomain);
  const prompt = buildContextPrompt(question, language, contextItems || [], policy);

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'AI Q&A assistant for Singapore recruitment/employment and property guidance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
  } catch (error) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';

  return content ? String(content).trim() : null;
}

function composeContextOnlyAnswer(question, topMatches, language) {
  const leading = language === 'ko'
    ? '현재 보유한 콘텐츠를 기준으로 핵심 정보를 정리했습니다.'
    : language === 'zh'
      ? '根据当前已收录内容，已整理关键信息。'
      : 'Based on current indexed content, here are the key points.';

  const bullets = topMatches.slice(0, 3).map((item) => {
    const summary = String(item.text || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    if (language === 'ko') {
      return `- ${item.title || '관련 항목'}: ${summary}`;
    }
    if (language === 'zh') {
      return `- ${item.title || '相关条目'}：${summary}`;
    }
    return `- ${item.title || 'Relevant item'}: ${summary}`;
  });

  const closing = language === 'ko'
    ? '질문 의도와 다른 부분이 있으면 상황(비자상태/거주형태/일정)을 추가로 알려주세요.'
    : language === 'zh'
      ? '如与您的情况不完全一致，请补充签证状态/居住类型/时间计划。'
      : 'If this does not fully match your case, share your status, housing type, and timeline.';

  return `${leading}\n\n${bullets.join('\n')}\n\n${closing}`;
}

function offlineFallback(language) {
  if (language === 'ko') {
    return '현재 FAQ에서 직접 일치 항목을 찾지 못했습니다. 구체적인 상황(카테고리, 체류상태, 일정)을 알려주시면 관리자 상담으로 바로 연결해 드리겠습니다.';
  }
  if (language === 'zh') {
    return '目前在 FAQ 中未找到直接匹配内容。请补充您的具体情况（类别、居留状态、时间计划），我们可为您转接人工咨询。';
  }
  return 'No direct FAQ match was found. Share more context (category, status, timeline), and we can route this to admin consultation.';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const body = req.body || {};
  const question = (body.question || '').toString().trim();
  const language = LANGUAGE_MAP[(body.language || '').toString()] || 'ko';
  const preferredDomain = normalizeCategory(body.category || '');

  function reply(payload) {
    addChatbotLog({
      question,
      language,
      category: preferredDomain || '',
      source: payload.source || 'unknown',
      score: payload.score,
      answer: payload.answer || ''
    });

    res.status(200).json(payload);
  }

  if (!question) {
    res.status(400).json({ ok: false, message: 'Missing question' });
    return;
  }

  const faqItems = loadFaqData(language, preferredDomain);
  const best = findBestFaqMatch(question, faqItems);

  const candidates = buildContextCandidates(language, preferredDomain);
  const rankedContexts = rankContextMatches(question, candidates);
  const topContexts = rankedContexts.slice(0, 4);
  const references = dedupeReferences(topContexts);
  const effectiveDomain = preferredDomain || normalizeCategory((topContexts[0] && topContexts[0].category) || '');
  const responsePolicy = getResponsePolicy(effectiveDomain);

  const strongContext = topContexts.length > 0 && topContexts[0].score >= 0.2;

  if (strongContext) {
    const llmAnswerFromContext = await callOpenAI(question, language, topContexts);
    if (llmAnswerFromContext) {
      reply({
        ok: true,
        source: 'ai-context',
        score: Number(topContexts[0].score.toFixed(3)),
        answer: `${customizeGeneratedAnswer(llmAnswerFromContext, language)}${formatRefsForAnswer(references, language, responsePolicy)}`
      });
      return;
    }

    reply({
      ok: true,
      source: 'context-fallback',
      score: Number(topContexts[0].score.toFixed(3)),
      answer: `${composeContextOnlyAnswer(question, topContexts, language)}${formatRefsForAnswer(references, language, responsePolicy)}`
    });
    return;
  }

  if (best && best.score >= 0.63) {
    reply({
      ok: true,
      source: 'faq',
      score: Number(best.score.toFixed(3)),
      answer: composeFaqAnswer(best.item, language)
    });
    return;
  }

  // If localized FAQ misses, try English master as a secondary pass.
  if (language !== 'en') {
    const englishItems = loadFaqData('en', preferredDomain);
    const bestEnglish = findBestFaqMatch(question, englishItems);

    if (bestEnglish && bestEnglish.score >= 0.63) {
      reply({
        ok: true,
        source: 'faq-en-fallback',
        score: Number(bestEnglish.score.toFixed(3)),
        answer: composeFaqAnswer(bestEnglish.item, 'en')
      });
      return;
    }
  }

  const llmAnswer = await callOpenAI(question, language);
  if (llmAnswer) {
    reply({
      ok: true,
      source: 'llm-fallback',
      answer: customizeGeneratedAnswer(llmAnswer, language)
    });
    return;
  }

  reply({
    ok: true,
    source: 'fallback',
    answer: offlineFallback(language)
  });
};
