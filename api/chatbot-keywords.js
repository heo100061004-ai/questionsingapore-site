const { listChatbotLogs } = require('../tools/chatbot-log-store');

function normalizeCategory(value = '') {
  const category = String(value || '').toLowerCase();
  if (category.includes('recruitment') || category.includes('채용') || category.includes('employment') || category.includes('고용') || category.includes('就业')) {
    return 'recruitment';
  }
  if (category.includes('property') || category.includes('부동산') || category.includes('房地产')) {
    return 'property';
  }
  if (category.includes('relocation') || category.includes('리로케이션') || category.includes('搬迁')) {
    return 'relocation';
  }
  return 'recruitment';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const limit = req.query && req.query.limit ? Number(req.query.limit) : 120;
  const logs = listChatbotLogs(limit);
  const counter = new Map();

  for (const log of logs) {
    const question = String(log && log.question ? log.question : '').trim();
    if (!question) {
      continue;
    }

    const category = normalizeCategory(log && log.category ? log.category : '');
    const key = `${category}::${question}`;
    const current = counter.get(key) || {
      category,
      question,
      count: 0,
      latestAt: ''
    };

    current.count += 1;
    const createdAt = String(log && log.createdAt ? log.createdAt : '');
    if (!current.latestAt || createdAt > current.latestAt) {
      current.latestAt = createdAt;
    }

    counter.set(key, current);
  }

  const items = Array.from(counter.values())
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return String(b.latestAt).localeCompare(String(a.latestAt));
    })
    .slice(0, 60);

  res.status(200).json({
    ok: true,
    count: items.length,
    items
  });
};
