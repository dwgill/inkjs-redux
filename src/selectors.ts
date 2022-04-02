import type { InkJsReduxState } from "./reducer";
import { getChoiceSelectors } from "./slices/choiceSlice";
import { getMiscSelectors } from "./slices/miscSlice";
import { getNarrativeSelectors } from "./slices/narrativeSlice";
import { getVariableSelectors } from "./slices/variableSlice";

export const getSelectors = <S>(
  getSlice: (rootState: S) => InkJsReduxState
) => ({
  misc: getMiscSelectors((rootState: S) => getSlice(rootState).misc),
  choices: getChoiceSelectors((rootState: S) => getSlice(rootState).choices),
  narrative: getNarrativeSelectors(
    (rootState: S) => getSlice(rootState).narrative
  ),
  variables: getVariableSelectors(
    (rootState: S) => getSlice(rootState).variables
  ),
});

class _GetSelectorsReturnTypeWrapper<S> {
  fn(getStorySliceState: (rootState: S) => InkJsReduxState) {
    return getSelectors(getStorySliceState);
  }
}

export type Selectors<S> = ReturnType<_GetSelectorsReturnTypeWrapper<S>["fn"]>;
