# Diagnóstico da integração AbacatePay

> Levantamento de 13/08/2026. Nenhuma correção foi aplicada — este documento
> registra o estado encontrado para que as decisões não se percam.

## Resumo

O apoio recorrente não funciona hoje, por dois motivos independentes:

1. **Bloqueio de plataforma:** a loja não tem cartão habilitado, e assinatura no
   AbacatePay só existe via cartão.
2. **Bugs no código:** mesmo com o cartão liberado, o webhook não conseguiria
   conceder o benefício a ninguém.

O segundo só aparece depois de resolver o primeiro, mas os dois precisam de
correção.

---

## 1. Bloqueio de plataforma

Rodando em preview na Vercel, `POST /subscriptions/create` responde:

```
HTTP 400: CARD is not available for this store
```

O AbacatePay pausou o cartão para novos entrantes ([anúncio do
fundador](https://x.com/daniellimae/status/2080730941723447704)): quem já tinha a
funcionalidade ativa em produção continua; contas novas, não.

E assinatura recorrente lá só existe via `CARD` — o
[`llms.txt`](https://www.abacatepay.com/llms.txt) do site traz a seção
"Assinaturas" inteira comentada, com `["CARD"]` como único método. As páginas de
marketing citam recorrência por PIX a R$ 0,80/parcela, mas isso aponta para
`frequency: MULTIPLE_PAYMENTS` da API v1 — uma cobrança que aceita vários
pagamentos, não débito automático.

**Consequência:** `models/contribution.js:34` está bloqueado na origem.

### Saídas possíveis

| Rota                    | O que envolve                                                                                          | Custo em R$ 9,90      |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | --------------------- |
| **A) Habilitar cartão** | Pedir liberação ao suporte. Sem prazo, e a pausa sugere que pode ser negado. Mantém o código atual.    | 3,5% + R$ 0,60 → 9,6% |
| **B) PIX de 30 dias**   | Cobrança avulsa que concede 30 dias de apoiante, expirando pelo cron diário. Não depende de aprovação. | R$ 0,80 fixo → 8,1%   |

A rota B reaproveita estrutura que já existe: o comentário em
`models/abacatepay.js:4` já previa `/transparents`, a migration já tem
`method: 'pix'` e `kind: 'one_time'`, e o `vercel.json` já roda um cron diário.
Faltaria uma coluna de validade (`supporter_until`) e tratar
`checkout.completed` / `transparent.completed` no webhook.

---

## 2. Bugs no código

### 🔴 Bloqueadores

**B1. `resolveUserId` nunca casa com o payload real** — `models/contribution.js:114-139`

O código procura `data.id`, `data.customerId` e `data.customer.email`. A v2 envia
a assinatura aninhada:

```json
{
  "id": "log_...",
  "event": "subscription.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "subscription": {
      "id": "subs_...",
      "customerId": "cust_...",
      "status": "ACTIVE"
    }
  }
}
```

Verificado rodando esse payload contra o modelo com o usuário existindo no banco:
resultado `{"unmatched": true}`. O webhook responde 200 sem conceder nada.

**B2. As três estratégias de resolução estão quebradas na origem**

Mesmo corrigindo o caminho dos campos:

- `users.abacatepay_customer_id` **nunca é preenchido**: `abacatepay.createCustomer`
  (`models/abacatepay.js:72`) está implementado mas nunca é chamado, e
  `startSubscription` não passa `customerId`. Confirmado no banco: a coluna está
  nula em todos os registros.
- O `provider_id` gravado é o id do **checkout** (`bill_...`), não da assinatura —
  `POST /subscriptions/create` cria um checkout, e o webhook traz `subs_...`.
  Nunca casam, e `updatePaymentStatus` (`:162`) nunca acerta uma linha.
- O e-mail do checkout hospedado é digitado pelo cliente e pode não ser o da conta.

**B3. Eventos não resolvidos são marcados como processados** — `models/contribution.js:91`

`recordEvent` roda mesmo no caso `unmatched`. Depois de corrigir B1 e B2, os
eventos já entregues não serão reprocessados numa reentrega: será preciso limpar
`abacatepay_webhook_events` ou conceder o benefício manualmente.

**B4. Chave do HMAC possivelmente errada** — `models/abacatepay.js:12,101`

A documentação é ambígua: a página de webhooks fala na "chave pública do
AbacatePay", a de referência fala em HMAC "usando o `secret` informado". Se for a
segunda, todo webhook com header `x-webhook-signature` é rejeitado com 401 em
`pages/api/v1/webhooks/abacatepay/index.js:59`. Confirmar nos logs.

### 🟡 Importantes

**B5. Os testes validam um contrato que não existe** — `tests/unit/models/contribution.test.js:48-54`

Usam `charge.paid` / `charge.failed` (eventos da v1, inexistentes na v2) e
`data.customer.email`. Passam 10/10 e mascaram exatamente o B1. Também não existe
teste de integração para `/api/v1/webhooks/abacatepay` nem para
`/api/v1/support/subscription`.

**B6. `grant` não devolve o cargo do Discord** — `models/contribution.js:105`

`revokeSupporter` remove o cargo, mas a concessão só o reatribui pelo callback
OAuth. Quem cancela e volta a assinar fica sem cargo até reconectar o Discord.

**B7. Estorno e chargeback não revogam** — `models/contribution.js:19`

`REVOKE_EVENT` não cobre `checkout.refunded`, `transparent.refunded`,
`checkout.disputed` nem `transparent.disputed`.

**B8. Nada impede assinar duas vezes, e não há como cancelar**

`pages/apoiar/index.js` não checa `features.includes("apoiador")` — um apoiante
ativo pode abrir outro checkout e ser cobrado em dobro. Não existe cancelamento
no site (relevante para o CDC: cancelamento pelo mesmo canal da contratação).

**B9. Sem trilha financeira** — `models/contribution.js:45`

`amount_cents` fica sempre `null` embora a resposta traga `amount`, e como o
`provider_id` não casa, nenhum pagamento chega a ser marcado como PAID.

**B10. O código ignora `devMode`**

O payload v2 traz `devMode: true|false` e nada no repo lê esse campo. Com a chave
de DEV ativa em preview e um único webhook cadastrado, um evento simulado pode
conceder apoiante de verdade.

### 🟢 Menores

- `PAID_EVENT` (`models/contribution.js:12`) casa também com `transfer.completed`,
  `payout.completed` e `checkout.completed`; melhor listar os eventos explicitamente.
- `REVOKE_EVENT` cobre `expired` / `suspended` / `ended`, que não existem na v2 —
  o único evento terminal é `subscription.cancelled`, com `cancelledDueTo`.
- A comparação do `webhookSecret` (`webhooks/abacatepay/index.js:46`) não é
  timing-safe, ao contrário da do HMAC.
- `readRawBody` não tem limite de tamanho.
- Código e documentação em descompasso: `createCustomer` nunca usado, comentário
  citando um fluxo PIX `/transparents` inexistente, `method: 'pix'` e
  `kind: 'one_time'` na migration sem uso, e `SupportButton.js:6` prometendo
  "assinatura mensal ou PIX".
- `R$ 9,90` hardcoded em `CardApoiar.js:5`, desacoplado do produto no painel.
- `completionUrl` aponta para `/sessao?apoio=sucesso`, mas `pages/sessao/index.js`
  ignora esse parâmetro — nenhum feedback pós-pagamento.
- `revoke` não distingue apoiante concedido manualmente de assinante.

---

## 3. Configuração de ambiente

Estado das variáveis na Vercel:

| Variável                        | Ambientes              |
| ------------------------------- | ---------------------- |
| `ABACATEPAY_API_KEY`            | **Preview apenas**     |
| `ABACATEPAY_MONTHLY_PRODUCT_ID` | Production and Preview |
| `ABACATEPAY_WEBHOOK_SECRET`     | Production and Preview |

- **A chave da API não está em Production.** Lá, `getApiKey()`
  (`models/abacatepay.js:15`) lança na hora e o botão devolve "O sistema de apoio
  está indisponível no momento".
- **Nenhuma está em Development**, e o `.env.development` também não as tem — por
  isso o webhook local responde `500 ABACATEPAY_WEBHOOK_SECRET não configurado`.
  Para testar local, marcar as três para Development e usar `vercel env pull`, ou
  colar num `.env.local` — **adicionando `.env.local` ao `.gitignore` antes**, já
  que hoje ele só ignora `.env copy.development`.

---

## 4. Como confirmar o payload real

O handler já loga o suficiente. Numa assinatura de teste em preview, procurar a
linha `[abacatepay webhook] recebido` e olhar `dataKeys`:

- `["subscription"]` → confirma o B1.
- outra coisa → o payload mudou, e o diagnóstico do B1 precisa ser revisto.

---

## 5. Correção proposta (quando destravar)

Na ordem:

1. Criar o customer no AbacatePay a partir da conta (`createCustomer`), salvar em
   `users.abacatepay_customer_id` e passar `customerId` + `externalId: user.id`
   no create. Resolve B2 e já pré-preenche o checkout.
2. Ler `data.subscription ?? data` no webhook, resolvendo por `customerId` e
   `externalId`. Resolve B1.
3. Só gravar o evento como processado quando ele for resolvido. Resolve B3.
4. Validar `devMode` contra o ambiente. Resolve B10.
5. Reescrever os testes com o payload real da v2 e cobrir os dois endpoints.
   Resolve B5.
