import { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMe, login as startLogin, logout as apiLogout } from "../api/auth";
import type { AuthUser } from "./auth-types";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => void;
  login: (redirect?: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["me"] });
  };

  const value: AuthContextType = {
    user: query.data?.user ?? null,
    loading: query.isLoading,
    refresh,
    login: (redirect = "/") => startLogin(redirect),
    logout: async () => {
      await apiLogout();
      refresh();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthProvider is missing");
  }
  return ctx;
}