"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getToken, getStoredUser, setToken, setStoredUser, logoutClient, api } from "@/lib/api";

interface AuthState {
  user: any;
  token: string | null;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<any>;
  updateUser: (u: any) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refresh: async () => null,
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(getStoredUser());
  const [token, setTok] = useState<string | null>(getToken());
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const login = useCallback((t: string, u: any) => {
    setToken(t);
    setStoredUser(u);
    setTok(t);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    logoutClient();
    setTok(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api<any>("/auth/me");
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch {
      logoutClient();
      setTok(null);
      setUser(null);
      return null;
    }
  }, []);

  const updateUser = useCallback((u: any) => {
    setStoredUser(u);
    setUser(u);
  }, []);

  useEffect(() => {
    if (getToken()) {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    }
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refresh, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}