import { createSlice } from '@reduxjs/toolkit';

// localStorage'dan sepet verilerini yükle
const loadCartFromStorage = () => {
  if (typeof window === 'undefined') {
    return {
      items: [],
      isOpen: false,
      totalPrice: 0,
      totalItems: 0,
    };
  }

  try {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      return {
        items: parsed.items || [],
        isOpen: false, // Her zaman kapalı başlasın
        totalPrice: parsed.totalPrice || 0,
        totalItems: parsed.totalItems || 0,
      };
    }
  } catch (error) {
    console.error('Cart load error:', error);
  }

  return {
    items: [],
    isOpen: false,
    totalPrice: 0,
    totalItems: 0,
  };
};

// localStorage'a sepet verilerini kaydet
const saveCartToStorage = (items, totalPrice, totalItems) => {
  if (typeof window === 'undefined') return;

  try {
    const cartToSave = {
      items: JSON.parse(JSON.stringify(items)), // Immer proxy'sini serialize et
      totalPrice,
      totalItems,
    };
    localStorage.setItem('cart', JSON.stringify(cartToSave));
  } catch (error) {
    console.error('Cart save error:', error);
  }
};

const initialState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.coverImage || product.image || '/logo.svg',
          category: product.category,
          quantity: quantity,
        });
      }

      state.totalPrice = state.items.reduce((total, item) => {
        const priceStr = String(item.price || '0').replace(/[^\d.,]/g, '').replace(',', '.');
        return total + parseFloat(priceStr || 0) * item.quantity;
      }, 0);

      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

      // localStorage'a kaydet - Immer proxy'sini serialize et
      saveCartToStorage(state.items, state.totalPrice, state.totalItems);
    },

    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item.id !== productId);

      state.totalPrice = state.items.reduce((total, item) => {
        const priceStr = String(item.price || '0').replace(/[^\d.,]/g, '').replace(',', '.');
        return total + parseFloat(priceStr || 0) * item.quantity;
      }, 0);

      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

      // localStorage'a kaydet
      saveCartToStorage(state.items, state.totalPrice, state.totalItems);
    },

    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item.id === productId);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== productId);
        } else {
          item.quantity = quantity;
        }

        state.totalPrice = state.items.reduce((total, item) => {
          const priceStr = String(item.price || '0').replace(/[^\d.,]/g, '').replace(',', '.');
          return total + parseFloat(priceStr || 0) * item.quantity;
        }, 0);

        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      }

      // localStorage'a kaydet
      saveCartToStorage(state.items, state.totalPrice, state.totalItems);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
      state.totalItems = 0;

      // localStorage'a kaydet
      saveCartToStorage(state.items, state.totalPrice, state.totalItems);
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
} = cartSlice.actions;

export default cartSlice.reducer;
