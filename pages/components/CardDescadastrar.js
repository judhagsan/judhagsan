import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
  MailIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

export default function CardDescadastrar({ token }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorFallbackKey, setErrorFallbackKey] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function unsubscribe() {
      try {
        const response = await fetch(
          `/api/v1/email-preferences/unsubscribe/${encodeURIComponent(token)}`,
          { method: "POST" },
        );

        const responseBody = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (!response.ok) {
          setErrorMessage(responseBody.message || "");
          setErrorFallbackKey(responseBody.message ? "" : "Descadastro falhou");
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (cancelled) return;
        setErrorMessage("");
        setErrorFallbackKey("Erro de conexao");
        setStatus("error");
      }
    }

    unsubscribe();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const resolvedError =
    errorMessage || (errorFallbackKey ? t(errorFallbackKey) : "");

  return (
    <CardNormal
      title={t("Preferencias de email")}
      icon={MailIcon}
      bodyClassName="p-6 flex flex-col items-center justify-center text-center gap-4 text-white text-base"
    >
      {status === "loading" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black">
            <SyncIcon size={24} className="animate-spin" />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Atualizando preferencia...")}
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black animate-[fadeIn_0.2s_ease-out]">
            <CheckCircleFillIcon size={24} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Avisos desativados")}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-xs">
            {t("Sucesso descadastro releases")}
          </p>
          <Link href="/sessao" className="win-btn-primary px-8 text-sm mt-2">
            {t("Ir para minha conta")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black animate-[fadeIn_0.2s_ease-out]">
            <AlertFillIcon size={24} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Descadastro falhou")}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-xs border border-white p-2.5">
            {resolvedError}
          </p>
          <Link href="/sessao" className="win-btn px-6 py-2.5 text-sm mt-2">
            {t("Ir para minha conta")}
          </Link>
        </>
      )}
    </CardNormal>
  );
}
