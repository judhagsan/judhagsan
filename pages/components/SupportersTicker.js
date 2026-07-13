import useSWR from "swr";
import { HeartFillIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

// Faixa de "créditos" da home: os nomes de quem apoia rolam continuamente,
// como os créditos finais de uma animação. Some quando não há apoiadores
// públicos e vira lista estática com prefers-reduced-motion.
export default function SupportersTicker() {
  const { t } = useLanguage();
  const { data } = useSWR("/api/v1/supporters", fetcher, {
    revalidateOnFocus: false,
  });

  const supporters = data?.supporters || [];
  if (supporters.length === 0) return null;

  // Repete o conjunto até ter corpo suficiente e duplica para o loop
  // contínuo (a animação translada exatamente uma cópia: -50%).
  const repeats = Math.max(1, Math.ceil(8 / supporters.length));
  const segment = Array.from({ length: repeats }).flatMap(() => supporters);
  const loop = [...segment, ...segment];

  return (
    <div className="w-full animate-[fadeIn_0.3s_ease-out]">
      <div className="group glass-card rounded-[20px] px-4 py-3 shadow-2xl relative overflow-hidden flex items-center gap-3">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Rótulo */}
        <div className="shrink-0 flex items-center gap-2 relative z-10">
          <span className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <HeartFillIcon size={12} />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 whitespace-nowrap">
            {t("Apoiadores")}
          </span>
        </div>

        {/* Créditos rolando. O espaçamento entre nomes vem do `pr-6` de cada
            item (não de `gap` no container): assim cada item tem largura
            idêntica e o translateX(-50%) fecha o loop sem emenda visível. */}
        <div className="flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max items-center whitespace-nowrap animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {loop.map((supporterItem, index) => (
              <span
                key={`${supporterItem.username}-${index}`}
                className="inline-flex items-center gap-3 pr-6 text-sm font-mono text-amber-200/90"
              >
                <span>{supporterItem.username}</span>
                <HeartFillIcon
                  size={9}
                  className="text-amber-400/40 shrink-0"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
