// store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: null,
  fullName: null,
  email: null,
  token: null,
  image: '',
  connections: 0,
  total_match: 0,
  win_match: 0,
  role: 'single', // Quoted to prevent ReferenceError
  isLoggedIn: false,
  mobile : 12345678
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      // Handles both flat payloads and nested { user: {...}, token } payloads
      const userData = action.payload.user || action.payload;

      state.id = userData.id ?? state.id;
      state.fullName = userData.fullName ?? state.fullName;
      state.connections = userData.connections ?? state.connections;
      state.email = userData.email ?? state.email;
      state.image = userData.image ?? state.image;
      state.token = action.payload.token ?? userData.token ?? state.token;
      state.total_match = userData.total_match ?? state.total_match;
      state.win_match = userData.win_match ?? state.win_match;
      state.role = userData.role ?? state.role;
      state.isLoggedIn = true;
    },
    updateStats: (state, action) => {
      if (action.payload.total_match !== undefined) {
        state.total_match = action.payload.total_match;
      }
      if (action.payload.win_match !== undefined) {
        state.win_match = action.payload.win_match;
      }
    },
    // In Redux Toolkit/Immer, returning initialState resets all fields at once
    logout: () => initialState,
  },
});

export const { loginSuccess, updateStats, logout } = authSlice.actions;
export default authSlice.reducer;
