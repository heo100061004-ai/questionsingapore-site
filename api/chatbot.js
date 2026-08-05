const fs = require('node:fs');
const path = require('node:path');
const { jaccardSimilarity } = require('../tools/faq-kb-lib');
const { addChatbotLog } = require('../tools/chatbot-log-store');
const { maybeAutoIngestRawDocs } = require('../tools/auto-ingest-raw-docs');
const { sanitizeAnswerText, humanizeConsultingTone, truncateText } = require('../tools/content-sanitizer');
const { createLlmBudgetGuard } = require('../tools/llm-cost-guard');
const { isLlmFallbackEnabled, buildMinimalConsultationAnswer, buildGuidedConversationAnswer } = require('../tools/consultation-guidance');
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
const DEFAULT_REFERENCE_LINKS = {
  employment: [
    { label: 'Ministry of Manpower', url: 'https://www.mom.gov.sg/passes-and-permits' },
    { label: 'GoBusiness Singapore', url: 'https://www.gobusiness.gov.sg/' }
  ],
  property: [
    { label: 'Housing & Development Board', url: 'https://www.hdb.gov.sg/' },
    { label: 'Urban Redevelopment Authority', url: 'https://www.ura.gov.sg/' }
  ],
  relocation: [
    { label: 'Immigration & Checkpoints Authority', url: 'https://www.ica.gov.sg/' },
    { label: 'Ministry of Manpower', url: 'https://www.mom.gov.sg/' }
  ]
};
const llmBudgetGuard = createLlmBudgetGuard({
  budgetUsd: Number(process.env.LLM_BUDGET_USD || 5),
  statePath: path.join(ROOT_DIR, '.llm-budget-state.json')
});

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

  return noLongQuotes.replace(/\n{3,}/g, '\n\n').trim();
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
      const itemFile = (item && item.file ? String(item.file) : '').toLowerCase();
      const itemTitle = (item && item.title ? String(item.title) : '').toLowerCase();

      const isOperationalDoc = itemFile === 'readme.md'
        || itemFile === 'auto-ingest-state.json'
        || itemFile === 'manifest.json'
        || itemFile === 'manifest.sample.json'
        || itemFile === 'update-archive.json'
        || itemTitle === 'readme.md'
        || itemTitle === 'auto-ingest-state.json';

      if (isOperationalDoc) {
        return false;
      }

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
  const englishFaqItems = language === 'en' ? [] : loadFaqData('en', preferredDomain);
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

  const englishFaqCandidates = englishFaqItems.map((item) => {
    const refs = Array.isArray(item && item.sourceRefs)
      ? item.sourceRefs
          .map((id) => sourceMap.get(String(id)))
          .filter(Boolean)
          .map((source) => ({ label: source.name, url: source.url }))
      : [];

    return {
      type: 'faq-en',
      category: item && item._domain ? String(item._domain) : String(item.category || ''),
      language: 'en',
      title: item && item.question ? String(item.question) : '',
      text: [item.shortAnswer, item.detailedAnswer, item.thingsToNote].filter(Boolean).join(' '),
      keywords: Array.isArray(item && item.keywords) ? item.keywords : [],
      refs
    };
  });

  return [...faqCandidates, ...englishFaqCandidates, ...docCandidates];
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
      showLinks: true,
      maxRefs: 1
    };
  }

  if (domain === 'property') {
    return {
      summaryStyle: 'concise',
      showLinks: true,
      maxRefs: 1
    };
  }

  return {
    summaryStyle: 'balanced',
    showLinks: true,
    maxRefs: 1
  };
}

function normalizeConversationStage(value) {
  const stage = Number(value);
  if (!Number.isFinite(stage) || stage <= 0) {
    return 0;
  }
  return Math.min(5, Math.max(1, Math.floor(stage)));
}

function getDefaultReferenceLinks(domain) {
  return Array.isArray(DEFAULT_REFERENCE_LINKS[domain]) ? DEFAULT_REFERENCE_LINKS[domain] : [];
}

function formatRefsForAnswer(refs, language, policy, domain) {
  const safePolicy = policy || getResponsePolicy(null);
  if (!safePolicy.showLinks) {
    return '';
  }

  const sourceRefs = Array.isArray(refs) && refs.length ? refs : getDefaultReferenceLinks(domain);

  const limited = sourceRefs.slice(0, Math.max(0, Number(safePolicy.maxRefs || 0)));
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

function normalizeHistoryItems(history = []) {
  return (Array.isArray(history) ? history : [])
    .map((item) => {
      const role = String(item && item.role ? item.role : '').toLowerCase();
      const text = String(item && item.text ? item.text : '').trim();
      if (!text) {
        return null;
      }
      return {
        role: role === 'assistant' || role === 'bot' ? 'assistant' : 'user',
        text: text.slice(0, 500)
      };
    })
    .filter(Boolean)
    .slice(-6);
}

function buildContextPrompt(question, language, contextItems = [], policy, history = []) {
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

  const questionFocus = String(question || '').trim();

  const safeContextItems = Array.isArray(contextItems) ? contextItems : [];
  const safeHistory = normalizeHistoryItems(history);
  const contextText = safeContextItems
    .map((item, index) => {
      const body = String(item.text || '').slice(0, 900);
      return `Context ${index + 1} [${item.type}/${item.category}] ${item.title}\n${body}`;
    })
    .join('\n\n');

  const historyText = safeHistory.length
    ? safeHistory.map((item, index) => `Turn ${index + 1} [${item.role}] ${item.text}`).join('\n')
    : 'No prior conversation.';

  return [
    'You are an AI Q&A assistant for Question Singapore website.',
    'Use the provided context first. If context is insufficient, give the safest practical baseline answer using general Singapore guidance, clearly note what still needs confirmation, and then suggest the inquiry form.',
    'Provide general informational guidance only. Avoid legal, tax, or immigration determinations.',
    'If the question is high risk, explicitly recommend contacting a qualified professional.',
    'Write like a helpful consultant having a short natural conversation: acknowledge the situation, give the practical baseline, mention 1-2 next checks, and gently suggest the inquiry form for follow-up.',
    'Always answer the user question directly in the first 1-2 sentences before asking for any more detail.',
    'If context is partial, still give the safest useful baseline instead of only asking follow-up questions.',
    'When you close the answer, use a soft handoff: if the case needs person-specific review, naturally suggest the inquiry form instead of sounding abrupt.',
    'Keep continuity with the recent conversation history, but answer the latest user question directly.',
    'Do not switch to unrelated topics or categories unless the latest user question clearly changes topic.',
    'If the user gave partial context earlier, reuse it instead of asking the same question again.',
    'Make the answer specific to this exact question. Do not reuse a generic template across different topics.',
    'Start by reflecting one concrete detail from the user question in your own words so different questions naturally produce different answers.',
    'Keep answer concise and practical, 4-8 sentences, with actionable checklist style.',
    styleInstruction,
    'Rewrite in your own words. Do not copy source text verbatim.',
    'Do not quote more than 12 consecutive words from any single source line.',
    'Prefer summary and actionable interpretation over direct quotation.',
    langInstruction,
    'Do not fabricate links or regulations.',
    `Recent conversation:\n${historyText}`,
    `Question focus: ${questionFocus}`,
    `Retrieved context:\n${contextText}`,
    `User question: ${question}`
  ].join(' ');
}

function buildDomainSpecificFallback(question, language, domain) {
  const q = String(question || '').toLowerCase();
  const safeDomain = domain || 'employment';

  if (safeDomain === 'employment' && (q.includes('employment pass') || q.includes('ep') || q.includes('s pass'))) {
    if (language === 'en') {
      return [
        'For pass-related job planning, check the pass type, sponsor change timing, and whether the new employer will file the next application before you move.',
        '- If you are changing jobs, confirm resignation timing, new employer sponsorship, and work-start date after approval.',
        '- If you are comparing EP and S Pass, review salary band, role level, and employer eligibility first.',
        'If expert consultation is needed, please submit the inquiry form.'
      ].join('\n');
    }
    if (language === 'zh') {
      return [
        '如果是签证相关问题，建议先确认准证类型、雇主变更时间，以及新雇主是否会先提交新的申请。',
        '- 换工作时，先确认离职时间、下一家公司的担保安排、以及获批后的到岗时间。',
        '- 比较 EP 和 S Pass 时，先看薪资区间、岗位层级和雇主资格。',
        '如需专家进一步判断，请提交咨询表单。'
      ].join('\n');
    }
    return [
      '비자 관련 질문이라면 먼저 패스 종류, 고용주 변경 시점, 새 회사의 스폰서 진행 가능 여부를 확인하는 것이 좋습니다.',
      '- 이직이라면 퇴사 시점, 새 회사의 비자 신청 일정, 승인 후 출근 가능일을 먼저 맞춰보세요.',
      '- EP와 S Pass 비교라면 급여 기준, 직무 레벨, 회사의 신청 가능 조건을 먼저 보셔야 합니다.',
      '전문가의 상담이 필요하면 상담폼을 접수해 주시기 바랍니다.'
    ].join('\n');
  }

  if (safeDomain === 'property' && (q.includes('lease') || q.includes('rental') || q.includes('rent') || q.includes('임대') || q.includes('계약') || q.includes('월세') || q.includes('디파짓'))) {
    if (language === 'en') {
      return [
        'Before committing to a rental, review the lease term, deposit terms, agent fee, and who pays for repairs or early termination risk.',
        '- Ask for the exact deposit amount, refund condition, and inventory handover record in writing.',
        '- If you are comparing areas, balance commute, lifestyle, and monthly housing budget together.',
        'If expert consultation is needed, please submit the inquiry form.'
      ].join('\n');
    }
    if (language === 'zh') {
      return [
        '签租约前，建议先确认租期、押金条款、中介费用，以及维修责任和提前解约风险。',
        '- 押金金额、退还条件、房屋交接清单最好都以书面方式确认。',
        '- 如果您在比较区域，建议同时看通勤、生活便利度和月度住房预算。',
        '如需专家进一步判断，请提交咨询表单。'
      ].join('\n');
    }
    return [
      '임대 계약 전에는 계약 기간, 디파짓 조건, 에이전트 수수료, 수리 책임, 중도해지 조항을 먼저 확인하는 것이 좋습니다.',
      '- 디파짓 금액과 반환 조건, 입주 인벤토리 목록은 문서로 남겨두세요.',
      '- 지역을 비교 중이라면 출퇴근 시간, 생활 편의, 월세 예산을 함께 보셔야 합니다.',
      '전문가의 상담이 필요하면 상담폼을 접수해 주시기 바랍니다.'
    ].join('\n');
  }

  if (safeDomain === 'relocation' && (q.includes('first') || q.includes('2주') || q.includes('첫') || q.includes('搬') || q.includes('孩子') || q.includes('family') || q.includes('가족'))) {
    if (language === 'en') {
      return [
        'For the first two weeks after relocation, focus on address setup, school or family essentials, mobile and banking basics, and your daily transport routine first.',
        '- Confirm documents you need immediately for dependants, school contact, and healthcare access.',
        '- Settle one temporary routine first: home, school, transport, and emergency contact flow.',
        'If expert consultation is needed, please submit the inquiry form.'
      ].join('\n');
    }
    if (language === 'zh') {
      return [
        '搬迁后的前两周，建议优先处理住址安排、孩子学校或家庭必需事项、手机与银行基础设置、以及日常交通动线。',
        '- 先确认家属文件、学校联络方式和医疗使用所需材料。',
        '- 先把居住、上学、出行和紧急联系人这条日常流程稳定下来。',
        '如需专家进一步判断，请提交咨询表单。'
      ].join('\n');
    }
    return [
      '가족 이주 첫 2주에는 거주지 정리, 자녀 학교/가족 필수 절차, 휴대폰과 은행 같은 기본 인프라, 일상 이동 동선을 먼저 안정시키는 것이 좋습니다.',
      '- 가족 구성원 서류, 학교 연락 체계, 병원 이용 준비를 먼저 확인해 두세요.',
      '- 집, 학교, 교통, 비상 연락 흐름을 먼저 잡으면 초반 적응이 훨씬 수월합니다.',
      '전문가의 상담이 필요하면 상담폼을 접수해 주시기 바랍니다.'
    ].join('\n');
  }

  return '';
}

async function callOpenAI(question, language, contextItems, history = []) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const preferredDomain = normalizeCategory((contextItems && contextItems[0] && contextItems[0].category) || '');
  const policy = getResponsePolicy(preferredDomain);
  const prompt = buildContextPrompt(question, language, contextItems || [], policy, history);

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
        temperature: 0.35,
        presence_penalty: 0.25,
        frequency_penalty: 0.15,
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

  let data;
  try {
    data = await response.json();
  } catch (error) {
    return null;
  }
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
    return '현재 FAQ에서 직접 일치 항목을 찾지 못했습니다. 구체적인 상황(카테고리, 체류상태, 일정)을 알려주시면 필요에 따라 추가로 확인해 드릴 수 있습니다.';
  }
  if (language === 'zh') {
    return '目前在 FAQ 中未找到直接匹配内容。请补充您的具体情况（类别、居留状态、时间计划），我们可根据需要继续为您提供更细的帮助。';
  }
  return 'No direct FAQ match was found. Share more context (category, status, timeline), and we can continue with more detailed support if needed.';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const body = req.body || {};
  const question = (body.question || '').toString().trim();
  const language = LANGUAGE_MAP[(body.language || '').toString()] || 'ko';
  const preferredDomain = normalizeCategory(body.category || '');
  const conversationHistory = normalizeHistoryItems(body.history);
  const conversationMode = String(body.conversationMode || '').toLowerCase();
  const conversationStage = normalizeConversationStage(body.conversationStage || 0);
  const safePolicy = getResponsePolicy(preferredDomain);

  try {

  try {
    await maybeAutoIngestRawDocs({
      trigger: 'chatbot-request',
      force: false
    });
  } catch (error) {
    // Continue chatbot service even if auto-ingest fails.
  }

  function reply(payload) {
    const sanitizedAnswer = sanitizeAnswerText(payload.answer || '', language);
    const followUpSources = new Set(['fallback', 'consultation-guidance', 'budget-blocked', 'context-fallback', 'ai-context', 'llm-fallback']);
    const includeFollowUp = followUpSources.has(String(payload.source || '').toLowerCase());
    const hasLeadAlready = /^(먼저 핵심만|핵심만 간단히|here is a short direction|let me give you a short direction|先给您一个简短方向|先为您简要说明重点)/i.test(
      String(sanitizedAnswer || '').trim()
    );
    const tonedAnswer = humanizeConsultingTone(sanitizedAnswer, language, {
      includeFollowUp,
      openingStyle: hasLeadAlready ? 'none' : 'neutral'
    });
    const finalAnswer = truncateText(tonedAnswer, payload.maxChars || 520, language);

    addChatbotLog({
      question,
      language,
      category: preferredDomain || '',
      source: payload.source || 'unknown',
      score: payload.score,
      answer: finalAnswer || ''
    });

    res.status(200).json({
      ...payload,
      answer: finalAnswer
    });
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

  const guidedConversationActive = conversationMode === 'guided' || conversationStage > 0;

  if (guidedConversationActive) {
    const stage = conversationStage || 1;
    const guidedAnswer = buildGuidedConversationAnswer({
      question,
      language,
      stage,
      contextItems: topContexts,
      references
    });

    reply({
      ok: true,
      source: 'conversation-guidance',
      stage,
      maxChars: stage === 1 ? 260 : stage === 2 ? 320 : stage === 3 ? 360 : stage === 4 ? 400 : 430,
      answer: stage >= 5
        ? `${guidedAnswer}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
        : guidedAnswer
    });
    return;
  }

  const strongContext = topContexts.length > 0 && topContexts[0].score >= 0.2;

  if (strongContext) {
    const minimalAnswer = buildMinimalConsultationAnswer(question, language, topContexts);
    const shouldUseLlm = isLlmFallbackEnabled(process.env) && llmBudgetGuard.shouldAllowCall({ question, language, domain: effectiveDomain || 'employment' }).allowed;

    if (!shouldUseLlm) {
      reply({
        ok: true,
        source: 'consultation-guidance',
        score: Number(topContexts[0].score.toFixed(3)),
        answer: `${minimalAnswer}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
      });
      return;
    }

    const budgetDecision = llmBudgetGuard.shouldAllowCall({ question, language, domain: effectiveDomain || 'employment' });
    if (!budgetDecision.allowed) {
      reply({
        ok: true,
        source: 'budget-blocked',
        score: Number(topContexts[0].score.toFixed(3)),
        answer: `${minimalAnswer}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
      });
      return;
    }

    const llmAnswerFromContext = await llmBudgetGuard.getCachedOrExecute({
      question,
      language,
      domain: effectiveDomain || 'employment',
      executor: async () => {
        const answer = await callOpenAI(question, language, topContexts, conversationHistory);
        if (answer) {
          return {
            ok: true,
            answer: `${customizeGeneratedAnswer(answer, language)}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
          };
        }
        return {
          ok: true,
          answer: `${composeContextOnlyAnswer(question, topContexts, language)}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
        };
      }
    });

    if (llmAnswerFromContext && llmAnswerFromContext.answer) {
      reply({
        ok: true,
        source: llmAnswerFromContext.source || 'ai-context',
        score: Number(topContexts[0].score.toFixed(3)),
        answer: llmAnswerFromContext.answer
      });
      return;
    }

    reply({
      ok: true,
      source: 'context-fallback',
      score: Number(topContexts[0].score.toFixed(3)),
      answer: `${composeContextOnlyAnswer(question, topContexts, language)}${formatRefsForAnswer(references, language, responsePolicy, effectiveDomain || preferredDomain)}`
    });
    return;
  }

  if (best && best.score >= 0.63) {
    const minimalAnswer = buildMinimalConsultationAnswer(question, language, []);
    reply({
      ok: true,
      source: 'faq',
      score: Number(best.score.toFixed(3)),
      answer: `${minimalAnswer}\n\n${composeFaqAnswer(best.item, language)}${formatRefsForAnswer([], language, responsePolicy, effectiveDomain || preferredDomain)}`
    });
    return;
  }

  // If localized FAQ misses, try English master as a secondary pass.
  if (language !== 'en') {
    const englishItems = loadFaqData('en', preferredDomain);
    const bestEnglish = findBestFaqMatch(question, englishItems);

    if (bestEnglish && bestEnglish.score >= 0.63) {
      const minimalAnswer = buildMinimalConsultationAnswer(question, language, []);
      reply({
        ok: true,
        source: 'faq-en-fallback',
        score: Number(bestEnglish.score.toFixed(3)),
        answer: `${minimalAnswer}\n\n${composeFaqAnswer(bestEnglish.item, 'en')}${formatRefsForAnswer([], 'en', responsePolicy, effectiveDomain || preferredDomain)}`
      });
      return;
    }
  }

  if (isLlmFallbackEnabled(process.env)) {
    const llmAnswer = await callOpenAI(question, language, [], conversationHistory);
    if (llmAnswer) {
      reply({
        ok: true,
        source: 'llm-fallback',
        answer: `${customizeGeneratedAnswer(llmAnswer, language)}${formatRefsForAnswer([], language, responsePolicy, effectiveDomain || preferredDomain)}`
      });
      return;
    }
  }

  reply({
    ok: true,
    source: 'fallback',
    answer: `${buildDomainSpecificFallback(question, language, effectiveDomain || preferredDomain) || buildMinimalConsultationAnswer(question, language, [])}${formatRefsForAnswer([], language, responsePolicy, effectiveDomain || preferredDomain)}`
  });
  } catch (error) {
    const safeQuestion = question || '';
    const safeAnswer = `${buildMinimalConsultationAnswer(safeQuestion, language, [])}${formatRefsForAnswer([], language, safePolicy, preferredDomain)}`;
    res.status(200).json({
      ok: true,
      source: 'safe-fallback',
      answer: safeAnswer
    });
  }
};
