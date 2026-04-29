import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        if (!items.find((i) => i._id === product._id)) {
          set({ items: [...items, product] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i._id !== productId) });
      },

      toggleItem: (product) => {
        const { items } = get();
        if (items.find((i) => i._id === product._id)) {
          set({ items: items.filter((i) => i._id !== product._id) });
        } else {
          set({ items: [...items, product] });
        }
      },

      hasItem: (productId) => get().items.some((i) => i._id === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'yash-wishlist',
      getStorage: () => (typeof window !== 'undefined' ? localStorage : null),
    }
  )
);

export default useWishlistStore;
