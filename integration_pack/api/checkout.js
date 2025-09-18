// api/checkout.js
// Cria preferência de pagamento (Mercado Pago) e retorna init_point
// ENV: MP_ACCESS_TOKEN, MP_PUBLIC_KEY
// POST { items: [{title, quantity, unit_price}], buyer: {name, email}, freteSelecionado: {servico, valor} }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items, buyer, freteSelecionado } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Items ausentes' });
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) return res.status(500).json({ error: 'Configure MP_ACCESS_TOKEN no .env' });

    // Soma itens + frete
    const valorFrete = Number(freteSelecionado?.valor || 0);
    const mpItems = items.map(it => ({
      title: it.title,
      quantity: Number(it.quantity || 1),
      unit_price: Number(it.unit_price || 0),
      currency_id: 'BRL'
    }));
    if (valorFrete > 0) {
      mpItems.push({
        title: `Frete: ${freteSelecionado?.servico || 'Entrega'}`,
        quantity: 1,
        unit_price: valorFrete,
        currency_id: 'BRL'
      });
    }

    const pref = {
      items: mpItems,
      payer: {
        name: buyer?.name || undefined,
        email: buyer?.email || undefined
      },
      back_urls: {
        success: 'https://seu-dominio/sucesso',
        failure: 'https://seu-dominio/erro',
        pending: 'https://seu-dominio/pending'
      },
      auto_return: 'approved'
    };

    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pref)
    });
    const data = await r.json();
    if (r.status >= 400) return res.status(r.status).json({ error: 'Falha ao criar preferência', detail: data });

    res.status(200).json({ init_point: data.init_point, id: data.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno', detail: String(e) });
  }
}
