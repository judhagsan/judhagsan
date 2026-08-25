import { useCallback, useEffect, useState } from "react";

/*
 * Feature explícita, gravada em `users.features` e devolvida pelo
 * `GET /api/v1/user`. Não é deduzida de permissão nenhuma: "vê o painel" e
 * "pode mexer em outro usuário" são perguntas diferentes, e o painel só faz a
 * primeira. Cada ação lá dentro continua exigindo a sua feature granular no
 * servidor — o cliente esconde a interface, não é ele que autoriza.
 */
const ADMIN_FEATURE = "admin";

export default function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/user", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const body = await response.json();
      setUser(body);
      return body;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/sessions", {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    isAdmin: Boolean(user?.features?.includes(ADMIN_FEATURE)),
    refresh: fetchUser,
    logout,
  };
}
