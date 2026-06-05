import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, clearSession, getCachedUser, getToken, setSession, User } from "./api";

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cached = await getCachedUser();
      const token = await getToken();
      if (cached && token) {
        // Verify token still valid
        try {
          const me = await api<User>("/auth/me");
          setUser(me);
        } catch {
          await clearSession();
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    await setSession(data.access_token, data.user);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
