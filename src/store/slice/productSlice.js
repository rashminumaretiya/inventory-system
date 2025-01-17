
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  product: []
};

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    productData: (state, action) => {
      const { payload } = action?.payload;
      state.product = payload;
    },
  },
});

export const { productData } = productSlice.actions;

export default productSlice.reducer;