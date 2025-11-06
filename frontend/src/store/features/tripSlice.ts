import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Location {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  location: Location;
  startTime: string;
  endTime: string;
  category: string;
  cost: number;
}

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  destination: string;
  activities: Activity[];
  budget: number;
  createdAt: string;
  updatedAt: string;
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