import useSWR from "swr";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

// Faixa de "créditos" da home: os nomes de quem apoia rolam continuamente,
// como os créditos finais de uma animação. Some quando não há apoiadores
// públicos e para de rolar com prefers-reduced-motion.
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
    <div className="w-full animate-[fadeIn_0.2s_ease-out]">
      <div className="rounded-full border border-white bg-black px-4 py-2.5 relative flex items-center gap-3">
        {/* Rótulo da faixa */}
        <div className="shrink-0 flex items-center gap-2 select-none border-r border-white pr-3">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            {t("Apoiadores")}
          </span>
        </div>

        {/* Créditos rolando. O espaçamento entre nomes vem do `pr-6` de cada
            item (não de `gap` no container): assim cada item tem largura
            idêntica e o translateX(-50%) fecha o loop sem emenda visível. */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex w-max items-center whitespace-nowrap animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            {loop.map((supporterItem, index) => (
              <span
                key={`${supporterItem.username}-${index}`}
                className="inline-flex items-center gap-3 pr-6 text-lg text-white"
              >
                <span>{supporterItem.username}</span>
                <span className="text-zinc-500 text-sm">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
