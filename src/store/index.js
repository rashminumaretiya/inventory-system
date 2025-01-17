import { configureStore } from "@reduxjs/toolkit";
import customerReducer from "./slice/customerSlice";
import productReducer from "./slice/productSlice";

const store = configureStore({
  reducer: {
    customer: customerReducer,
    product: productReducer
  }
});

export default store;
