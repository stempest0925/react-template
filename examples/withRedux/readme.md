## 为什么使用 typesafe-actions

- 能够快速创建异步处理 actions 流。
- 良好的 actions 类型推断。
- 避免编写传统的常量类型以及参数类型。

## 与 toolkit 的兼容问题

toolkit 内部实现了自己的异步处理方式，与 typesafe-actions 不同，这导致 typesafe-actions 创建的 action creator 不能直接在 slice 中使用。

## 可以实现 toolkit 的兼容

- 通过全局声明进行 slice extraReducers addClass的函数拓展支持。
- 通过编写辅助类，对 slice extraReducers，无需而外编写参数类型进行拓展。

## 为什么抛弃了 typesafe-actions

- 可以通过 toolkit createAction 创建具有类型推断的 actions。
- createAction 可以很好的接入 slice extraReducers，无需而外编写参数类型。
- 我们应该尽量避免修改全局、以及侵入式拓展。
- redux-saga 的工作流中，应当可以去除 toolkit支持，采用原 redux 写法，能够更好支持 typesafe-actions，但如果需要 toolkit 支持，那应该善用其已有的功能。
