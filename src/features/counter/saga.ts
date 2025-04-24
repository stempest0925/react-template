import { takeLatest, put, call } from "typed-redux-saga";
import { fetchCountAsync } from "./actions";

function* fetchCounterSaga() {
  try {
    const response = yield* call(
      (): Promise<number> => new Promise((resolve) => setTimeout(() => resolve(100), 1000))
    );
    yield* put(fetchCountAsync.success(response));
  } catch (error) {
    yield* put(fetchCountAsync.failure(error as Error));
  }
}

export default function* counterSaga() {
  yield* takeLatest(fetchCountAsync.request, fetchCounterSaga);
}
