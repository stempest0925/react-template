import { takeLatest, put, call } from "typed-redux-saga";
import { fetchCounterAsync } from "./actions";

function* fetchCounterSaga() {
  try {
    const response = yield* call(
      (): Promise<number> =>
        new Promise((resolve) => setTimeout(() => resolve(1), 1000))
    );
    yield* put(fetchCounterAsync.success(response));
  } catch (error) {
    yield* put(fetchCounterAsync.failure(error as Error));
  }
}

export default function* counterSaga() {
  yield* takeLatest(fetchCounterAsync.request, fetchCounterSaga);
}
