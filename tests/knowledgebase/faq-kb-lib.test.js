const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeQuestion,
  jaccardSimilarity,
  findDuplicate,
  nextFaqId
} = require('../../tools/faq-kb-lib');

test('normalizeQuestion lowers case and strips punctuation', () => {
  assert.equal(normalizeQuestion('Can I Change Jobs?'), 'can i change jobs');
  assert.equal(normalizeQuestion('  EMP Pass!!! '), 'emp pass');
});

test('normalizeQuestion preserves Korean and Chinese characters', () => {
  assert.equal(normalizeQuestion('EP는 무엇이지?'), 'ep는 무엇이지');
  assert.equal(normalizeQuestion('就业准证是什么？'), '就业准证是什么');
});

test('jaccardSimilarity returns high score for near-identical sentence', () => {
  const score = jaccardSimilarity(
    'Can foreigners change jobs while holding Employment Pass',
    'Can foreigners change jobs while holding an Employment Pass in Singapore'
  );
  assert.ok(score > 0.7);
});

test('findDuplicate catches exact and similar question', () => {
  const items = [
    { id: 'EMP-0001', question: 'Can foreigners change jobs while holding an Employment Pass in Singapore?' },
    { id: 'EMP-0002', question: 'What is the difference between Employment Pass and S Pass in Singapore?' }
  ];

  const exact = findDuplicate(items, 'Can foreigners change jobs while holding an Employment Pass in Singapore?');
  assert.equal(exact.type, 'exact');
  assert.equal(exact.item.id, 'EMP-0001');

  const similar = findDuplicate(items, 'Can foreigners change jobs while holding Employment Pass?');
  assert.equal(similar.type, 'similar');
  assert.equal(similar.item.id, 'EMP-0001');
});

test('nextFaqId increments numeric suffix', () => {
  const id = nextFaqId([{ id: 'REL-0008' }, { id: 'REL-0009' }], 'REL');
  assert.equal(id, 'REL-0010');
});
