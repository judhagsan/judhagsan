export default function CardNormal({ title, icon: Icon, children }) {
  return (
    <div className="w-full h-auto lg:h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto lg:h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Background gradient similar to CardPindorama */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center gap-3 relative z-10">
          {Icon && (
            <div className="w-10 h-10 rounded-full bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/15 shrink-0">
              <Icon size={20} />
            </div>
          )}
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-white/90">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
