const test = require('node:test');
const assert = require('node:assert/strict');
const { isLlmFallbackEnabled } = require('../tools/consultation-guidance');

test('isLlmFallbackEnabled defaults to true when API key exists and toggle is missing', () => {
  const enabled = isLlmFallbackEnabled({ OPENAI_API_KEY: 'sk-test' });
  assert.equal(enabled, true);
});

test('isLlmFallbackEnabled can be explicitly disabled', () => {
  const enabled = isLlmFallbackEnabled({ OPENAI_API_KEY: 'sk-test', LLM_FALLBACK_ENABLED: 'off' });
  assert.equal(enabled, false);
});

test('isLlmFallbackEnabled is false without API key', () => {
  const enabled = isLlmFallbackEnabled({ LLM_FALLBACK_ENABLED: 'true' });
  assert.equal(enabled, false);
});
