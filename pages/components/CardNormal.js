export default function CardNormal({ title, children }) {
  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Background gradient similar to CardPindorama */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        <h2 className="text-xl font-semibold text-white/90 mb-6 flex items-center gap-2 relative z-10">
          {title}
        </h2>

        <div className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
