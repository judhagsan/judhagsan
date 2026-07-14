import { useState, useEffect, useRef } from "react";
import {
  HeartFillIcon,
  SyncIcon,
  CheckCircleFillIcon,
  CopyIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const MONTHLY_PRICE_LABEL = "R$ 9,90";
const PIX_SUGGESTIONS_CENTS = [1000, 2500, 5000];
const ADVANTAGES = ["Vantagem selo", "Vantagem discord", "Vantagem mural"];

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function maskCpf(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function CardApoiar() {
  const { t } = useLanguage();
  const [mode, setMode] = useState("mensal");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [amountCents, setAmountCents] = useState(PIX_SUGGESTIONS_CENTS[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pix, setPix] = useState(null);
  const [pixStatus, setPixStatus] = useState(null);
  const pollRef = useRef(null);

  const cpfDigits = cpf.replace(/\D/g, "");
  const cpfValid = cpfDigits.length === 11;
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 10 || phoneDigits.length === 11;

  // Polling do status do PIX enquanto pendente.
  useEffect(() => {
    if (!pix || pixStatus === "PAID") return undefined;

    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/support/pix/${pix.id}`, {
          credentials: "include",
        });
        if (!response.ok) return;
        const body = await response.json();
        setPixStatus(body.status);
        if (body.status === "PAID" || body.status === "EXPIRED") {
          clearInterval(pollRef.current);
        }
      } catch {
        // rede instável — tenta de novo no próximo tick
      }
    }, 4000);

    return () => clearInterval(pollRef.current);
  }, [pix, pixStatus]);

  function resolvePixAmount() {
    if (customAmount) {
      const cents = Math.round(
        parseFloat(customAmount.replace(",", ".")) * 100,
      );
      return Number.isFinite(cents) ? cents : 0;
    }
    return amountCents;
  }

  async function handleSubscribe() {
    if (isSubmitting || !cpfValid) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/support/subscription", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tax_id: cpfDigits }),
      });
      const body = await response.json();
      if (!response.ok || !body.url) {
        setError(body.message || t("Erro ao iniciar apoio"));
        return;
      }
      window.location.href = body.url;
    } catch {
      setError(t("Erro de conexao"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePix() {
    if (isSubmitting || !cpfValid || !phoneValid) return;
    const cents = resolvePixAmount();
    if (!cents || cents < 100) {
      setError(t("Valor minimo pix"));
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/v1/support/pix", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: cents,
          tax_id: cpfDigits,
          cell_phone: phoneDigits,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.brCode) {
        setError(body.message || t("Erro ao iniciar apoio"));
        return;
      }
      setPix(body);
      setPixStatus(body.status);
    } catch {
      setError(t("Erro de conexao"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function copyPixCode() {
    if (pix?.brCode) navigator.clipboard?.writeText(pix.brCode);
  }

  // Tela de PIX gerado
  if (pix) {
    const qrSrc = pix.brCodeBase64?.startsWith("data:")
      ? pix.brCodeBase64
      : `data:image/png;base64,${pix.brCodeBase64}`;

    return (
      <Shell t={t}>
        {pixStatus === "PAID" ? (
          <div className="flex flex-col items-center text-center gap-4 py-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <CheckCircleFillIcon size={32} />
            </div>
            <p className="text-xl font-semibold text-white">
              {t("Apoio confirmado")}
            </p>
            <p className="text-sm text-white/60 max-w-xs">
              {t("Texto apoio confirmado")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 animate-[fadeIn_0.3s_ease-out]">
            <p className="text-sm text-white/60">{t("Escaneie o QR Code")}</p>
            {pix.brCodeBase64 && (
              <img
                src={qrSrc}
                alt="QR Code PIX"
                className="w-52 h-52 rounded-xl bg-white p-2"
              />
            )}
            <button
              type="button"
              onClick={copyPixCode}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-mono transition-colors cursor-pointer break-all max-w-full"
            >
              <CopyIcon size={14} />
              {t("Copiar codigo pix")}
            </button>
            <div className="inline-flex items-center gap-2 text-xs text-amber-300/80 font-mono">
              <SyncIcon size={12} className="animate-spin" />
              {t("Aguardando pagamento")}
            </div>
          </div>
        )}
      </Shell>
    );
  }

  return (
    <Shell t={t}>
      {/* Alternador de modo */}
      <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 mb-4">
        <ModeButton
          active={mode === "mensal"}
          onClick={() => setMode("mensal")}
          label={t("Apoio mensal")}
        />
        <ModeButton
          active={mode === "pix"}
          onClick={() => setMode("pix")}
          label={t("PIX avulso")}
        />
      </div>

      {mode === "mensal" ? (
        /* Vantagens | valor, com aviso de renovação embaixo */
        <div className="flex flex-col gap-2 animate-[fadeIn_0.2s_ease-out]">
          <div className="grid grid-cols-2 gap-4">
            {/* Vantagens */}
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-300/70 font-semibold">
                {t("Vantagens de apoiador")}
              </span>
              <ul className="mt-1.5 flex flex-col gap-1">
                {ADVANTAGES.map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-2 text-sm leading-tight text-white/85"
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

            {/* Valor */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-bold text-white leading-none">
                {MONTHLY_PRICE_LABEL}
                <span className="text-lg font-semibold text-white/50">
                  {t("sufixo mes")}
                </span>
              </span>
            </div>
          </div>
          <p className="text-sm text-white/50 leading-snug">
            {t("Texto mensal curto")}
          </p>
        </div>
      ) : (
        /* PIX: valores em duas colunas + aviso de apoio pontual */
        <div className="flex flex-col gap-2 animate-[fadeIn_0.2s_ease-out]">
          <div className="grid grid-cols-2 gap-2">
            {PIX_SUGGESTIONS_CENTS.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setAmountCents(cents);
                  setCustomAmount("");
                }}
                className={`px-2 py-2 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  !customAmount && amountCents === cents
                    ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/25"
                }`}
              >
                {formatBRL(cents)}
              </button>
            ))}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">
                R$
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={t("Outro valor")}
                className="w-full pl-7 pr-2 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-amber-400/60 outline-none text-white placeholder-white/30 text-sm transition-colors"
              />
            </div>
          </div>
          <p className="text-sm text-white/50 leading-snug">
            {t("Texto pix pontual")}
          </p>
        </div>
      )}

      {/* CPF (comum) + Celular (só no PIX, exigido pelo AbacatePay) */}
      <div
        className={`mt-4 grid gap-3 ${mode === "pix" ? "grid-cols-2" : "grid-cols-1"}`}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            CPF
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(maskCpf(e.target.value))}
            placeholder="000.000.000-00"
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400/60 outline-none text-white placeholder-white/30 transition-colors"
          />
        </label>
        {mode === "pix" && (
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40">
              {t("Celular")}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400/60 outline-none text-white placeholder-white/30 transition-colors"
            />
          </label>
        )}
      </div>

      {error && <p className="text-red-300 text-xs mt-2">{error}</p>}

      <button
        type="button"
        onClick={mode === "mensal" ? handleSubscribe : handlePix}
        disabled={isSubmitting || !cpfValid || (mode === "pix" && !phoneValid)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 hover:border-amber-400/70 text-amber-100 font-semibold transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <HeartFillIcon size={16} />
        {isSubmitting
          ? t("Processando...")
          : mode === "mensal"
            ? t("Assinar apoio mensal")
            : t("Gerar PIX")}
      </button>

      <p className="text-[10px] text-white/30 text-center mt-2 leading-snug">
        {mode === "mensal" ? t("Texto redirect cartao") : t("Texto pix seguro")}
      </p>
    </Shell>
  );
}

function Shell({ t, children }) {
  return (
    <div className="w-full">
      <div className="glass-card rounded-[20px] p-5 shadow-2xl relative overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={18} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white/90">
            {t("Apoiar o Pindorama")}
          </h2>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
        active
          ? "bg-amber-500/20 text-amber-200"
          : "text-white/50 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );
}
