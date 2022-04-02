import { combineReducers } from "redux";
import { choiceReducer } from "./slices/choiceSlice";
import { miscReducer } from "./slices/miscSlice";
import { narrativeReducer } from "./slices/narrativeSlice";
import { variableReducer } from "./slices/variableSlice";

export const inkJsReduxReducer = combineReducers({
  misc: miscReducer,
  choices: choiceReducer,
  narrative: narrativeReducer,
  variables: variableReducer,
});

export type InkJsReduxState = ReturnType<typeof inkJsReduxReducer>;
