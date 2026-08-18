import { HeartFillIcon, CheckCircleFillIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const ADVANTAGES = ["Vantagem selo", "Vantagem discord", "Vantagem mural"];

// Card informativo do apoio ao Pindorama. A cobrança está fora do ar desde a
// remoção do gateway, então aqui só ficam os benefícios — a feature de
// apoiador é concedida manualmente enquanto não houver outro meio de pagamento.
export default function CardApoiar() {
  const { t } = useLanguage();

  return (
    <Shell t={t}>
      <div className="flex flex-col gap-2 animate-[fadeIn_0.2s_ease-out]">
        <span className="text-[10px] uppercase tracking-widest text-amber-300/70 font-semibold">
          {t("Vantagens de apoiador")}
        </span>
        <ul className="flex flex-col gap-1">
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

      <p className="text-sm text-white/60 leading-snug mt-4">
        {t("Texto apoio indisponivel")}
      </p>
    </Shell>
  );
}

function Shell({ t, children }) {
  return (
    <div className="w-full">
      <div className="glass-card rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="shrink-0 mb-3 flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={16} />
          </div>
          <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90">
            {t("Apoiar o Pindorama")}
          </h2>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
