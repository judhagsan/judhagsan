import React from "react";
import PerspectiveGrid from "./PerspectiveGrid";

export default function MainFrame({ children }) {
  return (
    <div className="h-screen bg-[#050505] pt-10 px-2 pb-2 flex items-center justify-center font-outfit text-white selection:bg-cyan-500/30 overflow-hidden relative">
      <PerspectiveGrid />

      {/* Glass Frame Overlay (The "Rectangular Borders") */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-white/5 backdrop-blur-sm 
    [mask-image:linear-gradient(to_bottom,black_4%,transparent_4.8%,transparent_80%,black_100%),linear-gradient(to_right,black_0%,transparent_0.8%,transparent_80%,black_100%)]
    [mask-composite:add]"
        ></div>

        {/* Borda decorativa opcional (mantive para dar o acabamento) */}
        <div className="absolute inset-0 border-[1px] border-white/10 pointer-events-none"></div>
      </div>

      {/* External Logo */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50">
        <img
          src="/Logo.png"
          alt="Pindorama"
          className="h-6 w-auto opacity-90"
        />
      </div>

      {/* Render the inner content (Main Container) here */}
      {children}

      {/* Decorative Floating Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50">
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
