import { createSlice } from "@reduxjs/toolkit";

const initialState = {};

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    languageData: (state, action) => {
      const { payload } = action?.payload;
      state.language = payload;
    },
  },
});

export const { languageData } = languageSlice.actions;

export default languageSlice.reducer;
