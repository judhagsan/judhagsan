import { PersonFillIcon } from "@primer/octicons-react";

export default function CardSessao({ user }) {
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center text-center gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.4s_ease-out]">
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200">
            <PersonFillIcon size={28} />
          </div>
          <p className="text-2xl text-white font-semibold">
            Bem vindo, <span className="text-cyan-300">{user?.username}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
