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
import CardNormal from "./CardNormal";

const fetcher = (url) =>
  fetch(url, { credentials: "include" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r),
  );

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  /*
   * Numérica, não por extenso: "24 de ago. de 26" gasta uns 112px numa linha
   * que tem 310 no celular, e essa coluna disputa espaço com o username e os
   * selos. "24/08/26" cabe em metade disso e, com `tabular-nums`, alinha em
   * coluna — que é o que se quer de uma data numa lista de dados.
   */
  return date.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
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
    { value: supporters, className: "bg-amber-400" },
    { value: confirmed, className: "bg-violet-400" },
    { value: pending, className: "bg-zinc-700" },
  ];

  return (
    <div className="flex h-2 w-full overflow-hidden border border-zinc-800 bg-black">
      {segments.map(
        (segment, index) =>
          segment.value > 0 && (
            <div
              key={index}
              className={`${segment.className} transition-[width] duration-300`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ),
      )}
    </div>
  );
}

function Count({ value, label, dotClassName, valueClassName }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-sm">
      <span
        className={`inline-block w-1.5 h-1.5 translate-y-[-1px] ${dotClassName}`}
      />
      <span className={`font-bold tabular-nums ${valueClassName}`}>
        {value}
      </span>
      <span className="text-zinc-500 uppercase">{label}</span>
    </span>
  );
}

function Badge({ icon, label, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs uppercase  tracking-wider shrink-0 ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

/*
 * Vai para `document.body` por portal, e não fica onde o JSX está. Um
 * ancestral com `transform` — a entrada `.card-enter`, o deslize dos painéis —
 * vira bloco contentor dos descendentes `fixed`: dentro do card, o overlay
 * "fixo" se posicionaria em relação a ele e ainda seria cortado pelo
 * `overflow-hidden` da janela.
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
  const { t } = useLanguage();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black" onClick={onCancel} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Durante a requisição o círculo de voltar vira decoração, como o
            "Cancelar" desabilitado logo abaixo. */}
        <CardNormal
          title={t("Confirmar")}
          onBack={busy ? undefined : onCancel}
          backLabel={confirmLabel.cancel}
          className="card-enter"
          bodyClassName="p-5 flex flex-col items-center text-center gap-3"
        >
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center ${
              tone === "revoke"
                ? "border-red-600 bg-black text-red-500"
                : "border-amber-400 bg-black text-amber-400"
            }`}
          >
            {tone === "revoke" ? (
              <XCircleFillIcon size={22} />
            ) : (
              <HeartFillIcon size={22} />
            )}
          </div>

          <p className="text-base font-bold uppercase tracking-wider text-white">
            {title}
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

          <div className="flex gap-3 mt-2 w-full">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="win-btn flex-1 text-sm"
            >
              {/* Reaproveita a chave já usada pelo card de exclusão de conta. */}
              {confirmLabel.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-full border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                tone === "revoke"
                  ? "bg-red-600 enabled:hover:bg-red-500 text-white border-red-600"
                  : "bg-amber-400 enabled:hover:bg-amber-300 text-black border-amber-400"
              }`}
            >
              {busy ? confirmLabel.busy : confirmLabel.action}
            </button>
          </div>
        </CardNormal>
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
    <>
      <CardNormal
        title={t("Usuarios cadastrados")}
        icon={PeopleIcon}
        className="card-enter"
        bodyClassName="p-4 lg:p-5 flex flex-col gap-3"
      >
        {/* Barra de funil de proporção */}
        {!isLoading && !error && users.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <FunnelBar
              supporters={supporterCount}
              confirmed={confirmedCount}
              pending={pendingCount}
              total={users.length}
            />
          </div>
        )}

        {/* Legenda e busca dividem a linha: à esquerda os três estados da
              barra em número e por extenso — é a legenda que dá nome às cores
              da barra —, à direita o campo de busca.

              A condição de fora é a da busca, mais ampla que a da legenda de
              propósito: numa busca sem resultado a legenda some, mas o campo
              precisa continuar na tela, senão não há como corrigir o termo. */}
        {!error && (users.length > 0 || searchTerm) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-b border-zinc-800 pb-3">
            {/* `min-w-0` em vez de `shrink-0`: a legenda tem quebra própria,
                  e com `shrink-0` ela reivindicava a largura de tudo numa
                  linha só — transbordava em vez de quebrar quando as contagens
                  ganhassem dígito. Podendo encolher, ela quebra internamente e
                  a busca mantém seu piso. */}
            {!isLoading && users.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs min-w-0">
                {supporterCount > 0 && (
                  <Count
                    value={supporterCount}
                    label={t("apoiadores")}
                    dotClassName="bg-amber-400"
                    valueClassName="text-amber-300"
                  />
                )}
                <Count
                  value={confirmedCount}
                  label={t("confirmados")}
                  dotClassName="bg-violet-400"
                  valueClassName="text-violet-300"
                />
                <Count
                  value={pendingCount}
                  label={t("pendentes")}
                  dotClassName="bg-zinc-600"
                  valueClassName="text-zinc-500"
                />
              </div>
            )}

            {/* `flex-1` sem teto: o campo toma toda a sobra da linha e se
                  reajusta sozinho quando a legenda muda de tamanho — o que
                  acontece o tempo todo, porque as contagens crescem de dígito
                  e a de apoiadores só aparece quando existe algum.

                  `min-w-[8rem]` é o piso: abaixo disso o campo deixa de ser
                  utilizável, e aí o `flex-wrap` do contêiner joga ele para a
                  própria linha, onde volta a ocupar a largura inteira. */}
            <label className="flex-1 min-w-[8rem] flex items-center gap-2 px-2.5 py-1.5 bg-black border border-white focus-within:border-white transition-colors">
              <SearchIcon size={14} className="text-zinc-500 shrink-0" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("Buscar por nome ou email")}
                aria-label={t("Buscar por nome ou email")}
                className="flex-1 min-w-0 bg-transparent outline-none text-white placeholder-zinc-600 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label={t("Limpar busca")}
                  className="cursor-pointer text-zinc-500 hover:text-white transition-colors shrink-0"
                >
                  <XCircleFillIcon size={14} />
                </button>
              )}
            </label>
          </div>
        )}

        {/* Conteúdo / Lista */}
        <div className="flex flex-col gap-2 text-white">
          {isLoading && (
            <p className="text-zinc-500 text-center py-4 text-sm">
              [{t("Carregando...")}]
            </p>
          )}

          {error && !isLoading && (
            <p className="text-white border border-white p-2.5 text-center text-sm">
              [!] {t("Erro ao carregar usuarios")}
            </p>
          )}

          {!isLoading && !error && users.length === 0 && (
            <p className="text-zinc-500 text-center py-4 text-sm">
              {searchTerm
                ? t("Nenhum usuario encontrado", { termo: searchTerm })
                : t("Nenhum usuario cadastrado")}
            </p>
          )}

          {/* A lista rola dentro do card: com a base crescendo, o card não
                pode empurrar o resto do painel para fora da tela. */}
          {users.length > 0 && (
            <ul className="flex flex-col max-h-[18rem] overflow-y-auto divide-y divide-zinc-800">
              {users.map((userFound) => {
                const pending = isPending(userFound.features);
                const supporter = Boolean(
                  userFound.features?.includes("apoiador"),
                );

                return (
                  <li
                    key={userFound.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    {/* O trilho repete, no começo da linha, a cor que o
                          estado tem na barra do cabeçalho. */}
                    <span
                      aria-hidden="true"
                      className={`w-1 self-stretch shrink-0 ${
                        pending
                          ? "bg-zinc-800"
                          : supporter
                            ? "bg-amber-400"
                            : "bg-violet-400"
                      }`}
                    />

                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      {/* `flex-wrap`: com os dois selos, a linha pede
                            ~150px só para eles, e num celular sobram ~128px
                            para tudo. Sem quebrar, o username (que encolhe)
                            sumia e os selos (que não encolhem) eram cortados
                            pelo `overflow-hidden` do card. Descer de linha
                            custa altura, que é justamente o que sobra no
                            celular.

                            Ícone com rótulo em vez de só ícone de propósito:
                            tooltip não existe em toque. */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                        <span className="font-bold text-sm truncate text-white">
                          {userFound.username}
                        </span>

                        {userFound.features?.includes("admin") && (
                          <Badge
                            icon={<ShieldLockIcon size={9} />}
                            label={t("Admin")}
                            className="border-violet-400 bg-violet-400 text-black font-bold"
                          />
                        )}
                        {supporter && (
                          <Badge
                            icon={<HeartFillIcon size={9} />}
                            label={t("Apoiador")}
                            className="border-amber-400 bg-amber-400 text-black font-bold"
                          />
                        )}
                        {pending && (
                          <Badge
                            icon={<ClockIcon size={9} />}
                            label={t("Pendente")}
                            className="border-zinc-700 bg-zinc-800 text-zinc-400"
                          />
                        )}
                      </div>
                      <span className="text-sm text-zinc-400 truncate">
                        {userFound.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-zinc-400 tabular-nums">
                        {formatDate(userFound.created_at, language)}
                      </span>

                      {/* Escondido para cadastros pendentes: dar benefício a
                            quem nunca confirmou o email é conceder acesso a
                            uma conta que ainda não se provou de ninguém. */}
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
                          className={`cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
                            supporter
                              ? "border-amber-400 bg-amber-400 text-black hover:bg-amber-300"
                              : "border-zinc-800 bg-black text-zinc-500 hover:text-amber-400 hover:border-amber-400"
                          }`}
                        >
                          {supporter ? (
                            <HeartFillIcon size={12} />
                          ) : (
                            <HeartIcon size={12} />
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
            <p className="text-white border border-white p-2.5 text-sm">
              [!] {actionError}
            </p>
          )}

          {/* Só aparece quando existe mais coisa do que a página trouxe —
                dizer "2 de 2" seria ruído. */}
          {data && data.total > users.length && (
            <p className="text-xs uppercase tracking-widest text-zinc-500 text-center pt-2">
              {t("Mostrando n de total", {
                n: users.length,
                total: data.total,
              })}
            </p>
          )}
        </div>
      </CardNormal>

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
    </>
  );
}
