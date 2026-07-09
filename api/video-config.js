const KV_KEY = 'home-video-url';

async function kvGet() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return null;
  }

  const response = await fetch(`${kvUrl}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${kvToken}` }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.result || null;
}

async function kvSet(value) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return false;
  }

  const response = await fetch(`${kvUrl}/set/${KV_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([value || ''])
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.result === 'OK';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const url = await kvGet();
      res.status(200).json({ ok: true, url: url || '' });
    } catch (error) {
      res.status(200).json({ ok: false, url: '', error: 'storage_unavailable' });
    }
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const url = (body.url || '').toString().trim();

    if (url && !url.startsWith('http')) {
      res.status(400).json({ ok: false, error: 'invalid_url' });
      return;
    }

    try {
      const saved = await kvSet(url);
      if (saved) {
        res.status(200).json({ ok: true });
      } else {
        res.status(503).json({ ok: false, error: 'storage_unavailable' });
      }
    } catch (error) {
      res.status(503).json({ ok: false, error: 'storage_unavailable' });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' });
};
