
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: []
};

export const customerSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    userData: (state, action) => {
      const { payload } = action?.payload;
      state.user = payload;
    },
  },
});

export const { userData } = customerSlice.actions;

export default customerSlice.reducer;