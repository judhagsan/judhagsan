import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  PersonFillIcon,
  DownloadIcon,
  TrashIcon,
  AlertFillIcon,
} from "@primer/octicons-react";

const PLATFORMS = {
  windows: { label: "Windows" },
  macos: { label: "macOS" },
  linux: { label: "Linux" },
};

function detectPlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac|iPhone|iPad/i.test(ua)) return "macos";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}

export default function CardSessao({ user }) {
  const router = useRouter();
  const [platform, setPlatform] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const detected = platform && PLATFORMS[platform];
  const downloadHref = detected ? `/api/v1/download/${platform}` : null;
  const downloadLabel = detected
    ? `Download Pindorama ${detected.label}`
    : "Download indisponível";

  const confirmationMatches = confirmationInput === user?.username;

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
      <div className="glass-card rounded-[35px] p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
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
            <p className="text-2xl text-white font-semibold">
              Bem vindo, <span className="text-cyan-300">{user?.username}</span>
            </p>

            <a
              href={downloadHref || "#"}
              aria-disabled={!downloadHref}
              onClick={(e) => {
                if (!downloadHref) e.preventDefault();
              }}
              className={`mt-4 inline-flex items-center gap-3 px-8 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 rounded-xl transition-all duration-300 group ${
                downloadHref
                  ? "cursor-pointer hover:bg-cyan-500/30 hover:border-cyan-500/60 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <DownloadIcon
                size={20}
                className="group-hover:text-cyan-400 transition-colors"
              />
              <span className="font-semibold text-base">{downloadLabel}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className="cursor-pointer mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-red-300 transition-colors"
            >
              <TrashIcon size={12} />
              Excluir conta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
