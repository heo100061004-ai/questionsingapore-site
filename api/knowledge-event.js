const { ingestKnowledgeEvent } = require('../tools/faq-auto-ingest');

function isAuthorized(req) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return true;
  }

  const incoming = (req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token'])) || '';
  return String(incoming) === String(token);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const body = req.body || {};
  const eventType = String(body.eventType || '').trim();

  if (!eventType) {
    res.status(400).json({ ok: false, message: 'eventType is required' });
    return;
  }

  if (eventType === 'answered' && !isAuthorized(req)) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  try {
    const result = ingestKnowledgeEvent(eventType, body.payload || {});
    res.status(200).json({
      ok: true,
      warning: process.env.ADMIN_API_TOKEN ? null : 'ADMIN_API_TOKEN is not set. Configure token for production safety.',
      result
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error && error.message ? error.message : 'Failed to ingest knowledge event'
    });
  }
};