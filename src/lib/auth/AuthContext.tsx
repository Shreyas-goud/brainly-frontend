import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  normalizeError,
  setUnauthorizedHandler,
  tokenStore,
  type AppError,
} from "../api";

export type AuthResult =
  | { ok: true; token?: string }
  | { ok: false; error: AppError };

type AuthContextValue = {
  isAuthenticated: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
  setSession: (token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());

  const setSession = useCallback((newToken: string) => {
    tokenStore.set(newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token") {
        setToken(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await api.post<{ token: string }>("/api/v1/signin", {
          email: email.trim().toLowerCase(),
          password,
        });
        const jwt = res.data?.token;
        if (!jwt) {
          return {
            ok: false,
            error: {
              code: "SERVER_ERROR",
              message: "The server didn't return a session token.",
            },
          };
        }
        return { ok: true, token: jwt };
      } catch (err) {
        return { ok: false, error: normalizeError(err) };
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        await api.post("/api/v1/signup", {
          email: email.trim().toLowerCase(),
          password,
        });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: normalizeError(err) };
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      signIn,
      signUp,
      signOut,
      setSession,
    }),
    [token, signIn, signUp, signOut, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
