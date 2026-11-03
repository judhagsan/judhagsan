import useLanguage from "hooks/useLanguage";

/*
 * Janela padrão do site: moldura `.win-panel`, barra de título branca com os
 * três círculos e o corpo. Todo card monta a sua por aqui, para que barra,
 * botão de voltar e entrada (`card-enter`) mudem num lugar só.
 *
 * - `onBack` (ou `onClose`) faz do primeiro círculo o botão de voltar; sem
 *   ele, o círculo é só decoração.
 * - `actions` ocupa o canto direito, que tem no mínimo a largura dos três
 *   círculos (`min-w-20`): vazio, ele equilibra o lado esquerdo e mantém o
 *   título centralizado.
 * - `className` vai para a moldura (altura, `card-enter`, animação) e
 *   `bodyClassName` substitui o espaçamento padrão do corpo.
 */
export default function CardNormal({
  title,
  icon: Icon,
  onBack,
  onClose,
  backLabel,
  actions,
  className = "",
  bodyClassName = "p-4 lg:p-5 flex flex-col gap-4 text-white text-sm lg:text-base flex-1 h-full",
  children,
}) {
  const { t } = useLanguage();
  const handleBack = onBack || onClose;
  const label = backLabel || t("Voltar");

  return (
    <div className={`win-panel ${className}`}>
      <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
        <div className="flex items-center gap-2.5 shrink-0">
          {handleBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label={label}
              title={label}
              className="cursor-pointer w-5 h-5 rounded-full border-2 border-black bg-white text-black flex items-center justify-center hover:bg-black hover:text-white transition-all shrink-0 active:scale-90"
            >
              {/* A seta herda a cor do botão. Um `group-hover` aqui reagiria
                  ao hover de qualquer ancestral com `.group` e deixaria a seta
                  branca sobre o botão branco. */}
              <svg
                className="w-3.5 h-3.5"
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

        <div className="flex items-center gap-2 min-w-0 mx-2">
          {Icon && <Icon size={17} className="shrink-0 text-black" />}
          <h2 className="text-sm lg:text-base font-bold tracking-wider uppercase text-black truncate">
            {title}
          </h2>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 min-w-20 text-black">
          {actions}
        </div>
      </div>

      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
