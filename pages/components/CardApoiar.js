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
  const { t } = useLanguage();
  const [status, setStatus] = useState("carregando");
  const [errorMessage, setErrorMessage] = useState(null);
  const [monthlyValue, setMonthlyValue] = useState(null);
  const [pix, setPix] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fieldsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const configResponse = await fetch("/api/v1/support/config");

        if (!configResponse.ok) throw new Error("config");

        const config = await configResponse.json();

        if (!config.public_key) throw new Error("sem chave");

        await loadScript();
        if (cancelled) return;

        setMonthlyValue(config.monthly_value);

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

      setStatus("confirmado");
    } catch (error) {
      // O SDK rejeita com uma lista de códigos (invalid_card_number,
      // invalid_expiry_date, invalid_security_code, invalid_identification_
      // number...). Sem isso no console, todo problema de cartão vira a mesma
      // frase e não há como saber qual campo recusou.
      console.error("Falha ao tokenizar o cartão:", error?.cause || error);

      setErrorMessage(t("Erro no cartao"));
      setStatus("pronto");
    }
  }

  async function handlePix() {
    setErrorMessage(null);
    setStatus("processando");

    try {
      const response = await fetch("/api/v1/support/pix", { method: "POST" });
      const body = await response.json();

      if (!response.ok) {
        setErrorMessage(body.message || t("Erro ao iniciar apoio"));
        setStatus("pronto");
        return;
      }

      setPix(body);
      setStatus("pix");
    } catch {
      setErrorMessage(t("Erro ao iniciar apoio"));
      setStatus("pronto");
    }
  }

  async function copyPixCode() {
    await navigator.clipboard.writeText(pix.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "confirmado") {
    return (
      <Shell title={t("Apoiar o Pindorama")}>
        <Confirmation t={t} />
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

function Confirmation({ t }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-200">
        <CheckCircleFillIcon size={24} />
      </div>
      <p className="text-base text-white/90 font-semibold">
        {t("Apoio confirmado")}
      </p>
      <p className="text-sm text-white/60 leading-snug">
        {t("Texto apoio confirmado")}
      </p>
    </div>
  );
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
        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={16} />
          </div>
          <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90 whitespace-nowrap">
            {title}
          </h2>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
