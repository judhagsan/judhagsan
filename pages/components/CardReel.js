import { VideoIcon } from "@primer/octicons-react";

export default function CardReel() {
  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/15 shrink-0">
            <VideoIcon size={20} />
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            Motion Reel
          </h2>
        </div>

        {/* Video Player Container */}
        <div className="w-full lg:flex-1 lg:min-h-0 relative rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner group/video aspect-video lg:aspect-auto flex items-center justify-center">
          <video
            src="/Reel.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  );
}
