const { listChatbotLogs } = require('../tools/chatbot-log-store');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const limit = req.query && req.query.limit ? Number(req.query.limit) : 50;
  const logs = listChatbotLogs(limit);

  res.status(200).json({
    ok: true,
    count: logs.length,
    items: logs
  });
};
