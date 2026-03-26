import { create } from 'zustand';

interface ConfigState {
  rate: number | null;
  loading: boolean;
  setRate: (rate: number) => void;
  fetchRate: (apiUrl: string) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  rate: null,
  loading: false,

  setRate: (rate) => set({ rate }),

  fetchRate: async (apiUrl) => {
    // Si ya tenemos el rate y no es nulo, no volvemos a pedirlo en esta sesin
    if (get().rate !== null) return;

    set({ loading: true });
    try {
      const res = await fetch(`${apiUrl}/wc/rate`);
      const data = await res.json();
      if (data && data.rate) {
        set({ rate: data.rate, loading: false });
      }
    } catch (error) {
      console.error('Error fetching global dollar rate:', error);
      set({ loading: false });
    }
  },
}));
