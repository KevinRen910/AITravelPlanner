import { configureStore } from '@reduxjs/toolkit';
import tripReducer from './features/tripSlice';
import userReducer from './features/userSlice';
import budgetReducer from './features/budgetSlice';

const store = configureStore({
  reducer: {
    trips: tripReducer,
    user: userReducer,
    budget: budgetReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;