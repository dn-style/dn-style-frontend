import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActionInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
}

export interface SafeAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputs: ActionInput[];
  outputs?: any;
  code: string; // The "Safe JS" logic
  lastModified: number;
}

interface ActionStore {
  actions: SafeAction[];
  registerAction: (action: Omit<SafeAction, 'id' | 'lastModified'>) => void;
  updateAction: (id: string, updates: Partial<SafeAction>) => void;
  deleteAction: (id: string) => void;
  getAction: (id: string) => SafeAction | undefined;
}

export const useActionStore = create(
  persist<ActionStore>(
    (set, get) => ({
      actions: [
        {
          id: 'act_1',
          name: 'Calcular Descuento',
          description: 'Aplica un porcentaje de descuento al precio total.',
          icon: 'Calculator',
          inputs: [
            { name: 'precio', type: 'number', defaultValue: 0 },
            { name: 'porcentaje', type: 'number', defaultValue: 10 }
          ],
          code: 'return precio * (1 - porcentaje / 100);',
          lastModified: Date.now()
        },
        {
          id: 'act_2',
          name: 'Enviar Notificación Slack',
          description: 'Envía un mensaje a un canal de Slack.',
          icon: 'Send',
          inputs: [
            { name: 'mensaje', type: 'string', defaultValue: 'Nueva orden recibida' },
            { name: 'canal', type: 'string', defaultValue: '#ventas' }
          ],
          code: '// Lógica para llamar a la API de Slack\nconsole.log(`Enviando a ${canal}: ${mensaje}`);',
          lastModified: Date.now()
        }
      ],
      registerAction: (newAction) => set((state) => ({
        actions: [
          ...state.actions,
          {
            ...newAction,
            id: `act_${Math.random().toString(36).substr(2, 9)}`,
            lastModified: Date.now()
          }
        ]
      })),
      updateAction: (id, updates) => set((state) => ({
        actions: state.actions.map((a) => a.id === id ? { ...a, ...updates, lastModified: Date.now() } : a)
      })),
      deleteAction: (id) => set((state) => ({
        actions: state.actions.filter((a) => a.id !== id)
      })),
      getAction: (id) => get().actions.find((a) => a.id === id),
    }),
    {
      name: 'dn-style-safe-actions',
    }
  )
);
