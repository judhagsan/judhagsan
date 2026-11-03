import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PersonFillIcon,
  PackageIcon,
  KeyIcon,
  TrashIcon,
  AlertFillIcon,
  HeartFillIcon,
  CheckCircleFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";
import CardNormal from "./CardNormal";

function DiscordIcon({ size = 16, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.0777.0777 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

export default function CardUsuario({ user }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const isSupporter = user?.features?.includes("apoiador");
  const discordResult = router.query.discord;
  const discordReason = router.query.reason;

  const confirmationMatches = confirmationInput === user?.username;

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      const response = await fetch("/api/v1/user/export", {
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setExportError(body.message || t("Erro exportar"));
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || "judhagsan-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("Erro de conexao"));
    } finally {
      setIsExporting(false);
    }
  }

  function resetPasswordForm() {
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirmation("");
    setPasswordError("");
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    if (isSavingPassword) return;

    // Validação no cliente só para o que dá para responder na hora; o resto
    // (senha atual, complexidade) é a API que decide.
    if (newPassword.length < 8) {
      setPasswordError(t("A senha deve ter no minimo 8 caracteres"));
      return;
    }

    if (newPassword !== newPasswordConfirmation) {
      setPasswordError(t("As senhas nao conferem"));
      return;
    }

    setIsSavingPassword(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/v1/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setPasswordError(body.message || t("Erro alterar senha"));
        return;
      }

      resetPasswordForm();
      setPasswordChanged(true);
    } catch {
      setPasswordError(t("Erro de conexao"));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleDelete(event) {
    event.preventDefault();
    if (!confirmationMatches || isDeleting) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/v1/users/${user.username}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const body = await response.json();
        setErrorMessage(body.message || t("Erro excluir conta"));
        setIsDeleting(false);
        return;
      }

      router.replace("/");
    } catch {
      setErrorMessage(t("Erro de conexao"));
      setIsDeleting(false);
    }
  }

  return (
    <CardNormal
      title={t("Bem vindo", { username: user?.username })}
      icon={PersonFillIcon}
      bodyClassName="p-4 lg:p-5 flex flex-col"
    >
      {isConfirming ? (
        <form
          onSubmit={handleDelete}
          className="flex flex-col items-center justify-center text-center gap-4 text-white text-sm animate-[fadeIn_0.15s_ease-out]"
        >
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black">
            <AlertFillIcon size={24} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Excluir conta")}
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
            {t("Texto excluir conta aviso")}
          </p>
          <label className="flex flex-col gap-1 w-full max-w-xs">
            <span className="text-sm uppercase tracking-wider text-zinc-400">
              {t("Digite para confirmar", { username: user?.username })}
            </span>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              autoComplete="off"
              className="win-input text-center"
              placeholder={user?.username}
            />
          </label>

          {errorMessage && (
            <div className="border border-white bg-zinc-950 p-2 text-sm text-white">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setConfirmationInput("");
                setErrorMessage("");
              }}
              disabled={isDeleting}
              className="win-btn text-sm"
            >
              {t("Cancelar")}
            </button>
            <button
              type="submit"
              disabled={!confirmationMatches || isDeleting}
              className="win-btn-primary text-sm"
            >
              <TrashIcon size={14} />
              <span>{isDeleting ? t("Excluindo...") : t("Excluir")}</span>
            </button>
          </div>
        </form>
      ) : isChangingPassword ? (
        <form
          onSubmit={handleChangePassword}
          className="flex flex-col items-center justify-center text-center gap-4 text-white text-sm animate-[fadeIn_0.15s_ease-out]"
        >
          <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black">
            <KeyIcon size={22} />
          </div>
          <p className="text-base font-bold uppercase tracking-wider text-white">
            {t("Alterar senha")}
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
            {t("Texto alterar senha aviso")}
          </p>

          <label className="flex flex-col gap-1 w-full max-w-xs text-left">
            <span className="text-sm uppercase tracking-wider text-zinc-400">
              {t("Senha atual")}
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="win-input"
            />
          </label>

          <label className="flex flex-col gap-1 w-full max-w-xs text-left">
            <span className="text-sm uppercase tracking-wider text-zinc-400">
              {t("Nova senha")}{" "}
              <span className="normal-case text-zinc-500">
                ({t("min_char")})
              </span>
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="win-input"
            />
          </label>

          <label className="flex flex-col gap-1 w-full max-w-xs text-left">
            <span className="text-sm uppercase tracking-wider text-zinc-400">
              {t("Confirmar nova senha")}
            </span>
            <input
              type="password"
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              autoComplete="new-password"
              className="win-input"
            />
          </label>

          {passwordError && (
            <div className="border border-white bg-zinc-950 p-2 text-sm text-white">
              {passwordError}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={resetPasswordForm}
              disabled={isSavingPassword}
              className="win-btn text-sm"
            >
              {t("Cancelar")}
            </button>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="win-btn-primary text-sm"
            >
              <KeyIcon size={14} />
              <span>{isSavingPassword ? t("Salvando...") : t("Salvar")}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4 text-white text-sm animate-[fadeIn_0.2s_ease-out]">
          {/* Identidade */}
          <div className="flex items-center gap-4 text-left border-b border-zinc-800 pb-4">
            <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white bg-black shrink-0">
              <PersonFillIcon size={24} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-white truncate">
                  {user?.username}
                </h2>
                {isSupporter && (
                  <span className="border border-amber-400 bg-amber-400 text-black px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full shrink-0">
                    {t("Apoiador")}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 break-all">{user?.email}</p>
            </div>
          </div>

          {/* Seção de Apoiador */}
          {isSupporter && (
            <div className="flex flex-col gap-3 py-1 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
                <span>{t("Apoiador")}</span>
              </div>

              {discordResult === "connected" && (
                <div className="border border-white bg-zinc-950 p-2 text-sm text-white">
                  [OK] {t("Discord conectado com sucesso")}
                </div>
              )}
              {discordResult === "error" && (
                <div className="border border-white bg-zinc-950 p-2 text-sm text-white">
                  [!]{" "}
                  {discordReason === "already_linked"
                    ? t("Discord ja vinculado")
                    : t("Erro ao conectar Discord")}
                </div>
              )}

              {/* As duas ações do apoiador lado a lado. `flex-wrap` cobre a
                  coluna estreita do /sessao, onde as duas não cabem na mesma
                  linha. */}
              <div className="flex flex-wrap items-center gap-2">
                {user?.discord_connected ? (
                  <span className="inline-flex items-center gap-1.5 border border-white px-2.5 py-1 text-sm text-white bg-zinc-950">
                    <CheckCircleFillIcon size={12} />
                    {t("Discord conectado")}
                  </span>
                ) : (
                  <a href="/api/v1/discord/connect" className="win-btn text-sm">
                    <DiscordIcon size={14} />
                    {t("Entrar no Discord")}
                  </a>
                )}

                <Link href="/apoiadores" className="win-btn text-sm gap-1.5">
                  <HeartFillIcon size={12} />
                  {t("Ver mural de apoiadores")}
                </Link>
              </div>
            </div>
          )}

          {/* Ações de conta, lado a lado. O erro de exportação fica embaixo
              para não empurrar os botões de linha. */}
          <div className="flex flex-col items-start gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="win-btn text-sm gap-1.5"
              >
                <PackageIcon size={12} />
                {isExporting ? t("Exportando...") : t("Exportar meus dados")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasswordChanged(false);
                  setIsChangingPassword(true);
                }}
                className="win-btn text-sm gap-1.5"
              >
                <KeyIcon size={12} />
                {t("Alterar senha")}
              </button>

              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="win-btn win-btn-muted text-sm gap-1.5"
              >
                <TrashIcon size={12} />
                {t("Excluir conta")}
              </button>
            </div>

            {exportError && (
              <p className="text-white text-sm border border-white p-2 mt-1">
                {exportError}
              </p>
            )}

            {passwordChanged && (
              <p className="text-white text-sm border border-white p-2 mt-1 bg-zinc-900">
                [OK] {t("Senha alterada")}
              </p>
            )}
          </div>
        </div>
      )}
    </CardNormal>
  );
}
