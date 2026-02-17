import { create } from 'zustand';

interface ContextMenuState {
  x: number;
  y: number;
  isOpen: boolean;
  nodeId: string | null;
  clipboard: string | null; // Serialized node data
  clipboardStyle: any | null; // Just props
  openMenu: (x: number, y: number, nodeId: string) => void;
  closeMenu: () => void;
  copyToClipboard: (data: string) => void;
  copyStyleToClipboard: (style: any) => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  x: 0,
  y: 0,
  isOpen: false,
  nodeId: null,
  clipboard: null,
  clipboardStyle: null,
  openMenu: (x, y, nodeId) => set({ x, y, isOpen: true, nodeId }),
  closeMenu: () => set({ isOpen: false }),
  copyToClipboard: (data) => set({ clipboard: data }),
  copyStyleToClipboard: (style) => set({ clipboardStyle: style }),
}));
