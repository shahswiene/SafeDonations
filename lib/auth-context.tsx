"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  email: string;
  role: "organizer" | "admin";
  fullName: string;
  gender?: string;
  age?: number;
  race?: string;
  ethnicity?: string;
  profileImage?: string;
  bankName?: string;
  bankAccount?: string;
}

interface LoginResult {
  userId: Id<"users">;
  token: string;
  role: "organizer" | "admin";
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  gender?: string;
  age?: number;
  race?: string;
  ethnicity?: string;
  bankName?: string;
  bankAccount?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const logoutMutation = useMutation(api.auth.logout);

  const user = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  ) as User | null | undefined;

  useEffect(() => {
    // Load token from localStorage on mount
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ email, password });
    localStorage.setItem("auth_token", result.token);
    setToken(result.token);
    return result; // Return result so caller can check role
  };

  const register = async (data: RegisterData) => {
    const result = await registerMutation(data);
    localStorage.setItem("auth_token", result.token);
    setToken(result.token);
  };

  const logout = async () => {
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  const refreshUser = () => {
    // Trigger re-fetch by updating token state
    const currentToken = localStorage.getItem("auth_token");
    setToken(currentToken);
  };

  // Determine if we're still loading
  // - isLoading: initial localStorage check
  // - token exists but user is undefined: waiting for Convex query
  // - token is null: not logged in, not loading
  const stillLoading = isLoading || (token !== null && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        token,
        isLoading: stillLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
