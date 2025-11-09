import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// localStorage'a otomatik kaydetme için subscribe
if (typeof window !== 'undefined') {
  store.subscribe(() => {
    const state = store.getState();
    const cartState = state.cart;
    
    try {
      const cartToSave = {
        items: JSON.parse(JSON.stringify(cartState.items)), // Immer proxy'sini serialize et
        totalPrice: cartState.totalPrice,
        totalItems: cartState.totalItems,
      };
      localStorage.setItem('cart', JSON.stringify(cartToSave));
    } catch (error) {
      console.error('Store subscribe save error:', error);
    }
  });
}
