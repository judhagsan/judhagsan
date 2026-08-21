import { useEffect, useRef, useState } from "react";
import {
  HeartFillIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
  CopyIcon,
  ZapIcon,
  CreditCardIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const ADVANTAGES = ["Vantagem selo", "Vantagem discord", "Vantagem mural"];

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

// Estados em que existe assinatura para mostrar. `cancelled` fica de fora de
// propósito: quem cancelou pode assinar de novo, então volta a ver o
// formulário no próximo carregamento.
const LIVE_STATUSES = ["authorized", "paused", "pending"];

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400/50 outline-none text-sm text-white/90 transition-colors";

// Apoio mensal ao Pindorama, cobrado pelo Mercado Pago.
//
// O cartão não passa por aqui nem pelo nosso servidor: número, validade e CVV
// vivem dentro de iframes do próprio Mercado Pago (Secure Fields), e o SDK
// devolve um token de uso único. É só o token que sobe para a nossa API.
//
// Quando a cobrança do cartão é recusada, o Pix de reposição é a saída manual:
// paga-se um ciclo na mão sem esperar a retentativa do Mercado Pago.
export default function CardApoiar() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState("carregando");
  const [errorMessage, setErrorMessage] = useState(null);
  const [monthlyValue, setMonthlyValue] = useState(null);
  const [pix, setPix] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const fieldsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        // Estado e configuração vêm juntos: quem já assina não precisa esperar
        // o SDK carregar para saber em que pé está o próprio apoio.
        const [configResponse, stateResponse] = await Promise.all([
          fetch("/api/v1/support/config"),
          fetch("/api/v1/support/subscription"),
        ]);

        if (!configResponse.ok) throw new Error("config");

        const config = await configResponse.json();
        if (cancelled) return;

        setMonthlyValue(config.monthly_value);

        const state = stateResponse.ok ? await stateResponse.json() : null;
        if (cancelled) return;

        // Assinatura viva ocupa o lugar do formulário. Os Secure Fields nem
        // chegam a ser montados: os containers não existem nesse caminho, e
        // montar iframe em elemento ausente quebra o SDK.
        if (state && LIVE_STATUSES.includes(state.status)) {
          setSubscription(state);
          setStatus("assinatura");
          return;
        }

        if (!config.public_key) throw new Error("sem chave");

        await loadScript();
        if (cancelled) return;

        const mp = new window.MercadoPago(config.public_key, {
          locale: "pt-BR",
        });

        // Os três campos sensíveis são iframes montados pelo SDK. O estilo vai
        // por parâmetro porque o CSS daqui não alcança dentro deles.
        const style = {
          color: "#e5e7eb",
          fontSize: "14px",
          placeholderColor: "#6b7280",
        };

        mp.fields.create("cardNumber", { style }).mount("mp-card-number");
        mp.fields
          .create("expirationDate", { style, placeholder: "MM/AA" })
          .mount("mp-expiration");
        mp.fields.create("securityCode", { style }).mount("mp-security-code");

        fieldsRef.current = mp.fields;
        setStatus("pronto");
      } catch {
        if (!cancelled) setStatus("indisponivel");
      }
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setErrorMessage(null);
    setStatus("processando");

    try {
      const { id: cardTokenId } = await fieldsRef.current.createCardToken({
        cardholderName: form.get("cardholder_name"),
        identificationType: "CPF",
        identificationNumber: form.get("document_number"),
      });

      const response = await fetch("/api/v1/support/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_token_id: cardTokenId }),
      });

      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.message || t("Erro ao iniciar apoio"));
        setStatus("pronto");
        return;
      }

      // O que acabou de acontecer não é pagamento: é assinatura autorizada. O
      // painel de estado diz isso com todas as letras, inclusive a validação
      // de R$ 0,00 que o Mercado Pago faz no cartão e que chega por e-mail
      // parecendo cobrança.
      setSubscription({
        status: body.status,
        is_supporter: false,
        supporter_until: null,
        next_payment_date: body.next_payment_date || null,
      });
      setStatus("assinatura");
    } catch (error) {
      // O SDK rejeita com uma lista de códigos (invalid_card_number,
      // invalid_expiry_date, invalid_security_code, invalid_identification_
      // number...). Sem isso no console, todo problema de cartão vira a mesma
      // frase e não há como saber qual campo recusou.
      //
      // Fica fora de produção: não há dado de cartão aqui — ele vive dentro
      // dos iframes do Mercado Pago —, mas é diagnóstico interno e não tem por
      // que aparecer no console de quem só quer apoiar. A checagem é por
      // VERCEL_ENV, não por NODE_ENV: preview também roda como produção, e é
      // exatamente onde o log precisa aparecer.
      if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") {
        console.error("Falha ao tokenizar o cartão:", error?.cause || error);
      }

      setErrorMessage(t("Erro no cartao"));
      setStatus("pronto");
    }
  }

  async function handlePix() {
    // O Pix é oferecido em dois lugares — no formulário e no painel de uma
    // assinatura com cobrança recusada. Falhando, tem que voltar para o de
    // onde saiu, senão quem tem assinatura cai no formulário de criar outra.
    const previousStatus = status;

    setErrorMessage(null);
    setStatus("processando");

    try {
      const response = await fetch("/api/v1/support/pix", { method: "POST" });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.message || t("Erro ao iniciar apoio"));
        setStatus(previousStatus);
        return;
      }

      setPix(body);
      setStatus("pix");
    } catch {
      setErrorMessage(t("Erro ao iniciar apoio"));
      setStatus(previousStatus);
    }
  }

  async function handleCancel() {
    setErrorMessage(null);
    setStatus("cancelando");

    try {
      const response = await fetch("/api/v1/support/subscription", {
        method: "DELETE",
      });

      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.message || t("Erro ao cancelar"));
        setStatus("assinatura");
        return;
      }

      setSubscription((current) => ({ ...current, status: body.status }));
      setStatus("assinatura");
    } catch {
      setErrorMessage(t("Erro ao cancelar"));
      setStatus("assinatura");
    }
  }

  async function copyPixCode() {
    await navigator.clipboard.writeText(pix.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Havendo assinatura, o painel dela é a tela — inclusive durante um cancelamento
  // ou um Pix em curso. A única exceção é o QR, que precisa da tela inteira.
  //
  // O título do estado sobe para o cabeçalho do card: ele já tem um ícone e um
  // <h2>, então repetir título e ícone dentro do corpo era dizer a mesma coisa
  // duas vezes, e empurrava o texto que importa para baixo da dobra.
  if (subscription && status !== "pix") {
    const state = describeSubscription({ t, language, subscription });

    return (
      <Shell title={state.title}>
        <SubscriptionState
          t={t}
          state={state}
          cancelled={subscription.status === "cancelled"}
          monthlyValue={monthlyValue}
          errorMessage={errorMessage}
          busy={status === "cancelando" || status === "processando"}
          cancelling={status === "cancelando"}
          onCancel={handleCancel}
          onPix={handlePix}
        />
      </Shell>
    );
  }

  if (status === "pix" && pix) {
    return (
      <Shell title={t("Apoiar o Pindorama")}>
        <PixPayment t={t} pix={pix} copied={copied} onCopy={copyPixCode} />
      </Shell>
    );
  }

  return (
    <Shell
      title={
        monthlyValue
          ? t("Apoie o Pindorama por valor e receba", {
              valor: formatValue(monthlyValue) + t("sufixo mes"),
            })
          : t("Apoie o Pindorama e receba")
      }
    >
      <Advantages t={t} />

      {status === "indisponivel" ? (
        <p className="text-sm text-white/60 leading-snug mt-4">
          {t("Texto apoio indisponivel")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
          {/* Os campos ficam sempre montados: os Secure Fields são iframes e
              precisam do container no DOM para medir a si mesmos — esconder
              com `display: none` os quebra. A revelação anima
              `grid-template-rows` de 0fr para 1fr, que é o jeito de animar
              altura automática sem fixar pixel. `inert` tira os campos do
              tab enquanto estão fechados. */}
          <div
            inert={expanded ? undefined : ""}
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden min-h-0">
              <div
                className={`flex flex-col gap-3 pb-1 transition-opacity duration-300 ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
              >
                <Field label={t("Nome no cartao")}>
                  <input
                    name="cardholder_name"
                    autoComplete="cc-name"
                    required
                    className={INPUT_CLASS}
                  />
                </Field>

                <Field label={t("Numero do cartao")}>
                  <div
                    id="mp-card-number"
                    className={INPUT_CLASS + " h-[38px]"}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label={t("Validade")}>
                    <div
                      id="mp-expiration"
                      className={INPUT_CLASS + " h-[38px]"}
                    />
                  </Field>
                  <Field label="CVV">
                    <div
                      id="mp-security-code"
                      className={INPUT_CLASS + " h-[38px]"}
                    />
                  </Field>
                </div>

                <Field label="CPF">
                  <input
                    name="document_number"
                    inputMode="numeric"
                    required
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-red-300 text-xs flex items-start gap-2 animate-[fadeIn_0.3s_ease-out]">
              <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}

          {/* Lado a lado, com a mesma largura: a hierarquia entre eles vem da
              cor, não do tamanho. O wrap cobre a tela estreita, onde os dois
              rótulos não cabem na mesma linha. */}
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              type={expanded ? "submit" : "button"}
              onClick={expanded ? undefined : () => setExpanded(true)}
              disabled={status !== "pronto"}
              className="cursor-pointer flex-1 min-w-[9rem] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 hover:border-cyan-400/70 text-cyan-100 font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCardIcon size={14} />
              {status === "processando"
                ? t("Processando...")
                : t("Pagar com cartao")}
            </button>

            {/* Saída para quem teve o cartão recusado e não quer esperar a
              retentativa automática do Mercado Pago. Fica acima da explicação
              da recorrência porque é ação, e a explicação é rodapé. */}
            <button
              type="button"
              onClick={handlePix}
              disabled={status !== "pronto"}
              className="cursor-pointer flex-1 min-w-[9rem] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/40 hover:border-emerald-400/70 text-emerald-100 font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZapIcon size={14} />
              {t("Pagar com Pix")}
            </button>
          </div>

          {/* Uma frase por linha: a quebra sai do ponto final, não da largura
              do card, então ela é a mesma em qualquer tela e nos dois idiomas. */}
          <p className="text-xs text-white/40 leading-snug text-left">
            {splitSentences(t("Texto cobranca recorrente")).map((sentence) => (
              <span key={sentence} className="block">
                {sentence}
              </span>
            ))}
          </p>
        </form>
      )}
    </Shell>
  );
}

// Quebra o texto em frases, devolvendo o ponto final para cada uma. Sem
// lookbehind de propósito: Safari antigo não parseia, e um erro de sintaxe em
// regex derruba o bundle inteiro, não só esta linha.
function splitSentences(text) {
  const parts = text.split(". ");

  return parts.map((part, index) =>
    index < parts.length - 1 ? part + "." : part,
  );
}

function formatValue(value) {
  if (typeof value !== "number") return "";

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function loadScript() {
  if (window.MercadoPago) return Promise.resolve();

  const existing = document.querySelector('script[src="' + SDK_URL + '"]');

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
}

// Onde o dinheiro está, em uma tela.
//
// A assinatura ser autorizada não é o mesmo que a cobrança ter passado, e essa
// distinção é a fonte de toda a confusão: o Mercado Pago valida o cartão em
// R$ 0,00 na criação e manda um e-mail que parece recibo. Cada estado abaixo
// diz o que já aconteceu, o que falta, e o que a pessoa pode fazer a respeito.
function describeSubscription({ t, language, subscription }) {
  const { status, is_supporter, supporter_until, next_payment_date } =
    subscription;

  if (status === "cancelled") {
    return {
      tone: "neutral",
      title: t("Assinatura cancelada"),
      lines: [t("Texto assinatura cancelada")],
    };
  }

  if (status === "paused") {
    return {
      tone: "alert",
      title: t("Cobranca recusada"),
      lines: [t("Texto cobranca recusada")],
      offerPix: true,
    };
  }

  if (status === "pending") {
    return {
      tone: "alert",
      title: t("Assinatura pendente"),
      lines: [t("Texto assinatura pendente")],
    };
  }

  // Autorizada com benefício já concedido: alguma cobrança foi aprovada.
  if (is_supporter) {
    return {
      tone: "success",
      title: t("Apoio ao Pindorama ativo"),
      lines: [
        supporter_until &&
          t("Texto beneficios ate", {
            data: formatDate(supporter_until, language),
          }),
        next_payment_date &&
          t("Texto proxima cobranca", {
            data: formatDate(next_payment_date, language),
          }),
      ].filter(Boolean),
    };
  }

  // Autorizada e ainda sem benefício: a primeira cobrança não saiu.
  return {
    tone: "success",
    title: t("Aguardando a cobranca"),
    lines: [t("Texto cobranca a caminho"), t("Texto validacao cartao")],
  };
}

function SubscriptionState({
  t,
  state,
  cancelled,
  monthlyValue,
  errorMessage,
  busy,
  cancelling,
  onCancel,
  onPix,
}) {
  const { tone, lines, offerPix } = state;

  // Alinhado à esquerda e sem ícone: o cabeçalho do card já carrega o ícone e
  // o estado. Aqui embaixo o que importa é o texto ser lido — e texto corrido
  // centralizado, com três linhas de explicação, é justamente o que não se lê.
  return (
    <div className="flex flex-col gap-2 text-left animate-[fadeIn_0.3s_ease-out]">
      {monthlyValue && !cancelled && (
        <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">
          {t("Valor por mes", { valor: formatValue(monthlyValue) })}
        </p>
      )}

      {lines.map((line) => (
        <p
          key={line}
          className={`text-sm leading-snug ${
            tone === "alert" ? "text-amber-200/90" : "text-white/60"
          }`}
        >
          {line}
        </p>
      ))}

      {errorMessage && (
        <p className="text-red-300 text-xs flex items-start gap-2">
          <AlertFillIcon size={14} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Cancelar é a saída que faltava: até aqui a assinatura só podia ser
          desfeita pelo painel do Mercado Pago, que ninguém sabe que existe. */}
      {!cancelled && (
        <div className="flex flex-wrap gap-2 mt-2 w-full">
          {offerPix && (
            <button
              type="button"
              onClick={onPix}
              disabled={busy}
              className="cursor-pointer flex-1 min-w-[9rem] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/40 hover:border-emerald-400/70 text-emerald-100 font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZapIcon size={14} />
              {t("Pagar com Pix")}
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer flex-1 min-w-[9rem] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelling ? t("Cancelando...") : t("Cancelar assinatura")}
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(value, language) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(language === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function PixPayment({ t, pix, copied, onCopy }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-2 animate-[fadeIn_0.3s_ease-out]">
      <p className="text-base text-white/90 font-semibold">
        {t("Escaneie o QR Code")}
      </p>

      {pix.qr_code_base64 && (
        <img
          src={"data:image/png;base64," + pix.qr_code_base64}
          alt="QR Code Pix"
          className="w-44 h-44 rounded-xl bg-white p-2"
        />
      )}

      <button
        type="button"
        onClick={onCopy}
        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-colors"
      >
        <CopyIcon size={14} />
        {copied ? t("Codigo copiado") : t("Copiar codigo pix")}
      </button>

      <p className="text-[11px] text-white/40 leading-snug">
        {t("Texto pix pontual")}
      </p>
    </div>
  );
}

function Advantages({ t }) {
  return (
    <div className="animate-[fadeIn_0.2s_ease-out]">
      {/* Em linha: são três rótulos curtos, e empilhados ocupavam altura que o
          formulário precisa. O wrap cobre telas estreitas e o inglês, onde os
          rótulos crescem. */}
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {ADVANTAGES.map((key) => (
          <li
            key={key}
            className="flex items-center gap-1.5 text-sm leading-tight text-white/85 whitespace-nowrap"
          >
            <CheckCircleFillIcon
              size={14}
              className="text-amber-400/70 shrink-0"
            />
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Shell({ title, children }) {
  return (
    <div className="w-full">
      <div className="glass-card group rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="shrink-0 mb-3 flex items-start gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={16} />
          </div>
          {/* Sem nowrap: este card aparece com max-w-md em /apoiar e numa coluna
              estreita em /sessao — largura fixa de texto corta em um dos dois.
              `min-w-0` porque filho de flex não encolhe abaixo do conteúdo por
              conta própria, que é o que fazia o título passar da borda. */}
          <h2 className="min-w-0 text-base lg:text-lg font-bold tracking-tight leading-snug text-balance text-white/90">
            {title}
          </h2>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
