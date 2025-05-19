import React from "react";
// import { useAppDispatch } from "@/hooks/redux";
// import { increment, incrementByAmount } from "./features/counter/slice";
// import { fetchCountAsync } from "./features/counter/actions";
import IndexedDBAdapter from "./utils/Tracker/IndexedDBAdapter";
const db = new IndexedDBAdapter("test");
db.initialize({ storeName: "time", keyPath: "id" });

function App() {
  // const dispatch = useAppDispatch();
  // dispatch(fetchCountAsync.request());
  console.log(new Error("1")); // source-map 开启后可以快速定位到这里的错误
  return (
    <div className="App">
      <h1>this is web app with react lib1</h1>
      <button
        onClick={() => {
          db.add("time", {
            id: Date.now().toString().split("").reverse().join("-").slice(0, 5),
            value: Date.now()
          }).then((count) => console.log(count));
        }}
      >
        add data
      </button>

      <button
        onClick={async () => {
          // db.queryByCondition("time", {}).then((data) => console.log(data));
          const a = await db.queryByKeys("time", ["2-7-6", "5-6-2"]);
          console.log(a);
          console.log(db.storeList);
        }}
      >
        query data
      </button>
    </div>
  );
}

export default App;
