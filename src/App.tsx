import React from "react";
import { useAppDispatch } from "@/hooks/redux";
import { increment, incrementByAmount } from "./features/counter/slice";
import { fetchCounterAsync } from "./features/counter/actions";

function App() {
  const dispatch = useAppDispatch();
  dispatch(fetchCounterAsync.request());
  return (
    <div className="App">
      <h1>this is web app with react lib</h1>
    </div>
  );
}

export default App;
