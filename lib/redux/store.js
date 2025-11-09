import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
  });
};
