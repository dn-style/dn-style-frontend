import {create} from "zustand";

interface Category {
  id: number;
  slug: string;
  name: string;
  parent: number;
}

interface CategoryMapState {
  categories: Category[];
  slugToId: Record<string, number>;
  setCategories: (cats: Category[]) => void;
}

export const useCategoriesStore = create<CategoryMapState>((set) => ({
  categories: [],
  slugToId: {},
  setCategories: (cats) => {
    const map: Record<string, number> = {};
    cats.forEach((c) => (map[c.slug] = c.id));
    set({ categories: cats, slugToId: map });
  },
}));