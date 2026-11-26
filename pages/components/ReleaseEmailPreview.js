import { EyeIcon } from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const EMPTY_PREVIEW = { subject: "", html: "" };

export default function ReleaseEmailPreview({
  previewEmail = EMPTY_PREVIEW,
  showPindoramaOptions = true,
  previewSupporter = false,
  onToggleSupporter,
  previewPlatform = "windows",
  onChangePlatform,
  fullPage = false,
  visibleOnMobile = false,
} = {}) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex flex-col gap-3 ${
        fullPage
          ? `${visibleOnMobile ? "flex" : "hidden lg:flex"} lg:min-h-0 lg:border-l lg:border-zinc-800 lg:pl-5`
          : visibleOnMobile
            ? "flex"
            : "hidden"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {fullPage && (
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2">
            <EyeIcon size={13} />
            {t("Previa")}
          </span>
        )}

        {showPindoramaOptions && (
          <>
            <label className="inline-flex items-center gap-1.5 text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={previewSupporter}
                onChange={(event) => onToggleSupporter?.(event.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>{t("Apoiador")}</span>
            </label>

            <div className="flex flex-wrap items-center gap-1 ml-auto">
              {["windows", "macos", "linux", "none"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangePlatform?.(key)}
                  className={`cursor-pointer rounded-full px-2.5 py-0.5 border text-xs transition-colors ${
                    previewPlatform === key
                      ? "border-white bg-white text-black font-bold"
                      : "border-zinc-800 bg-black text-zinc-400 hover:text-white"
                  }`}
                >
                  {key === "none" ? t("Sem dispositivo") : key}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400 truncate">
        {t("Assunto")}:{" "}
        <strong className="text-white">{previewEmail.subject}</strong>
      </div>

      {/* iframe com sandbox vazio isola estilos do email e impede scripts */}
      <iframe
        title={t("Previa do email")}
        sandbox=""
        srcDoc={previewEmail.html}
        className={`w-full border border-zinc-800 bg-[#0b0b0f] ${
          fullPage ? "flex-1 min-h-[26rem] lg:min-h-0" : "h-[22rem]"
        }`}
      />
    </div>
  );
}
