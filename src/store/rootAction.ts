import { ActionType } from "typesafe-actions";

import * as counterActions from "@/features/counter/actions";

export type RootAction = ActionType<typeof counterActions>;
