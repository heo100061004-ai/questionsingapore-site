const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function createLlmBudgetGuard(options = {}) {
  const budgetUsd = Number.isFinite(Number(options.budgetUsd)) ? Number(options.budgetUsd) : 5;
  const statePath = options.statePath || path.join(process.cwd(), '.llm-budget-state.json');
  const cacheTtlMs = Number.isFinite(Number(options.cacheTtlMs)) ? Number(options.cacheTtlMs) : 15 * 60 * 1000;

  function ensureState() {
    if (!fs.existsSync(statePath)) {
      const initial = {
        monthKey: getMonthKey(),
        spentUsd: 0,
        cache: {}
      };
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, JSON.stringify(initial, null, 2));
    }
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }

  function saveState(state) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  function getMonthKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function normalizeState(state) {
    const monthKey = getMonthKey();
    if (state.monthKey !== monthKey) {
      return {
        monthKey,
        spentUsd: 0,
        cache: {}
      };
    }
    return {
      monthKey: state.monthKey || monthKey,
      spentUsd: Number(state.spentUsd || 0),
      cache: state.cache && typeof state.cache === 'object' ? state.cache : {}
    };
  }

  function estimateCost(inputTokens = 0, outputTokens = 0) {
    const inputUsd = (Number(inputTokens || 0) / 1000000) * 0.15;
    const outputUsd = (Number(outputTokens || 0) / 1000000) * 0.6;
    return inputUsd + outputUsd;
  }

  function recordUsage({ inputTokens = 0, outputTokens = 0 } = {}) {
    const state = normalizeState(ensureState());
    state.spentUsd = Number(state.spentUsd || 0) + estimateCost(inputTokens, outputTokens);
    saveState(state);
    return state.spentUsd;
  }

  function shouldAllowCall({ question = '', language = 'en', domain = '' } = {}) {
    const state = normalizeState(ensureState());
    const reachedBudget = state.spentUsd >= budgetUsd;
    if (reachedBudget) {
      return { allowed: false, reason: 'monthly budget exhausted', state };
    }

    return { allowed: true, reason: 'within budget', state };
  }

  function buildCacheKey(question = '', language = 'en', domain = '') {
    const payload = `${String(language || 'en')}::${String(domain || '')}::${String(question || '')}`.trim();
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  async function getCachedOrExecute({ question = '', language = 'en', domain = '', executor }) {
    const state = normalizeState(ensureState());
    const key = buildCacheKey(question, language, domain);
    const entry = state.cache && state.cache[key] ? state.cache[key] : null;
    const now = Date.now();

    if (entry && Number(entry.expiresAt || 0) > now) {
      return entry.value;
    }

    const decision = shouldAllowCall({ question, language, domain });
    if (!decision.allowed) {
      return { answer: '현재 사용량이 일정 한도에 도달해 단기적으로 AI 보조 응답을 일시 중단합니다. 자주 묻는 질문이나 관리자 상담으로 이어가세요.', source: 'budget-blocked' };
    }

    const result = await executor();
    const cacheEntry = {
      value: result,
      expiresAt: now + cacheTtlMs
    };
    state.cache[key] = cacheEntry;
    saveState(state);
    return result;
  }

  return {
    budgetUsd,
    statePath,
    shouldAllowCall,
    recordUsage,
    getCachedOrExecute,
    estimateCost
  };
}

module.exports = {
  createLlmBudgetGuard
};
