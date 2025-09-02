import { configureStore } from "@reduxjs/toolkit";
import customerReducer from "./slice/customerSlice";
import productReducer from "./slice/productSlice";
import languageReducer from "./slice/languageSlice";

const store = configureStore({
  reducer: {
    customer: customerReducer,
    product: productReducer,
    language: languageReducer,
  },
});

export default store;
