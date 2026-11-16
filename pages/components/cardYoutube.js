import { memo, useMemo } from "react";
import useSWR from "swr";
import { PlayIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

const CHANNEL_ID = "UCVqzru2hZO3pX7IjjkSGDyQ"; // Channel: @Judhagsan

const DATE_FORMATTERS = {
  pt: new Intl.DateTimeFormat("pt-BR"),
  en: new Intl.DateTimeFormat("en-US"),
};

async function youtubeFetcher(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("API call failed");
  return await response.json();
}

function formatPublishedAt(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return (DATE_FORMATTERS[language] || DATE_FORMATTERS.pt).format(date);
}

function CardYoutube() {
  const { language, t } = useLanguage();
  const { data, error, isLoading } = useSWR("/api/v1/youtube", youtubeFetcher, {
    revalidateOnFocus: false,
  });

  const videos = useMemo(() => {
    if (error) {
      return [
        {
          id: "fallback",
          title: t("Nao foi possivel carregar os videos"),
          thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg",
          views: "—",
          date: t("Hoje"),
          isFallback: true,
        },
      ];
    }

    if (!Array.isArray(data)) return [];

    return data.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      views: "Assistir",
      date: formatPublishedAt(item.publishedAt, language),
    }));
  }, [data, error, language, t]);

  // Tile "Ver o canal" preenche colunas vazias no desktop; quando ele está
  // visível, o pill do header some no desktop para não duplicar o link.
  const showsChannelTile = !isLoading && videos.length > 0 && videos.length < 3;

  return (
    <CardNormal
      title={t("Ultimos videos")}
      icon={PlayIcon}
      className="animate-[fadeIn_0.2s_ease-out]"
      bodyClassName="p-3 lg:p-4 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4"
      actions={
        <a
          href={`https://www.youtube.com/channel/${CHANNEL_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs font-bold uppercase tracking-wider text-black border border-black px-3 py-1 rounded-full hover:bg-black hover:text-white transition-colors ${
            showsChannelTile ? "lg:hidden" : ""
          }`}
        >
          {t("Ver todos")}
        </a>
      }
    >
      {isLoading
        ? [1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex gap-3 p-2 rounded-xl border border-zinc-800 bg-black animate-pulse ${
                i > 1 ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="w-28 h-20 lg:w-36 lg:h-22 bg-zinc-900 shrink-0 rounded-lg border border-zinc-800" />
              <div className="flex-1 space-y-2 py-2 min-w-0">
                <div className="h-4 bg-zinc-800 w-3/4 rounded" />
                <div className="h-3 bg-zinc-800 w-1/2 rounded" />
              </div>
            </div>
          ))
        : videos.map((video, index) => (
            <a
              key={video.id}
              href={
                video.isFallback
                  ? `https://www.youtube.com/channel/${CHANNEL_ID}`
                  : `https://www.youtube.com/watch?v=${video.id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`group gap-3 p-2 rounded-xl border border-white bg-black hover:bg-white text-white hover:text-black transition-colors cursor-pointer ${
                index > 0 ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Thumbnail com moldura e indicador de play */}
              <div className="relative w-28 h-20 lg:w-36 lg:h-22 shrink-0 rounded-lg border border-white overflow-hidden bg-black">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  width={320}
                  height={180}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover contrast-110 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center border border-black shadow-lg">
                    <PlayIcon size={18} />
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="flex flex-col justify-center min-w-0 py-1">
                <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:underline">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 group-hover:text-black">
                  <span className="border border-current px-1.5 py-0.5 rounded bg-black group-hover:bg-white">
                    {t(video.views)}
                  </span>
                  <span>{video.date}</span>
                </div>
              </div>
            </a>
          ))}

      {/* Tile do Canal quando faltam vídeos */}
      {showsChannelTile &&
        Array.from({ length: 3 - Math.min(videos.length, 3) }).map(
          (_, index) => (
            <a
              key={`canal-${index}`}
              href={`https://www.youtube.com/channel/${CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm uppercase tracking-wider"
            >
              <PlayIcon size={14} />
              <span>{t("Ver o canal")}</span>
            </a>
          ),
        )}
    </CardNormal>
  );
}

export default memo(CardYoutube);
