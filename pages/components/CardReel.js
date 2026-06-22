import { useState, useRef } from "react";
import { VideoIcon, PlayIcon } from "@primer/octicons-react";

export default function CardReel() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

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
        <div
          onClick={togglePlay}
          className="w-full lg:flex-1 lg:min-h-0 relative rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner group/video aspect-video lg:aspect-auto flex items-center justify-center cursor-pointer"
        >
          <video
            ref={videoRef}
            src="/Reel.mp4"
            loop
            playsInline
            className="w-full h-full object-cover group-hover/video:scale-[1.01] transition-transform duration-500"
          />

          {/* Central Play Button Overlay */}
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-all duration-300 ${
              isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Liquid Glass Play Button (Larger Size: w-36 h-36) */}
            <div className="relative w-36 h-36 flex items-center justify-center group/btn hover:scale-110 active:scale-95 transition-all duration-500">
              {/* Outer pulsing glow ring */}
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md opacity-70 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all duration-500 animate-[pulse_2s_infinite]"></div>

              {/* Liquid Glass body (gradients, blur, shadows, and reflection highlights) */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 border-t-white/40 border-b-white/5 shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),0_8px_32px_rgba(0,0,0,0.3),0_0_15px_rgba(6,182,212,0.25)] group-hover/btn:shadow-[inset_0_2px_8px_rgba(255,255,255,0.6),0_0_25px_rgba(6,182,212,0.5)] transition-all duration-500"></div>

              {/* Mathematically Centered Icon Wrapper */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <PlayIcon
                  size={64}
                  className="text-cyan-200 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] group-hover/btn:text-white transition-colors duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
