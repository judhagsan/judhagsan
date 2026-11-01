import useSWR from "swr";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(r)));

export default function SupportersTicker() {
  const { t } = useLanguage();
  const { data } = useSWR("/api/v1/supporters", fetcher, {
    revalidateOnFocus: false,
  });

  const supporters = data?.supporters || [];
  if (supporters.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(8 / supporters.length));
  const segment = Array.from({ length: repeats }).flatMap(() => supporters);
  const loop = [...segment, ...segment];

  return (
    <div className="w-full animate-[fadeIn_0.2s_ease-out]">
      <div className="rounded-full border border-white bg-black px-4 py-2.5 relative flex items-center gap-3">
        {/* Rótulo da faixa */}
        <div className="shrink-0 flex items-center gap-2 select-none border-r border-white pr-3">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            {t("Apoiadores")}
          </span>
        </div>

        {/* Letreiro contínuo */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex w-max items-center whitespace-nowrap animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            {loop.map((supporterItem, index) => (
              <span
                key={`${supporterItem.username}-${index}`}
                className="inline-flex items-center gap-3 pr-6 text-sm font-mono text-white"
              >
                <span>{supporterItem.username}</span>
                <span className="text-zinc-500 text-xs">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
