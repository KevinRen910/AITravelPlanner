import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  preferences?: { [key: string]: any };
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload, updatedAt: new Date().toISOString() };
      }
    },
    setUserPreferences: (state, action: PayloadAction<{ [key: string]: any }>) => {
      if (state.user) {
        state.user.preferences = action.payload;
        state.user.updatedAt = new Date().toISOString();
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, updateUser, setUserPreferences, logoutUser, setLoading, setError } = userSlice.actions;

export default userSlice.reducer;