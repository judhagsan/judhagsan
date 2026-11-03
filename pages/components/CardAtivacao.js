import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SyncIcon,
  CheckCircleFillIcon,
  AlertFillIcon,
  SignInIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

export default function CardAtivacao({ tokenId }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!tokenId) return;

    let cancelled = false;

    async function activate() {
      try {
        const response = await fetch(`/api/v1/activations/${tokenId}`, {
          method: "PATCH",
        });

        const responseBody = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setErrorMessage(responseBody.message || t("Ativacao falhou"));
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (cancelled) return;
        setErrorMessage(t("Erro de conexao"));
        setStatus("error");
      }
    }

    activate();

    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return (
    <CardNormal
      title={t("Ativacao")}
      icon={CheckCircleFillIcon}
      bodyClassName="p-6 flex flex-col items-center justify-center text-center gap-4 text-white text-base"
    >
      {status === "loading" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black">
            <SyncIcon size={24} className="animate-spin" />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Ativando sua conta...")}
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black animate-[fadeIn_0.2s_ease-out]">
            <CheckCircleFillIcon size={24} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Conta ativada!")}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-xs">
            {t("Sucesso ativacao")}
          </p>
          <Link href="/login" className="win-btn-primary px-8 text-sm mt-2">
            <SignInIcon size={16} />
            <span>{t("Entrar")}</span>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black animate-[fadeIn_0.2s_ease-out]">
            <AlertFillIcon size={24} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Ativacao falhou")}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed max-w-xs border border-white p-2.5">
            {errorMessage}
          </p>
          <Link href="/cadastro" className="win-btn px-6 py-2.5 text-sm mt-2">
            {t("Voltar ao cadastro")}
          </Link>
        </>
      )}
    </CardNormal>
  );
}
