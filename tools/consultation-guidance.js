function isLlmFallbackEnabled(env = process.env) {
  const apiKey = String(env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return false;
  }

  const value = String(env.LLM_FALLBACK_ENABLED || '').trim().toLowerCase();
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') {
    return false;
  }
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') {
    return true;
  }

  // Default to enabled when API key exists and no explicit toggle is set.
  return true;
}

function buildMinimalConsultationAnswer(question = '', language = 'ko', contextItems = []) {
  const safeQuestion = String(question || '').trim();
  const safeContextItems = Array.isArray(contextItems) ? contextItems : [];
  const firstContext = safeContextItems[0] || null;
  const contextTitle = firstContext && firstContext.title ? String(firstContext.title) : '';

  if (language === 'zh') {
    const lead = '先给您一个简短方向。';
    const body = contextTitle
      ? `您的问题与“${contextTitle}”相关。先补充这两点：`
      : '先补充这两点：';
    return [
      lead,
      body,
      '- 您当前状态（签证/居住/预算/时间）',
      '- 您最优先要解决的问题'
    ].join('\n');
  }

  if (language === 'en') {
    const lead = 'Here is a short direction first.';
    const body = contextTitle
      ? `Your question is related to “${contextTitle}”. Share these two points first:`
      : 'Share these two points first:';
    return [
      lead,
      body,
      '- Your current status (visa, housing, budget, timeline)',
      '- The top issue you want to solve first'
    ].join('\n');
  }

  const lead = '먼저 핵심만 간단히 안내드립니다.';
  const body = contextTitle
    ? `질문은 “${contextTitle}”와 관련 있어 보여요. 아래 2가지만 알려주세요.`
    : '아래 2가지만 알려주세요.';

  return [
    lead,
    body,
    '- 현재 상황(비자/거주/예산/일정)',
    '- 가장 먼저 해결하고 싶은 1가지',
    safeQuestion ? `현재 질문: ${safeQuestion}` : '질문을 남겨주시면 바로 방향을 잡아드립니다.'
  ].join('\n');
}

module.exports = {
  isLlmFallbackEnabled,
  buildMinimalConsultationAnswer
};
