const { runDocSync } = require('../tools/sync-doc-index-to-faq');

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

  if (!isAuthorized(req)) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  const body = req.body || {};
  const files = Array.isArray(body.files)
    ? body.files.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  try {
    const summary = await runDocSync({
      threshold: body.threshold,
      dryRun: body.dryRun,
      syncLocales: body.syncLocales,
      files
    });

    res.status(200).json({
      ok: true,
      warning: process.env.ADMIN_API_TOKEN ? null : 'ADMIN_API_TOKEN is not set. Configure token for production safety.',
      summary
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error && error.message ? error.message : 'Failed to run doc sync'
    });
  }
};