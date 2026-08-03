const { getDocUpdateArchive } = require('../tools/auto-ingest-raw-docs');

function isAuthorized(req) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return true;
  }

  const incoming = (req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token'])) || '';
  return String(incoming) === String(token);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  const limit = req.query && req.query.limit ? Number(req.query.limit) : 120;

  try {
    const archive = getDocUpdateArchive(limit);
    res.status(200).json({
      ok: true,
      warning: process.env.ADMIN_API_TOKEN ? null : 'ADMIN_API_TOKEN is not set. Configure token for production safety.',
      ...archive
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error && error.message ? error.message : 'Failed to load archive'
    });
  }
};
