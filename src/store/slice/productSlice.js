import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],
  /** The product most recently added or edited, so open screens can react. */
  lastSaved: null,
};

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.list = Array.isArray(action.payload) ? action.payload : [];
    },
    productSaved: (state, action) => {
      const product = action.payload;
      if (!product?.id) return;
      const index = state.list.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        state.list[index] = product;
      } else {
        state.list.push(product);
      }
      state.lastSaved = product;
    },
    productRemoved: (state, action) => {
      state.list = state.list.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setProducts, productSaved, productRemoved } =
  productSlice.actions;

export const selectProducts = (state) => state.product.list;
export const selectLastSavedProduct = (state) => state.product.lastSaved;

export default productSlice.reducer;
