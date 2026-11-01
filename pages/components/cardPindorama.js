import Link from "next/link";
import { DownloadIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

export default function CardPindorama({ onDownloadClick }) {
  const { t } = useLanguage();

  return (
    <div className="w-full h-auto">
      <div className="rounded-2xl overflow-hidden border-2 border-white bg-black bg-noise flex flex-col h-auto relative">
        {/* Barra de Título Branca com Texto Preto */}
        <div className="h-10 shrink-0 flex items-center justify-between px-3.5 border-b-2 border-black bg-white text-black select-none">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="w-5 h-5 rounded-full border-2 border-black bg-white shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
            <span className="w-5 h-5 rounded-full bg-black shrink-0" />
          </div>

          <div className="flex items-center gap-2 min-w-0 mx-2">
            <span className="text-sm lg:text-base font-mono font-bold tracking-wider uppercase text-black">
              PINDORAMA
            </span>
          </div>

          <div
            className="w-20 shrink-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Conteúdo Central */}
        <div className="p-5 lg:p-6 flex flex-col items-center justify-center text-center">
          {/* Logo Pindorama com moldura técnica monocromática */}
          <div className="w-16 h-16 rounded-xl border-2 border-white p-2 mb-4 bg-black flex items-center justify-center">
            <img
              src="/PinLogo.svg"
              alt="Pindorama Logo"
              className="w-full h-full object-contain filter invert contrast-200"
            />
          </div>

          <p className="text-white mb-6 max-w-xl leading-relaxed text-base lg:text-lg font-mono">
            {t("pindorama_desc")}
          </p>

          <div className="flex flex-col items-center gap-3 w-full">
            {/* Botão de Download de Alto Contraste */}
            {onDownloadClick ? (
              <button
                type="button"
                onClick={onDownloadClick}
                className="win-btn-primary w-full sm:w-auto px-10 py-3 text-base flex items-center justify-center gap-3 active:scale-95"
              >
                <DownloadIcon size={18} />
                <span>{t("Download")}</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="win-btn-primary w-full sm:w-auto px-10 py-3 text-base flex items-center justify-center gap-3 active:scale-95"
              >
                <DownloadIcon size={18} />
                <span>{t("Download")}</span>
              </Link>
            )}

            <p className="text-xs text-zinc-500 tracking-wider font-mono select-none mt-2">
              {t("pindorama_footer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
