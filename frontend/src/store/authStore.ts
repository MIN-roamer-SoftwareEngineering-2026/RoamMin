import { create } from 'zustand';
import type { User } from '../types';

type AuthStatus = 'anonymous' | 'loading' | 'authenticated';

interface AuthState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
}

const savedToken = sessionStorage.getItem('min-roamer.token');

export const useAuthStore = create<AuthState>((set) => ({
  token: savedToken,
  user: null,
  status: savedToken ? 'loading' : 'anonymous',
  setSession: (token, user) => {
    sessionStorage.setItem('min-roamer.token', token);
    set({ token, user, status: 'authenticated' });
  },
  setUser: (user) => set({ user, status: 'authenticated' }),
  clearSession: () => {
    sessionStorage.removeItem('min-roamer.token');
    set({ token: null, user: null, status: 'anonymous' });
  },
}));
