import { createContext, useContext } from "react";
import type { AuthedUser } from "../App";

export type AuthContextType = {
  user: AuthedUser | null;
  authLoading: boolean;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthContext provider");
  return ctx;
}