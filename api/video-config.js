const EC_KEY = 'home-video-url';

function parseEdgeConfig(connectionString) {
  try {
    const url = new URL(connectionString);
    const id = url.pathname.replace(/^\//, '').split('?')[0];
    const token = url.searchParams.get('token') || '';
    return { id, token };
  } catch {
    return null;
  }
}

async function ecGet() {
  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) {
    return null;
  }

  const parsed = parseEdgeConfig(connectionString);
  if (!parsed) {
    return null;
  }

  const response = await fetch(
    `https://edge-config.vercel.com/${parsed.id}/item/${EC_KEY}`,
    { headers: { Authorization: `Bearer ${parsed.token}` } }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return typeof data === 'string' ? data : null;
}

async function ecSet(value) {
  const connectionString = process.env.EDGE_CONFIG;
  const vercelToken = process.env.VERCEL_ACCESS_TOKEN;

  if (!connectionString || !vercelToken) {
    return false;
  }

  const parsed = parseEdgeConfig(connectionString);
  if (!parsed) {
    return false;
  }

  const response = await fetch(
    `https://api.vercel.com/v1/edge-config/${parsed.id}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: EC_KEY, value: value || '' }]
      })
    }
  );

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.status === 'ok';
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
      const url = await ecGet();
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

    if (!process.env.VERCEL_ACCESS_TOKEN) {
      res.status(503).json({ ok: false, error: 'missing_vercel_token' });
      return;
    }

    try {
      const saved = await ecSet(url);
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
