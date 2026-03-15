import { create } from "zustand";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aios_token", accessToken);
      localStorage.setItem("aios_refresh_token", refreshToken);
      localStorage.setItem("aios_user", JSON.stringify(user));
    }
    set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("aios_token");
      localStorage.removeItem("aios_refresh_token");
      localStorage.removeItem("aios_user");
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  loadFromStorage: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }
    try {
      const token = localStorage.getItem("aios_token");
      const userJson = localStorage.getItem("aios_user");
      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aios_user", JSON.stringify(user));
    }
    set({ user });
  },
}));
