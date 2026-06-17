import { createRouter } from "next-connect";
import controller from "infra/controller.js";

export default createRouter().get(getHandler).handler(controller.errorHandlers);

// Canal @Judhagsan
const CHANNEL_ID = "UCVqzru2hZO3pX7IjjkSGDyQ";
const PLAYLIST_ID = CHANNEL_ID.replace(/^UC/, "UULF");
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;

// O card da home lista os vídeos mais recentes do canal. Em vez da YouTube
// Data API (exige chave — a anterior vivia no bundle do cliente e foi
// invalidada — e cada search custa 100 das 10.000 unidades/dia de quota),
// usamos o feed RSS público do canal: sem chave e sem quota. O feed não tem
// CORS pra browser, então o fetch é server-side; o cache CDN segura o
// tráfego e mantém a home rápida mesmo se o YouTube demorar.
async function getHandler(request, response) {
  const feedResponse = await fetch(FEED_URL);
  if (!feedResponse.ok) {
    return response.status(502).json({ error: "YouTube feed request failed" });
  }
  const xml = await feedResponse.text();

  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .slice(0, 3)
    .map(([, entry]) => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? null;
      const title = decodeEntities(
        entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "",
      );
      const publishedAt =
        entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
      return {
        id,
        title,
        publishedAt,
        // Thumbnail por convenção de URL do YouTube (mqdefault = 320x180,
        // o "medium" que o card usava com a Data API).
        thumbnail: id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null,
      };
    })
    .filter((video) => video.id);

  response.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  return response.status(200).json(videos);
}

// O feed Atom escapa entidades XML nos títulos. `&amp;` por último — senão
// um título com "&amp;lt;" literal sofreria decode duplo.
function decodeEntities(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}
