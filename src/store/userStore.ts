import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing: CustomerAddress;
  shipping: CustomerAddress;
}

interface UserState {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      login: (userData, token) => set({ user: userData, token, isLoggedIn: true }),
      logout: () => set({ user: null, token: null, isLoggedIn: false }),
      updateUser: (data) => set((state) => ({ 
        user: state.user ? { ...state.user, ...data } : null 
      })),
    }),
    {
      name: 'dn-style-user-storage',
    }
  )
);
