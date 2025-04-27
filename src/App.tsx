import React from "react";
// import { useAppDispatch } from "@/hooks/redux";
// import { increment, incrementByAmount } from "./features/counter/slice";
// import { fetchCountAsync } from "./features/counter/actions";

function App() {
  // const dispatch = useAppDispatch();
  // dispatch(fetchCountAsync.request());
  console.log(new Error("1")); // source-map 开启后可以快速定位到这里的错误
  return (
    <div className="App">
      <h1>this is web app with react lib1</h1>
    </div>
  );
}

export default App;
