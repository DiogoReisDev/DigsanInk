// api/send-email.js
// ENV: RESEND_API_KEY
// POST { to, subject, html }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { to, subject, html } = req.body || {};
    if (!to || !subject || !html) return res.status(400).json({ error: 'Campos obrigatórios: to, subject, html' });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Configure RESEND_API_KEY no .env' });

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: 'Pedidos <no-reply@seu-dominio.com>', to, subject, html })
    });
    const data = await r.json();
    if (r.status >= 400) return res.status(r.status).json({ error: 'Falha no envio', detail: data });
    res.status(200).json({ ok: true, id: data?.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno', detail: String(e) });
  }
}
