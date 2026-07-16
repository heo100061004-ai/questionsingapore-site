const fs = require('node:fs');
const path = require('node:path');

const TMP_FILE = path.join('/tmp', 'question-singapore-chatbot-logs.json');
const MAX_LOGS = 200;

function readLogs() {
  try {
    if (!fs.existsSync(TMP_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(TMP_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeLogs(logs) {
  try {
    fs.writeFileSync(TMP_FILE, `${JSON.stringify(logs, null, 2)}\n`, 'utf8');
  } catch (error) {
    // Ignore write failures in restricted environments.
  }
}

function addChatbotLog(entry) {
  const normalized = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    question: (entry && entry.question ? String(entry.question) : '').trim(),
    answer: (entry && entry.answer ? String(entry.answer) : '').trim(),
    language: (entry && entry.language ? String(entry.language) : 'ko').trim(),
    source: (entry && entry.source ? String(entry.source) : 'unknown').trim(),
    score: entry && Number.isFinite(Number(entry.score)) ? Number(entry.score) : null,
    category: (entry && entry.category ? String(entry.category) : '').trim()
  };

  const logs = readLogs();
  logs.unshift(normalized);
  const limited = logs.slice(0, MAX_LOGS);
  writeLogs(limited);
  return normalized;
}

function listChatbotLogs(limit = 50) {
  const max = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const safeLimit = Math.min(Math.max(max, 1), MAX_LOGS);
  return readLogs().slice(0, safeLimit);
}

module.exports = {
  addChatbotLog,
  listChatbotLogs
};
