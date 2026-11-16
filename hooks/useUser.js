import { useCallback } from "react";
import useSWR from "swr";

/*
 * Feature explícita, gravada em `users.features` e devolvida pelo
 * `GET /api/v1/user`. Não é deduzida de permissão nenhuma: "vê o painel" e
 * "pode mexer em outro usuário" são perguntas diferentes, e o painel só faz a
 * primeira. Cada ação lá dentro continua exigindo a sua feature granular no
 * servidor — o cliente esconde a interface, não é ele que autoriza.
 */
const ADMIN_FEATURE = "admin";
const USER_ENDPOINT = "/api/v1/user";

async function userFetcher(url) {
  const response = await fetch(url, {
    credentials: "include",
  });

  // 401/403 significa visitante anônimo ou sessão expirada — não é erro
  // transitório e não deve disparar novas tentativas do SWR.
  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const error = new Error("Falha ao buscar usuário.");
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

export default function useUser() {
  const { data, isLoading, mutate } = useSWR(USER_ENDPOINT, userFetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status >= 400 && err?.status < 500) return;
      if (retryCount >= 2) return;
      setTimeout(() => revalidate({ retryCount }), 3000 * (retryCount + 1));
    },
  });

  const user = data ?? null;

  const refresh = useCallback(async () => {
    return (await mutate()) ?? null;
  }, [mutate]);

  const clear = useCallback(async () => {
    await mutate(null, { revalidate: false });
  }, [mutate]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/sessions", {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      await mutate(null, { revalidate: false });
    }
  }, [mutate]);

  return {
    user,
    isLoading,
    isLoggedIn: Boolean(user),
    isAdmin: Boolean(user?.features?.includes(ADMIN_FEATURE)),
    refresh,
    clear,
    logout,
  };
}
