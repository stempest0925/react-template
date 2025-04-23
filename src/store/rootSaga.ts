import { all } from "typed-redux-saga";

import counterSaga from "@/features/counter/saga";

export default function* rootSaga() {
  yield* all([counterSaga()]);
}
