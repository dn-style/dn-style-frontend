import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedBlock {
  id: string;
  name: string;
  data: string; // Serialized Craft.js JSON
}

interface BlockStore {
  blocks: SavedBlock[];
  saveBlock: (id: string, name: string, data: string) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => SavedBlock | undefined;
}

export const useBlockStore = create(
  persist<BlockStore>(
    (set, get) => ({
      blocks: [],
      saveBlock: (id, name, data) => set((state) => {
        const existingIndex = state.blocks.findIndex(b => b.id === id);
        if (existingIndex >= 0) {
          const newBlocks = [...state.blocks];
          newBlocks[existingIndex] = { id, name, data };
          return { blocks: newBlocks };
        }
        return { blocks: [...state.blocks, { id, name, data }] };
      }),
      deleteBlock: (id) => set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id)
      })),
      getBlock: (id) => get().blocks.find((b) => b.id === id),
    }),
    {
      name: 'dn-style-custom-blocks', // unique name for localStorage key
    }
  )
);
