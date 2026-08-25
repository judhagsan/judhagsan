import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import {
  PeopleIcon,
  ShieldLockIcon,
  HeartFillIcon,
  HeartIcon,
  ClockIcon,
  SearchIcon,
  XCircleFillIcon,
} from "@primer/octicons-react";
import useLanguage from "hooks/useLanguage";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

/*
 * Uma conta recém-criada carrega `read:activation_token` e nada mais — é o que
 * `activation.activateUserByUserId()` troca pelas features de verdade. Então a
 * presença dessa feature é o sinal de que o cadastro nunca foi confirmado.
 */
function isPending(features) {
  return Boolean(features?.includes("read:activation_token"));
}

/*
 * A barra é o elemento que dá identidade ao card: em vez de três números
 * soltos, mostra a proporção entre apoiadores, confirmados e pendentes. É o
 * funil que a tabela `users` já contém — o `features` de cada conta é, na
 * prática, em que etapa ela parou. Some quando não há ninguém, porque uma
 * barra vazia não informa nada.
 */
function FunnelBar({ supporters, confirmed, pending, total }) {
  if (total === 0) return null;

  const segments = [
    { value: supporters, className: "bg-amber-300/80" },
    { value: confirmed, className: "bg-violet-400/70" },
    { value: pending, className: "bg-white/15" },
  ];

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      {segments.map(
        (segment, index) =>
          segment.value > 0 && (
            <div
              key={index}
              className={`${segment.className} transition-[width] duration-500`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ),
      )}
    </div>
  );
}

function Count({ value, label, dotClassName, valueClassName }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full translate-y-[-1px] ${dotClassName}`}
      />
      <span className={`font-semibold tabular-nums ${valueClassName}`}>
        {value}
      </span>
      <span className="text-white/40">{label}</span>
    </span>
  );
}

function Badge({ icon, label, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] uppercase tracking-wider shrink-0 ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

/*
 * Vai para `document.body` por portal, e não fica onde o JSX está.
 * `.glass-card` usa `backdrop-filter`, e um elemento com backdrop-filter vira
 * bloco contentor dos descendentes `fixed` — dentro do card, o overlay
 * "fixo" se posicionaria em relação ao card e ainda seria cortado pelo
 * `overflow-hidden` dele.
 */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone,
  busy,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const confirmClasses =
    tone === "revoke"
      ? "bg-red-500/10 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/60 text-red-200"
      : "bg-amber-400/10 hover:bg-amber-400/30 border-amber-300/30 hover:border-amber-300/60 text-amber-100";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-card card-enter relative z-10 w-full max-w-sm rounded-[20px] p-6 shadow-2xl flex flex-col items-center text-center gap-4"
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center border ${
            tone === "revoke"
              ? "bg-red-500/15 border-red-400/40 text-red-200"
              : "bg-amber-400/15 border-amber-300/40 text-amber-100"
          }`}
        >
          <HeartFillIcon size={26} />
        </div>

        <p className="text-lg text-white font-semibold">{title}</p>
        <p className="text-sm leading-relaxed text-white/60">{description}</p>

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
          >
            {/* Reaproveita a chave já usada pelo card de exclusão de conta. */}
            {confirmLabel.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`cursor-pointer px-6 py-2 border rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm ${confirmClasses}`}
          >
            {busy ? confirmLabel.busy : confirmLabel.action}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CardAdminUsuarios() {
  const { language, t } = useLanguage();

  // Dois estados para a busca: o que se digita e o que vira requisição. Sem o
  // atraso, cada tecla dispara uma consulta à base inteira.
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // A busca roda no servidor, não sobre a lista já carregada: com a paginação
  // de 50, filtrar no cliente diria "nenhum resultado" para quem existe mas
  // ficou fora da página — errado de um jeito que parece certo.
  const listKey = searchTerm
    ? `/api/v1/users?search=${encodeURIComponent(searchTerm)}`
    : "/api/v1/users";

  const { data, error, isLoading, mutate } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
    // Segura a lista anterior enquanto a busca nova chega, em vez de piscar
    // vazio a cada letra.
    keepPreviousData: true,
    // Mesmo critério do card de dispositivos: 4xx é determinístico (sessão
    // expirada ou conta sem a feature), re-tentar só martela o servidor.
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status >= 400 && err?.status < 500) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
    },
  });

  // O portal só existe depois da montagem: no render do servidor não há
  // `document` para receber o diálogo.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const users = data?.users || [];

  // Contagens da página carregada, não da base inteira: quando as duas
  // divergem, o rodapé diz quantos estão à vista.
  const pendingCount = users.filter((each) => isPending(each.features)).length;
  const supporterCount = users.filter((each) =>
    each.features?.includes("apoiador"),
  ).length;
  const confirmedCount = users.length - pendingCount - supporterCount;

  async function confirmToggle() {
    if (busy || !confirming) return;

    setBusy(true);
    setActionError("");

    try {
      const response = await fetch(
        `/api/v1/users/${confirming.username}/supporter`,
        {
          method: confirming.isSupporter ? "DELETE" : "PUT",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setActionError(body.message || t("Erro ao alterar apoio"));
        return;
      }

      // Relê do servidor em vez de remendar a lista na mão: a resposta muda a
      // barra e a legenda também, e reconstruir isso no cliente é onde as duas
      // versões do mesmo dado começam a divergir.
      await mutate();
    } catch {
      setActionError(t("Erro de conexao"));
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  return (
    <div className="w-full">
      <div className="glass-card card-enter rounded-[20px] p-5 lg:p-6 shadow-2xl relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent -z-10 pointer-events-none"></div>

        {/* Cabeçalho. A barra vive aqui, e não numa faixa própria abaixo do
            título: na mesma linha ela se lê como indicador do card, e não como
            uma régua decorativa entre o título e a lista. Ocupa a sobra da
            linha (`flex-1`), então cresce com o card em vez de ficar num
            tamanho fixo que só serve a uma largura de tela. */}
        <div className="shrink-0 flex items-center gap-3 relative z-10 min-w-0">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shadow-lg shadow-violet-500/15 shrink-0">
            <PeopleIcon size={16} />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white/90 truncate">
            {t("Usuarios cadastrados")}
          </h2>

          {!isLoading && !error && users.length > 0 && (
            <div className="flex-1 min-w-0">
              <FunnelBar
                supporters={supporterCount}
                confirmed={confirmedCount}
                pending={pendingCount}
                total={users.length}
              />
            </div>
          )}
        </div>

        {/* Legenda e busca dividem a linha: à esquerda os três estados da
            barra em número e por extenso — é a legenda que dá nome às cores
            lá de cima —, à direita o campo de busca.

            A condição de fora é a da busca, mais ampla que a da legenda de
            propósito: numa busca sem resultado a legenda some, mas o campo
            precisa continuar na tela, senão não há como corrigir o termo. */}
        {!error && (users.length > 0 || searchTerm) && (
          <div className="relative z-10 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {!isLoading && users.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm shrink-0">
                {supporterCount > 0 && (
                  <Count
                    value={supporterCount}
                    label={t("apoiadores")}
                    dotClassName="bg-amber-300/80"
                    valueClassName="text-amber-100"
                  />
                )}
                <Count
                  value={confirmedCount}
                  label={t("confirmados")}
                  dotClassName="bg-violet-400/70"
                  valueClassName="text-white/90"
                />
                <Count
                  value={pendingCount}
                  label={t("pendentes")}
                  dotClassName="bg-white/15"
                  valueClassName="text-white/60"
                />
              </div>
            )}

            {/* `flex-1` sem teto: o campo toma toda a sobra da linha e se
                reajusta sozinho quando a legenda muda de tamanho — o que
                acontece o tempo todo, porque as contagens crescem de dígito e
                a de apoiadores só aparece quando existe algum.

                `min-w-[8rem]` é o piso: abaixo disso o campo deixa de ser
                utilizável, e aí o `flex-wrap` do contêiner joga ele para a
                própria linha, onde volta a ocupar a largura inteira. */}
            <label className="flex-1 min-w-[8rem] flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 focus-within:border-violet-400/50 focus-within:bg-white/10 transition-colors">
              <SearchIcon size={14} className="text-white/30 shrink-0" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("Buscar por nome ou email")}
                aria-label={t("Buscar por nome ou email")}
                className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder-white/30 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label={t("Limpar busca")}
                  className="cursor-pointer text-white/30 hover:text-white/70 transition-colors shrink-0"
                >
                  <XCircleFillIcon size={14} />
                </button>
              )}
            </label>
          </div>
        )}

        <div className="relative z-10 mt-4 flex flex-col gap-2 text-white/70">
          {isLoading && (
            <p className="text-white/40 text-center py-4">
              {t("Carregando...")}
            </p>
          )}

          {error && !isLoading && (
            <p className="text-red-300 text-center py-4 text-sm">
              {t("Erro ao carregar usuarios")}
            </p>
          )}

          {!isLoading && !error && users.length === 0 && (
            <p className="text-white/40 text-center py-4 text-sm">
              {searchTerm
                ? t("Nenhum usuario encontrado", { termo: searchTerm })
                : t("Nenhum usuario cadastrado")}
            </p>
          )}

          {/* A lista rola dentro do card: com a base crescendo, o card não pode
              empurrar o resto do painel para fora da tela. */}
          {users.length > 0 && (
            <ul className="flex flex-col max-h-[20rem] overflow-y-auto -mx-1 px-1">
              {users.map((userFound) => {
                const pending = isPending(userFound.features);
                const supporter = Boolean(
                  userFound.features?.includes("apoiador"),
                );

                return (
                  <li
                    key={userFound.id}
                    className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-b-0"
                  >
                    {/* O trilho repete, no começo da linha, a cor que o estado
                        tem na barra do cabeçalho. */}
                    <span
                      aria-hidden="true"
                      className={`w-0.5 self-stretch rounded-full shrink-0 ${
                        pending ? "bg-white/10" : "bg-violet-400/40"
                      }`}
                    />

                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate text-white/90">
                          {userFound.username}
                        </span>

                        {userFound.features?.includes("admin") && (
                          <Badge
                            icon={<ShieldLockIcon size={10} />}
                            label={t("Admin")}
                            className="bg-violet-500/10 border-violet-400/30 text-violet-200"
                          />
                        )}
                        {supporter && (
                          <Badge
                            icon={<HeartFillIcon size={10} />}
                            label={t("Apoiador")}
                            className="bg-amber-400/10 border-amber-300/30 text-amber-100"
                          />
                        )}
                        {pending && (
                          <Badge
                            icon={<ClockIcon size={10} />}
                            label={t("Pendente")}
                            className="bg-white/5 border-white/15 text-white/40"
                          />
                        )}
                      </div>
                      <span className="text-sm text-white/55 truncate">
                        {userFound.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-white/50 tabular-nums">
                        {formatDate(userFound.created_at, language)}
                      </span>

                      {/* Escondido para cadastros pendentes: dar benefício a
                          quem nunca confirmou o email é conceder acesso a uma
                          conta que ainda não se provou de ninguém. */}
                      {!pending && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirming({
                              username: userFound.username,
                              isSupporter: supporter,
                            })
                          }
                          title={
                            supporter
                              ? t("Revogar apoio")
                              : t("Tornar apoiador")
                          }
                          aria-label={
                            supporter
                              ? t("Revogar apoio")
                              : t("Tornar apoiador")
                          }
                          className={`cursor-pointer inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ${
                            supporter
                              ? "bg-amber-400/10 border-amber-300/30 text-amber-200 hover:bg-amber-400/20"
                              : "bg-white/5 border-white/10 text-white/40 hover:text-amber-200 hover:border-amber-300/30"
                          }`}
                        >
                          {supporter ? (
                            <HeartFillIcon size={14} />
                          ) : (
                            <HeartIcon size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {actionError && (
            <p className="text-red-300 text-sm pt-1">{actionError}</p>
          )}

          {/* Só aparece quando existe mais coisa do que a página trouxe — dizer
              "2 de 2" seria ruído. */}
          {data && data.total > users.length && (
            <p className="text-xs uppercase tracking-widest text-white/30 text-center pt-1">
              {t("Mostrando n de total", {
                n: users.length,
                total: data.total,
              })}
            </p>
          )}
        </div>
      </div>

      {mounted &&
        confirming &&
        createPortal(
          <ConfirmDialog
            tone={confirming.isSupporter ? "revoke" : "grant"}
            busy={busy}
            title={
              confirming.isSupporter ? t("Revogar apoio") : t("Tornar apoiador")
            }
            description={
              confirming.isSupporter
                ? t("Texto revogar apoio", { username: confirming.username })
                : t("Texto tornar apoiador", { username: confirming.username })
            }
            confirmLabel={{
              cancel: t("Cancelar"),
              busy: t("Salvando..."),
              // O botão do diálogo repete o nome da ação que o abriu: quem
              // clicou em "Revogar apoio" confirma em "Revogar apoio".
              action: confirming.isSupporter
                ? t("Revogar apoio")
                : t("Tornar apoiador"),
            }}
            onConfirm={confirmToggle}
            onCancel={() => {
              if (!busy) setConfirming(null);
            }}
          />,
          document.body,
        )}
    </div>
  );
}
