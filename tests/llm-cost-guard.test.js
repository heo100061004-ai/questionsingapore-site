const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createLlmBudgetGuard } = require('../tools/llm-cost-guard');

function makeTempStatePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qs-llm-guard-'));
  return path.join(dir, 'state.json');
}

test('blocks new LLM calls when monthly budget is exhausted', () => {
  const guard = createLlmBudgetGuard({ budgetUsd: 0.0001, statePath: makeTempStatePath() });
  guard.recordUsage({ inputTokens: 1000, outputTokens: 1000 });

  const decision = guard.shouldAllowCall({ question: 'Need help', language: 'en', domain: 'employment' });
  assert.equal(decision.allowed, false);
  assert.match(decision.reason, /budget/i);
});

test('reuses cached responses for identical repeated requests', async () => {
  const guard = createLlmBudgetGuard({ statePath: makeTempStatePath(), cacheTtlMs: 1000 });
  let calls = 0;

  const first = await guard.getCachedOrExecute({
    question: 'Can I change jobs?',
    language: 'en',
    domain: 'employment',
    executor: async () => {
      calls += 1;
      return { answer: 'Use the official guidance.' };
    }
  });

  const second = await guard.getCachedOrExecute({
    question: 'Can I change jobs?',
    language: 'en',
    domain: 'employment',
    executor: async () => {
      calls += 1;
      return { answer: 'This should not run.' };
    }
  });

  assert.equal(calls, 1);
  assert.equal(first.answer, second.answer);
});
