import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],
};

export const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.list = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { setOrders } = orderSlice.actions;

export const selectOrders = (state) => state.order.list;

export default orderSlice.reducer;
