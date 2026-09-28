import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError, AuthResponse } from "../lib/api";
import { authStorage } from "../lib/auth-storage";

type User = AuthResponse["user"];

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   (async () => {
  //     const refreshToken = await authStorage.getRefreshToken();
  //     if (!refreshToken) {
  //       setIsLoading(false);
  //       return;
  //     }
  //     try {
  //       const res = await api.refresh(refreshToken);
  //       await authStorage.save(res.accessToken, res.refreshToken);
  //       setAccessToken(res.accessToken);
  //       setUser(res.user);
  //     } catch {
  //       // Refresh token invalid/expired, or the user no longer exists — clear everything.
  //       await authStorage.clear();
  //       setAccessToken(null);
  //       setUser(null);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    (async () => {
      console.log("AUTH INIT: checking refresh token");
      const refreshToken = await authStorage.getRefreshToken();
      console.log("AUTH INIT: refreshToken =", refreshToken);
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.refresh(refreshToken);
        console.log("AUTH INIT: refresh succeeded, got new accessToken");
        await authStorage.save(res.accessToken, res.refreshToken);
        setAccessToken(res.accessToken);
        setUser(res.user);
      } catch {
        console.log("AUTH INIT: refresh failed, clearing");
        await authStorage.clear();
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  
  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await authStorage.save(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    console.log("LOGOUT FN CALLED");
    // Update React state first so the navigation guard redirects immediately,
    // even if SecureStore is slow or fails.
    setAccessToken(null);
    setUser(null);
    await authStorage.clear();
    console.log("LOGOUT FN DONE - accessToken is null now");
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
