import { PlayIcon } from "@primer/octicons-react";
import { useState, useEffect } from "react";
import useLanguage from "hooks/useLanguage";

export default function CardYoutube() {
  const { language, t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const CHANNEL_ID = "UCVqzru2hZO3pX7IjjkSGDyQ"; // Channel: @Judhagsan

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Server-side proxy do feed RSS do canal (sem chave de API, sem
        // quota, com cache CDN) — ver pages/api/v1/youtube.
        const response = await fetch("/api/v1/youtube");

        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();

        const formattedVideos = data.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          views: "Assistir",
          date: new Date(item.publishedAt).toLocaleDateString(
            language === "pt" ? "pt-BR" : "en-US",
          ),
        }));

        setVideos(formattedVideos);
        setLoading(false);
      } catch (error) {
        console.error("Error loading videos:", error);
        // Fallback to mock data on error so the UI doesn't break
        setVideos([
          {
            id: 1,
            title: t("Nao foi possivel carregar os videos"),
            thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg",
            views: "—",
            date: t("Hoje"),
          },
        ]);
        setLoading(false);
      }
    };

    fetchVideos();
  }, [language, t]);

  // Tile "Ver o canal" preenche colunas vazias no desktop; quando ele está
  // visível, o pill do header some no desktop para não duplicar o link.
  const showsChannelTile = !loading && videos.length > 0 && videos.length < 3;

  return (
    <div className="w-full">
      <div className="glass-card rounded-[20px] p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col gap-3 animate-[fadeIn_0.3s_ease-out]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10"></div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pl-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-300 shadow-lg shadow-red-500/15 shrink-0">
              <PlayIcon size={16} />
            </div>
            <h2 className="text-base lg:text-lg font-bold tracking-tight text-white/90">
              {t("Ultimos videos")}
            </h2>
          </div>
          <a
            href={`https://www.youtube.com/channel/${CHANNEL_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full cursor-pointer decoration-transparent ${
              showsChannelTile ? "lg:hidden" : ""
            }`}
          >
            {t("Ver todos")}
          </a>
        </div>

        {/* Video List - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
          {loading
            ? // Skeleton Loading
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex gap-4 p-2 rounded-xl bg-white/5 animate-pulse ${i > 1 ? "hidden lg:flex" : "flex"}`}
                >
                  <div className="w-28 h-20 lg:w-40 lg:h-24 rounded-lg bg-white/10 shrink-0"></div>
                  <div className="flex-1 space-y-2 py-2 min-w-0">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            : videos.slice(0, 3).map((video, index) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group gap-3 p-2 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/5 deco ${index > 0 ? "hidden lg:flex" : "flex"}`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-28 h-20 lg:w-40 lg:h-24 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayIcon
                        size={32}
                        className="text-white drop-shadow-md"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0 py-1">
                    <h3 className="text-sm lg:text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400 font-medium bg-black/30 px-2 py-0.5 rounded-md">
                        {t(video.views)}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {video.date}
                      </span>
                    </div>
                  </div>
                </a>
              ))}

          {/* Preenche colunas vazias com convite ao canal */}
          {showsChannelTile &&
            Array.from({ length: 3 - Math.min(videos.length, 3) }).map(
              (_, index) => (
                <a
                  key={`canal-${index}`}
                  href={`https://www.youtube.com/channel/${CHANNEL_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden lg:flex items-center justify-center gap-2 p-2 rounded-2xl border border-dashed border-white/10 hover:border-white/25 text-white/30 hover:text-white/70 transition-all cursor-pointer text-xs font-mono uppercase tracking-widest"
                >
                  <PlayIcon size={16} />
                  {t("Ver o canal")}
                </a>
              ),
            )}
        </div>
      </div>
    </div>
  );
}
