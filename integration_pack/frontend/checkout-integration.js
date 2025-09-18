// frontend/checkout-integration.js
// Adapte os seletores para seu HTML. Este script:
// 1) Captura CEP e itens do carrinho
// 2) Consulta /api/quote-frete
// 3) Mostra opções e grava escolha
// 4) Chama /api/checkout e redireciona para o pagamento
(() => {
  const state = { frete: null, ofertas: [] };

  async function cotarFrete(destinoCep, items) {
    const r = await fetch('/api/quote-frete', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ destinoCep, items })
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    state.ofertas = data.ofertas || [];
    renderOpcoesFrete();
  }

  function renderOpcoesFrete() {
    const box = document.querySelector('#opcoes-frete');
    if (!box) return;
    box.innerHTML = '';
    state.ofertas.forEach(of => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'frete-option';
      btn.textContent = `${of.transportadora} • ${of.servico} • R$ ${Number(of.valor).toFixed(2)} • ${of.prazoDias || '?'}d`;
      btn.addEventListener('click', () => {
        state.frete = of;
        document.querySelectorAll('.frete-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      box.appendChild(btn);
    });
  }

  async function fecharPedido(items, buyer) {
    if (!state.frete) { alert('Selecione um frete'); return; }
    const r = await fetch('/api/checkout', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ items, buyer, freteSelecionado: { servico: state.frete.servico, valor: state.frete.valor } })
    });
    const data = await r.json();
    if (data.error) { alert('Erro no checkout'); console.error(data); return; }
    window.location.href = data.init_point; // redireciona para o pagamento
  }

  // Exponha funções globais simples para conectar nos botões do seu HTML
  window.CotacaoFrete = { cotarFrete, fecharPedido };
})();
