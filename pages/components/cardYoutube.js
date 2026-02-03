import { PlayIcon } from "@primer/octicons-react";
import { useState, useEffect } from "react";

export default function CardYoutube() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Configuration
  const API_KEY = "AIzaSyDgmq-MS8a0vzMaDhaM91htD-taz-2lY1A";
  const CHANNEL_ID = "UCVqzru2hZO3pX7IjjkSGDyQ"; // Channel: @Judhagsan

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3&type=video`,
        );

        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();

        const formattedVideos = data.items.map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title, // NOTE: Titles might have HTML entities
          thumbnail: item.snippet.thumbnails.medium.url,
          views: "Watch Now", // Search API doesn't allow fetching views in the same request easily without extra quota
          date: new Date(item.snippet.publishedAt).toLocaleDateString(),
        }));

        setVideos(formattedVideos);
        setLoading(false);
      } catch (error) {
        console.error("Error loading videos:", error);
        // Fallback to mock data on error so the UI doesn't break
        setVideos([
          {
            id: 1,
            title: "API Error or Quota Exceeded - Mock Data",
            thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/mqdefault.jpg",
            views: "0 views",
            date: "Today",
          },
        ]);
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="w-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between pl-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
              <PlayIcon size={16} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Latest Videos
            </h2>
          </div>
          <a
            href={`https://www.youtube.com/channel/${CHANNEL_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white/50 hover:text-white transition-colors uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full cursor-pointer decoration-transparent"
          >
            View All
          </a>
        </div>

        {/* Video List - Horizontal Grid */}
        <div className="grid grid-cols-3 gap-6">
          {loading
            ? // Skeleton Loading
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-2 rounded-xl bg-white/5 animate-pulse"
                >
                  <div className="w-48 h-28 rounded-lg bg-white/10 shrink-0"></div>
                  <div className="flex-1 space-y-2 py-2 min-w-0">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            : videos.slice(0, 3).map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 p-3 rounded-2xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/5 block deco"
                >
                  {/* Thumbnail */}
                  <div className="relative w-48 h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5">
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
                    <h3 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-400 font-medium bg-black/30 px-2 py-0.5 rounded-md">
                        {video.views}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {video.date}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
        </div>
      </div>
    </div>
  );
}
