import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],
  /** The customer most recently added or edited. */
  lastSaved: null,
};

export const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setCustomers: (state, action) => {
      state.list = Array.isArray(action.payload) ? action.payload : [];
    },
    customerSaved: (state, action) => {
      const customer = action.payload;
      if (!customer?.id) return;
      const index = state.list.findIndex((item) => item.id === customer.id);
      if (index >= 0) {
        state.list[index] = customer;
      } else {
        state.list.push(customer);
      }
      state.lastSaved = customer;
    },
    customerRemoved: (state, action) => {
      state.list = state.list.filter((item) => item.id !== action.payload);
    },
  },
});

export const { setCustomers, customerSaved, customerRemoved } =
  customerSlice.actions;

export const selectCustomers = (state) => state.customer.list;
export const selectLastSavedCustomer = (state) => state.customer.lastSaved;

export default customerSlice.reducer;
