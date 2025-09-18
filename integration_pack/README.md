# Integration Pack (Frete + Pagamentos + E-mail)

## O que é
Pacote mínimo para integrar seu site exportado da Hostinger com:
- Cotação de frete (Melhor Envio/Superfrete)
- Checkout (Mercado Pago)
- E-mails transacionais (Resend)

## Deploy rápido (Vercel)
1. Crie um projeto na Vercel e suba a pasta `api/` e `vercel.json`.
2. Adicione as variáveis do `.env.example` no painel da Vercel (Environment Variables).
3. Publique.

## Como usar no Front
- Inclua `frontend/checkout-integration.js` na página do carrinho/checkout.
- Crie um container `<div id="opcoes-frete"></div>` para mostrar as opções.
- Chame no onChange do CEP: 
  ```js
  CotacaoFrete.cotarFrete(cepDestino, [
    { pesoGramas: 350, comprimento: 25, largura: 20, altura: 4, quantidade: 1 } // Exemplo camiseta
  ])
  ```
- No botão "Finalizar compra":
  ```js
  CotacaoFrete.fecharPedido([
    { title: 'Camiseta P&B', quantity: 1, unit_price: 70.00 }
  ], { name: 'Cliente', email: 'cliente@email.com' })
  ```

## E-mails
- Após receber o webhook de pagamento aprovado (ou via página de sucesso), chame `/api/send-email` com `to`, `subject`, `html`.

## Observações
- Ajuste a soma de dimensões/peso no `quote-frete.js` para o seu caso real (múltiplos itens).
- Se preferir PagSeguro em vez de Mercado Pago, crie um endpoint similar ao `checkout.js` usando a API do PagSeguro.
- Para Superfrete, troque a URL/token no `quote-frete.js` conforme documentação.

Boa integração! 🚀
