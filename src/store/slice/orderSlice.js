import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  order: [],
};

export const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    orderData: (state, action) => {
      const { payload } = action?.payload;
      state.order = payload;
    },
  },
});

export const { orderData } = orderSlice.actions;

export default orderSlice.reducer;
