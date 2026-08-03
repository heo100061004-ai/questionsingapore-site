const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sanitizeKnowledgeText,
  sanitizeAnswerText,
  humanizeConsultingTone
} = require('../tools/content-sanitizer');

test('sanitizeKnowledgeText removes personal information while keeping facts', () => {
  const input = 'John Tan can be reached at john@example.com or 8123 4567. His NRIC is S1234567A.';
  const sanitized = sanitizeKnowledgeText(input);

  assert.equal(sanitized.includes('john@example.com'), false);
  assert.equal(sanitized.includes('8123 4567'), false);
  assert.equal(sanitized.includes('S1234567A'), false);
  assert.ok(sanitized.includes('personal information'));
});

test('sanitizeAnswerText redacts personal details from generated replies', () => {
  const input = 'Please contact John at john@example.com for details.';
  const sanitized = sanitizeAnswerText(input, 'en');

  assert.equal(sanitized.includes('john@example.com'), false);
  assert.ok(sanitized.includes('[redacted]'));
});

test('humanizeConsultingTone uses neutral tone and optional follow-up', () => {
  const answer = 'Here are the key steps to follow.';
  const neutral = humanizeConsultingTone(answer, 'ko');
  const withFollowUp = humanizeConsultingTone(answer, 'ko', { includeFollowUp: true });

  assert.ok(neutral.includes('핵심만 간단히 안내드립니다.'));
  assert.ok(neutral.includes('Here are the key steps to follow.'));
  assert.equal(neutral.includes('추가 확인이 필요하면 문의를 남겨주세요.'), false);

  assert.ok(withFollowUp.includes('추가 확인이 필요하면 문의를 남겨주세요.'));
});
