import { createAction } from "@reduxjs/toolkit";

export const fetchCountAsync = {
  request: createAction<void>("counter/fetchRequest"),
  success: createAction<number>("counter/fetchSuccess"),
  failure: createAction<Error>("counter/fetchFailure")
};

// export type CounterAction = ActionType<typeof fetchCounterAsync>;
