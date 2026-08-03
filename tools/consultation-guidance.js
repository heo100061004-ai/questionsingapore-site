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
    const body = contextTitle
      ? `您的问题与“${contextTitle}”相关。先确认这两点：`
      : '先确认这两点：';
    return [
      '我先帮您缩小范围。',
      body,
      '- 您当前状态（签证/居住/预算/时间）',
      '- 您最优先要解决的问题',
      '如果愿意，我可以继续帮您把下一步整理得更具体。'
    ].join('\n');
  }

  if (language === 'en') {
    const body = contextTitle
      ? `Your question relates to “${contextTitle}”. Start with these two points:`
      : 'Start with these two points:';
    return [
      'Let me narrow this down first.',
      body,
      '- Your current status (visa, housing, budget, timeline)',
      '- The top issue you want to solve first',
      'If you want, I can keep narrowing this down.'
    ].join('\n');
  }

  const body = contextTitle
    ? `질문은 “${contextTitle}”와 관련 있어 보여요. 먼저 이 2가지만 알려주세요.`
    : '먼저 이 2가지만 알려주세요.';

  return [
    '우선 범위를 좁혀볼게요.',
    body,
    '- 현재 상황(비자/거주/예산/일정)',
    '- 가장 먼저 해결하고 싶은 1가지',
    safeQuestion ? `현재 질문: ${safeQuestion}` : '질문을 남겨주시면 방향을 잡아드립니다.',
    '원하시면 다음 단계까지 이어서 정리해드릴게요.'
  ].join('\n');
}

function buildGuidedConversationAnswer({ question = '', language = 'ko', stage = 1, contextItems = [], references = [] } = {}) {
  const safeStage = Math.min(5, Math.max(1, Number(stage) || 1));
  const safeQuestion = String(question || '').trim();
  const safeContextItems = Array.isArray(contextItems) ? contextItems : [];
  const contextTitle = safeContextItems[0] && safeContextItems[0].title ? String(safeContextItems[0].title) : '';
  const hasRefs = Array.isArray(references) && references.length > 0;

  const refLine = hasRefs
    ? (language === 'zh'
      ? '需要的话，我也可以补上官方参考链接。'
      : language === 'en'
        ? 'If needed, I can add the official reference links too.'
        : '필요하면 공식 참고 링크도 붙여드릴게요.')
    : '';

  if (language === 'zh') {
    if (safeStage <= 1) {
      return [
        '我先帮您把范围收窄。',
        contextTitle ? `这件事看起来和“${contextTitle}”有关。` : '这件事我先按可执行方向帮您整理。',
        '- 您现在的情况（签证/居住/预算/时间）',
        '- 您最想先解决的一个问题',
        '您方便先回我这两点吗？'
      ].filter(Boolean).join('\n');
    }

    if (safeStage === 2) {
      return [
        '好，我再帮您往前推进一步。',
        safeQuestion ? `您刚刚提到的是：${safeQuestion}` : '我先按您刚刚的情况继续整理。',
        '- 还有没有时间限制或预算上限？',
        '- 目前最担心的是哪一项？',
        '回我这两点后，我就能把优先顺序排出来。'
      ].join('\n');
    }

    if (safeStage === 3 || safeStage === 4) {
      return [
        '好的，我继续帮您往下收窄。',
        safeQuestion ? `基于您刚才的情况：${safeQuestion}` : '我继续基于您刚才的情况整理。',
        '- 还有哪些必须先确认的条件？',
        '- 哪一项如果不确定，最容易影响决策？',
        '您再补充一点，我就能把顺序排得更清楚。'
      ].join('\n');
    }

    return [
      '我先帮您收一个简短结论。',
      '如果接下来要做更细的判断，交给管理员会更稳妥。',
      refLine || '如果需要，我也可以继续帮您整理要点。'
    ].filter(Boolean).join('\n');
  }

  if (language === 'en') {
    if (safeStage <= 1) {
      return [
        'Let me narrow this down first.',
        contextTitle ? `This seems related to “${contextTitle}”.` : 'I will keep this practical.',
        '- Your current situation (visa, housing, budget, timeline)',
        '- The one issue you want to solve first',
        'Can you share those two points?'
      ].filter(Boolean).join('\n');
    }

    if (safeStage === 2) {
      return [
        'Great, I can take it one step further.',
        safeQuestion ? `You just mentioned: ${safeQuestion}` : 'I will continue from your last point.',
        '- Any deadline or budget limit?',
        '- Which part is most urgent right now?',
        'Reply with those two points and I will organize the next step.'
      ].join('\n');
    }

    if (safeStage === 3 || safeStage === 4) {
      return [
        'Great, let me narrow this down further.',
        safeQuestion ? `Based on what you just said: ${safeQuestion}` : 'I will continue from your last point.',
        '- What other condition should we confirm first?',
        '- Which uncertainty would affect the decision most?',
        'Add one more detail and I can organize the next step more clearly.'
      ].join('\n');
    }

    return [
      'I can give you a short wrap-up now.',
      'If you want a deeper review, moving this into admin consultation is the safest next step.',
      refLine || 'If needed, I can keep summarizing the key points.'
    ].filter(Boolean).join('\n');
  }

  if (safeStage <= 1) {
    return [
      '우선 범위를 좁혀볼게요.',
      contextTitle ? `이 내용은 “${contextTitle}”와 관련 있어 보여요.` : '실행 가능한 방향부터 정리해드릴게요.',
      '- 현재 상황(비자/거주/예산/일정)',
      '- 가장 먼저 해결하고 싶은 1가지',
      '이 두 가지만 먼저 알려주실래요?'
    ].filter(Boolean).join('\n');
  }

  if (safeStage === 2) {
    return [
      '좋아요. 이제 한 단계 더 좁혀볼게요.',
      safeQuestion ? `방금 말씀하신 내용은: ${safeQuestion}` : '방금 답변을 기준으로 이어서 정리해볼게요.',
      '- 마감 시점이나 예산 상한이 있나요?',
      '- 지금 가장 걱정되는 부분은 무엇인가요?',
      '이 두 가지를 주시면 우선순위를 잡아드릴 수 있어요.'
    ].join('\n');
  }

  if (safeStage === 3 || safeStage === 4) {
    return [
      '좋아요. 여기서 한 번 더 좁혀볼게요.',
      safeQuestion ? `방금 말씀하신 내용 기준으로 보면: ${safeQuestion}` : '방금 답변을 기준으로 이어서 정리해볼게요.',
      '- 지금도 확인이 필요한 조건이 또 있나요?',
      '- 어떤 부분이 확실하지 않으면 판단이 가장 흔들리나요?',
      '조금만 더 알려주시면 우선순위를 더 정확하게 잡아드릴 수 있어요.'
    ].join('\n');
  }

  return [
    '지금까지 내용을 보면 방향은 잡혔습니다.',
    '더 자세한 판단이 필요하면 그때 상담폼으로 이어가면 가장 정확합니다.',
    refLine || '원하시면 제가 핵심만 다시 한 번 짧게 정리해드릴게요.'
  ].filter(Boolean).join('\n');
}

module.exports = {
  isLlmFallbackEnabled,
  buildMinimalConsultationAnswer,
  buildGuidedConversationAnswer
};
