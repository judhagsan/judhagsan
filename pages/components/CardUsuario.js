import { useState } from "react";
import { useRouter } from "next/router";
import {
  PersonFillIcon,
  PackageIcon,
  TrashIcon,
  AlertFillIcon,
} from "@primer/octicons-react";

export default function CardUsuario({ user }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

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
        setExportError(body.message || "Não foi possível exportar.");
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
      setExportError("Erro de conexão. Tente novamente.");
    } finally {
      setIsExporting(false);
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
        setErrorMessage(body.message || "Não foi possível excluir a conta.");
        setIsDeleting(false);
        return;
      }

      router.replace("/");
    } catch {
      setErrorMessage("Erro de conexão. Tente novamente.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full h-full">
      <div className="glass-card rounded-[20px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {isConfirming ? (
          <form
            onSubmit={handleDelete}
            className="flex flex-col items-center justify-center text-center gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.18s_ease-out]"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-200">
              <AlertFillIcon size={28} />
            </div>
            <p className="text-lg text-white font-semibold">Excluir conta</p>
            <p className="text-xs leading-relaxed max-w-xs">
              Esta ação é{" "}
              <span className="text-red-300 font-semibold">irreversível</span>.
              Seus dados, sessões e tokens serão eliminados.
            </p>
            <label className="flex flex-col gap-1 w-full max-w-xs">
              <span className="text-xs uppercase tracking-widest text-white/50">
                Digite{" "}
                <span className="normal-case tracking-normal text-cyan-300">
                  {user?.username}
                </span>{" "}
                para confirmar
              </span>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                autoComplete="off"
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-red-400/60 focus:bg-white/10 outline-none text-white placeholder-white/30 transition-colors text-center"
                placeholder={user?.username}
              />
            </label>

            {errorMessage && (
              <p className="text-red-300 text-xs">{errorMessage}</p>
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
                className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!confirmationMatches || isDeleting}
                className="cursor-pointer px-6 py-2 bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/60 text-red-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm inline-flex items-center gap-2"
              >
                <TrashIcon size={14} />
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-4 text-white/70 font-mono text-sm relative z-10 flex-1 h-full animate-[fadeIn_0.4s_ease-out]">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-200">
              <PersonFillIcon size={28} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xl lg:text-2xl text-white font-semibold">
                Bem vindo,{" "}
                <span className="text-cyan-300">{user?.username}</span>
              </p>
              <p className="text-xs text-white/50 break-all max-w-full">
                {user?.email}
              </p>
            </div>

            <div className="mt-4 flex flex-col items-start gap-2 self-start">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PackageIcon size={12} />
                {isExporting ? "Exportando..." : "Exportar meus dados"}
              </button>

              {exportError && (
                <p className="text-red-300 text-xs">{exportError}</p>
              )}

              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="cursor-pointer inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-red-300 transition-colors"
              >
                <TrashIcon size={12} />
                Excluir conta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
