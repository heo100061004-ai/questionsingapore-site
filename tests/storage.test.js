const test = require('node:test');
const assert = require('node:assert/strict');
const { addQuestion, getQuestions } = require('../dataStore');

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

test('addQuestion stores a new entry and returns it', () => {
  const storage = createMemoryStorage();
  const entry = addQuestion({
    name: '민수',
    category: '고용',
    question: '비자 관련 상담이 가능할까요?',
    contactType: 'email',
    contactValue: 'minsu@example.com',
    language: 'ko'
  }, storage);

  const saved = getQuestions(storage);
  const storedEntry = saved.find((item) => item.id === entry.id);

  assert.ok(storedEntry);
  assert.equal(saved.length, 3);
  assert.equal(storedEntry.category, '고용');
  assert.equal(storedEntry.question, '비자 관련 상담이 가능할까요?');
  assert.equal(storedEntry.contactType, 'email');
  assert.equal(storedEntry.contactValue, 'minsu@example.com');
  assert.equal(storedEntry.language, 'ko');
});
