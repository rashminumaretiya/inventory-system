import { configureStore } from "@reduxjs/toolkit";
import customerReducer from "./slice/customerSlice";
import productReducer from "./slice/productSlice";
import languageReducer from "./slice/languageSlice";
import orderReducer from "./slice/orderSlice";

const store = configureStore({
  reducer: {
    customer: customerReducer,
    product: productReducer,
    order: orderReducer,
    language: languageReducer,
  },
});

export default store;
