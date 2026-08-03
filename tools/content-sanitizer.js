function stripPersonalData(text = '') {
  const value = String(text || '');
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted]')
    .replace(/\b(?:\+?65|65)?\s*[- ]?\d{3,4}\s*[- ]?\d{3,4}\b/g, '[redacted]')
    .replace(/\b(?:NRIC|IC|passport|passport no|passport number)\b[^\n]{0,20}\b(?:[A-Z0-9]{4,12})\b/gi, '[redacted]')
    .replace(/\b(?:name|contact|email|phone|mobile|address|nric|passport)\b[^\n]{0,20}[:：]\s*[^\n]+/gi, '[redacted]');
}

function sanitizeKnowledgeText(text = '') {
  const cleaned = stripPersonalData(text || '');
  if (!cleaned || cleaned === String(text || '')) {
    return cleaned || 'No factual content available.';
  }

  return `${cleaned}\n\n[Note: personal information has been excluded and only factual guidance remains.]`;
}

function sanitizeAnswerText(text = '', language = 'ko') {
  const cleaned = stripMarkdownFormatting(stripPersonalData(text || ''));
  if (!cleaned) {
    return cleaned;
  }

  if (language === 'zh') {
    return cleaned.replace(/\[redacted\]/g, '[已掩码]');
  }

  return cleaned.replace(/\[redacted\]/g, '[redacted]');
}

function stripMarkdownFormatting(text = '') {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncateText(text = '', maxChars = 680, language = 'ko') {
  const source = String(text || '').trim();
  const limit = Number.isFinite(Number(maxChars)) ? Number(maxChars) : 680;
  if (!source || source.length <= limit) {
    return source;
  }

  const suffix = language === 'zh'
    ? '\n\n(已省略部分内容)'
    : language === 'en'
      ? '\n\n(Part of the answer was shortened.)'
      : '\n\n(일부 내용은 간략화를 위해 생략되었습니다.)';

  const safeLen = Math.max(80, limit - suffix.length);
  return `${source.slice(0, safeLen).trim()}...${suffix}`;
}

function humanizeConsultingTone(answer, language = 'ko', options = {}) {
  let body = String(answer || '').trim();
  if (!body) {
    return body;
  }

  const includeFollowUp = Boolean(options.includeFollowUp);
  const openingStyle = String(options.openingStyle || 'neutral').toLowerCase();

  const legacyPatterns = [
    /^좋은 질문이에요\.\s*상황에 맞게 핵심부터 편하게 정리해드릴게요\.\s*/,
    /^좋은 질문이에요\.\s*/,
    /^좋은 포인트예요\.\s*핵심만 짧게 정리해볼게요\.\s*/,
    /^핵심만 짧게 정리해볼게요\.\s*/,
    /^这是个很好的问题.*?\s*/,
    /^这个问题很好.*?\s*/,
    /^Great question\..*?\s*/,
    /^Good question\..*?\s*/,
    /\n*필요하시면 현재 상황\(비자 상태, 예산, 일정\)을 알려주세요\.\s*다음 단계까지 같이 정리해드릴게요\.\s*$/,
    /\n*필요하시면 현재 상황을 기준으로 전문가 상담까지 자연스럽게 이어서 도와드릴게요\.\s*$/,
    /\n*如果您愿意，我可以根据您的签证状态、预算和时间计划，继续帮您整理下一步。\s*$/,
    /\n*如需更细判断，我可以按您的情况衔接到专家咨询。\s*$/,
    /\n*If you share your visa status, budget, and timeline, I can help you map the next step in more detail\.\s*$/,
    /\n*If needed, we can continue with expert consultation based on your situation\.\s*$/
  ];

  for (const pattern of legacyPatterns) {
    body = body.replace(pattern, '');
  }
  body = body.trim();

  const closing = includeFollowUp
    ? (language === 'ko'
      ? '추가 확인이 필요하면 문의를 남겨주세요.'
      : language === 'zh'
        ? '如需进一步确认，请提交咨询。'
        : 'If you need a deeper review, please submit an inquiry.')
    : '';

  const parts = [];
  parts.push(body);
  if (closing) {
    parts.push(closing);
  }

  return parts.join('\n\n');
}

module.exports = {
  sanitizeKnowledgeText,
  sanitizeAnswerText,
  humanizeConsultingTone,
  truncateText
};
