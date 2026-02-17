import { create } from 'zustand';

export interface ToastConfig {
  successMessage?: string;
  errorMessage?: string;
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right';
  theme?: 'light' | 'dark' | 'colored';
}

interface NotificationStore {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  globalConfig: ToastConfig;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  updateGlobalConfig: (config: Partial<ToastConfig>) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  globalConfig: {
    successMessage: '¡Operación exitosa!',
    errorMessage: 'Ocurrió un error',
    duration: 3000,
    position: 'top-right',
    theme: 'colored'
  },
  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    // Auto-remove
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  updateGlobalConfig: (config) => set((state) => ({
    globalConfig: { ...state.globalConfig, ...config }
  }))
}));
