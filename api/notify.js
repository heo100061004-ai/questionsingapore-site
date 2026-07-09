function formatContactType(type) {
  if (type === 'whatsapp') {
    return 'WhatsApp';
  }
  return 'Email';
}

function safeText(value) {
  return (value || '').toString().trim();
}

function buildMailBody(payload) {
  const lines = [
    'Question Singapore 신규 문의가 접수되었습니다.',
    '',
    `이름: ${safeText(payload.name) || '-'}`,
    `카테고리: ${safeText(payload.category) || '-'}`,
    `문의 언어: ${safeText(payload.language) || '-'}`,
    `연락 방식: ${formatContactType(safeText(payload.contactType))}`,
    `연락처: ${safeText(payload.contactValue) || '-'}`,
    `접수 시각: ${safeText(payload.createdAt) || '-'}`,
    `문의 ID: ${safeText(payload.id) || '-'}`,
    '',
    '질문 내용:',
    safeText(payload.question) || '-'
  ];

  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ADMIN_NOTIFY_EMAIL;
  const fromEmail = process.env.ADMIN_FROM_EMAIL || 'Question Singapore <onboarding@resend.dev>';

  if (!apiKey || !toEmail) {
    res.status(500).json({ ok: false, message: 'Missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL' });
    return;
  }

  const payload = req.body || {};
  const mailBody = buildMailBody(payload);

  try {
    const sendResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[Question Singapore] 신규 문의: ${safeText(payload.category) || 'General'}`,
        text: mailBody
      })
    });

    if (!sendResult.ok) {
      const errorText = await sendResult.text();
      res.status(502).json({ ok: false, message: 'Resend API failed', detail: errorText });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Unknown notify error' });
  }
};
