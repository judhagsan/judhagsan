import { useCallback, useEffect, useState } from "react";

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

  return { user, isLoading, isLoggedIn: !!user, refresh: fetchUser, logout };
}
