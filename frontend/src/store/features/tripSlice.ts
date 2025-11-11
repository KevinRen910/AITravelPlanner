import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 完全删除Location接口的定义

interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  theme: string;
  special_requests: string;
  plan_content: any;
  estimated_budget: number;
  preferences: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    theme: string;
    specialRequests: string;
  };
  created_at: string;
  updated_at: string;
}

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  loading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,
};

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      state.trips = action.payload;
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.trips.push(action.payload);
    },
    updateTrip: (state, action: PayloadAction<Trip>) => {
      const index = state.trips.findIndex(trip => trip.id === action.payload.id);
      if (index !== -1) {
        state.trips[index] = action.payload;
      }
      if (state.currentTrip && state.currentTrip.id === action.payload.id) {
        state.currentTrip = action.payload;
      }
    },
    deleteTrip: (state, action: PayloadAction<string>) => {
      state.trips = state.trips.filter(trip => trip.id !== action.payload);
      if (state.currentTrip && state.currentTrip.id === action.payload) {
        state.currentTrip = null;
      }
    },
    setCurrentTrip: (state, action: PayloadAction<Trip | null>) => {
      state.currentTrip = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTrips, addTrip, updateTrip, deleteTrip, setCurrentTrip, setLoading, setError } = tripSlice.actions;

export default tripSlice.reducer;