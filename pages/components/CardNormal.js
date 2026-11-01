export default function CardNormal({
  title,
  icon: Icon,
  onBack,
  onClose,
  actions,
  children,
}) {
  const handleBack = onBack || onClose;

  return (
    <div className="w-full h-auto lg:h-full">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col h-auto lg:h-full relative group">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          {/* Três botões circulares ampliados */}
          <div className="flex items-center gap-2.5 shrink-0">
            {handleBack ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Voltar"
                title="Voltar"
                className="w-5 h-5 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer group shrink-0 active:scale-90"
              >
                <svg
                  className="w-3.5 h-3.5 text-black group-hover:text-white transition-colors"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 3.5L5.5 8L10 12.5" />
                </svg>
              </button>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            )}
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          {/* Título da Janela */}
          <div className="flex items-center gap-2 min-w-0 mx-2">
            {Icon && <Icon size={17} className="shrink-0 text-black" />}
            <span className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black truncate">
              {title}
            </span>
          </div>

          {/* Ações / Status no canto direito */}
          <div className="flex items-center gap-2 shrink-0 text-black">
            {actions || (
              <div
                className="w-20 shrink-0 pointer-events-none"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Corpo da Janela */}
        <div className="p-4 lg:p-5 flex flex-col gap-4 text-white text-sm lg:text-base font-mono relative z-10 flex-1 h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
