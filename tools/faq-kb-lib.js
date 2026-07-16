const PUNCT_REGEX = /[^\p{L}\p{N}\s]/gu;

function normalizeQuestion(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(PUNCT_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTokenSet(text) {
  const normalized = normalizeQuestion(text);
  if (!normalized) {
    return new Set();
  }
  return new Set(normalized.split(' ').filter(Boolean));
}

function jaccardSimilarity(a, b) {
  const setA = toTokenSet(a);
  const setB = toTokenSet(b);

  if (!setA.size && !setB.size) {
    return 1;
  }
  if (!setA.size || !setB.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function findDuplicate(items, incomingQuestion, threshold = 0.7) {
  const normalizedIncoming = normalizeQuestion(incomingQuestion);

  for (const item of items || []) {
    const existing = item && item.question ? item.question : '';
    if (!existing) {
      continue;
    }

    const normalizedExisting = normalizeQuestion(existing);
    if (normalizedExisting && normalizedExisting === normalizedIncoming) {
      return { type: 'exact', score: 1, item };
    }

    const score = jaccardSimilarity(existing, incomingQuestion);
    if (score >= threshold) {
      return { type: 'similar', score, item };
    }
  }

  return null;
}

function nextFaqId(items, prefix) {
  let max = 0;

  for (const item of items || []) {
    const id = item && item.id ? String(item.id) : '';
    const match = id.match(new RegExp(`^${prefix}-(\\d{4})$`));
    if (!match) {
      continue;
    }
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }

  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

module.exports = {
  normalizeQuestion,
  jaccardSimilarity,
  findDuplicate,
  nextFaqId
};
