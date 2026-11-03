import Link from "next/link";
import { DownloadIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

export default function CardPindorama({ onDownloadClick }) {
  const { t } = useLanguage();

  return (
    <CardNormal
      title="Pindorama"
      bodyClassName="p-5 lg:p-6 flex flex-col items-center justify-center text-center"
    >
      {/* Logo Pindorama com moldura técnica monocromática */}
      <div className="w-16 h-16 rounded-xl border-2 border-white p-2 mb-4 bg-black flex items-center justify-center">
        <img
          src="/PinLogo.svg"
          alt="Pindorama Logo"
          className="w-full h-full object-contain invert contrast-200"
        />
      </div>

      <p className="text-white mb-6 max-w-xl leading-relaxed text-base lg:text-lg">
        {t("pindorama_desc")}
      </p>

      <div className="flex flex-col items-center gap-3 w-full">
        {/* Botão de Download de Alto Contraste */}
        {onDownloadClick ? (
          <button
            type="button"
            onClick={onDownloadClick}
            className="win-btn-primary w-full sm:w-auto px-10 py-3 text-base gap-3"
          >
            <DownloadIcon size={18} />
            <span>{t("Download")}</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="win-btn-primary w-full sm:w-auto px-10 py-3 text-base gap-3"
          >
            <DownloadIcon size={18} />
            <span>{t("Download")}</span>
          </Link>
        )}

        <p className="text-xs text-zinc-500 tracking-wider select-none mt-2">
          {t("pindorama_footer")}
        </p>
      </div>
    </CardNormal>
  );
}
