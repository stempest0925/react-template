import React from "react";
// import { useAppDispatch } from "@/hooks/redux";
// import { increment, incrementByAmount } from "./features/counter/slice";
// import { fetchCountAsync } from "./features/counter/actions";
import IndexedDBAdapter from "./utils/Tracker/IndexedDBAdapter";
const db = new IndexedDBAdapter("test");
db.initialize({ storeName: "time" });

function App() {
  // const dispatch = useAppDispatch();
  // dispatch(fetchCountAsync.request());
  console.log(new Error("1")); // source-map 开启后可以快速定位到这里的错误
  return (
    <div className="App">
      <h1>this is web app with react lib1</h1>
      <button
        onClick={() => {
          db.add("time", { value: Date.now() }).then((count) => console.log(count));
        }}
      >
        add data
      </button>

      <button
        onClick={() => {
          db.query("time", {}).then((data) => console.log(data));
        }}
      >
        query data
      </button>
    </div>
  );
}

export default App;
