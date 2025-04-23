import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { AppState } from "@/store";
import { fetchCounterAsync } from "./actions";

interface CounterState {
  value: number;
  state: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CounterState = {
  value: 0,
  state: "idle",
  error: null,
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCounterAsync.request, (state) => {
        state.state = "loading";
      })
      .addCase(fetchCounterAsync.success, (state, action) => {
        state.state = "succeeded";
        state.value = action.payload;
      })
      .addCase(fetchCounterAsync.failure, (state, action) => {
        state.error = action.payload.message;
      });
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

export const counterNumber = (state: AppState) => state.counter.value;

export default counterSlice.reducer;
