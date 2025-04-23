import { createAsyncAction, ActionType } from "typesafe-actions";

export const fetchCounterAsync = createAsyncAction(
  "counter/fetchRequest",
  "counter/fetchSuccess",
  "counter/fetchFailure"
)<void, number, Error>();

// export type CounterAction = ActionType<typeof fetchCounterAsync>;
