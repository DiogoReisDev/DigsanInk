// api/quote-frete.js
// Vercel Serverless Function (Node 20). Cota frete em tempo real.
// ENV necessários: MELHOR_ENVIO_TOKEN ou SUPERFRETE_TOKEN, ORIGEM_CEP, ORIGEM_UF, ORIGEM_CIDADE
// Requisição: POST JSON { destinoCep, items: [{pesoGramas, comprimento, largura, altura, quantidade}] }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { destinoCep, items } = req.body || {};
    if (!destinoCep || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    // Converte itens para um pacote simples (soma pesos/dimensões). Ajuste para múltiplos pacotes se precisar.
    const totalPesoGramas = items.reduce((acc, it) => acc + (it.pesoGramas || 0) * (it.quantidade || 1), 0);
    const comprimento = Math.max(...items.map(i => i.comprimento || 20));
    const largura = Math.max(...items.map(i => i.largura || 15));
    const altura = items.reduce((acc, it) => acc + (it.altura || 2) * (it.quantidade || 1), 0);

    // Escolha a API: MELHOR_ENVIO ou SUPERFRETE. Aqui mostramos MELHOR_ENVIO como exemplo.
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Token de frete ausente. Configure MELHOR_ENVIO_TOKEN no .env' });
    }

    // Monta payload (documentação da Melhor Envio pode mudar; adapte os campos conforme versão)
    const payload = {
      from: {
        postal_code: process.env.ORIGEM_CEP || '06404-000'
      },
      to: {
        postal_code: destinoCep
      },
      // pacote simplificado (1 volume)
      packages: [{
        height: Math.max(2, Math.ceil(altura)),
        width: Math.max(15, Math.ceil(largura)),
        length: Math.max(20, Math.ceil(comprimento)),
        weight: Math.max(0.3, Number((totalPesoGramas/1000).toFixed(2)))
      }],
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0
      },
      // services: [] // opcional: limitar a PAC/SEDEX etc.
    };

    const r = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'Falha na cotação de frete', detail: txt });
    }
    const data = await r.json();

    // Normaliza resposta para o front
    const ofertas = (Array.isArray(data) ? data : []).map(s => ({
      id: s.id || s.service_id || `${s.company?.name}-${s.name}`,
      transportadora: s.company?.name || 'Correios/Transportadora',
      servico: s.name || s.service || 'Serviço',
      prazoDias: s.delivery_range?.min || s.delivery_time?.days || null,
      valor: s.price || s.delivery_price || null,
      logo: s.company?.picture || null
    }));

    res.status(200).json({ ofertas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno', detail: String(err) });
  }
}
