import { ActionType } from "typesafe-actions";

import * as counterActions from "./actions";

export type RootAction = ActionType<typeof counterActions>;
