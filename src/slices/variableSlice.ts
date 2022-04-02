import * as simpleSet from "../util/simpleSet";
import * as simpleMap from "../util/simpleMap";
import { action } from "../actions";
import { AnyAction } from "redux";
import { storyActions } from "../storyActions";

export interface VariableSliceState {
  readonly trackedBools: simpleSet.SimpleSet;
  readonly trackedInts: simpleSet.SimpleSet;
  readonly trackedFloats: simpleSet.SimpleSet;
  readonly trackedStrings: simpleSet.SimpleSet;
  readonly values: simpleMap.SimpleMap<number | boolean | string>;
}

const initState: VariableSliceState = {
  trackedBools: simpleSet.create(),
  trackedInts: simpleSet.create(),
  trackedFloats: simpleSet.create(),
  trackedStrings: simpleSet.create(),
  values: simpleMap.create(),
};

export const variableActions = {
  startTrackingVariable: action(
    "variable/startTrackingVariable",
    (varName: string, varType: "boolean" | "string" | "int" | "float") => ({
      varName,
      varType,
    })
  ),
  stopTrackingVariable: action(
    "variable/stopTrackingVariable",
    (varName: string) => ({ varName })
  ),
  observeChangedVariableFromStory: action(
    "variable/observeChangedVariable",
    (varName: string, varValue: string) => ({ varName, varValue })
  ),
  setVariable: action(
    "variable/setVariable",
    (varName: string, varValue: any) => ({ varName, varValue })
  ),
};

export function variableReducer(
  state = initState,
  action: AnyAction
): VariableSliceState {
  if (variableActions.observeChangedVariableFromStory.match(action)) {
    const { varName, varValue } = action.payload;
    if (simpleSet.has(state.trackedBools, varName)) {
      return {
        ...state,
        values: simpleMap.set(state.values, varName, Boolean(varValue)),
      };
    }
    if (simpleSet.has(state.trackedFloats, varName)) {
      return {
        ...state,
        values: simpleMap.set(state.values, varName, Number(varValue)),
      };
    }
    if (simpleSet.has(state.trackedInts, varName)) {
      return {
        ...state,
        values: simpleMap.set(
          state.values,
          varName,
          Math.round(Number(varValue))
        ),
      };
    }
    if (simpleSet.has(state.trackedStrings, varName)) {
      return {
        ...state,
        values: simpleMap.set(state.values, varName, String(varValue)),
      };
    }
  }

  if (variableActions.startTrackingVariable.match(action)) {
    const { varName, varType } = action.payload;
    if (varType === "boolean") {
      return {
        ...state,
        trackedBools: simpleSet.add(state.trackedBools, varName),
      };
    }
    if (varType === "int") {
      return {
        ...state,
        trackedInts: simpleSet.add(state.trackedInts, varName),
      };
    }
    if (varType === "float") {
      return {
        ...state,
        trackedFloats: simpleSet.add(state.trackedFloats, varName),
      };
    }
    if (varType === "string") {
      return {
        ...state,
        trackedStrings: simpleSet.add(state.trackedStrings, varName),
      };
    }
    return state;
  }

  if (variableActions.stopTrackingVariable.match(action)) {
    const varName = action.payload.varName;
    return {
      ...state,
      trackedBools: simpleSet.remove(state.trackedBools, varName),
      trackedFloats: simpleSet.remove(state.trackedFloats, varName),
      trackedStrings: simpleSet.remove(state.trackedStrings, varName),
      trackedInts: simpleSet.remove(state.trackedInts, varName),
      values: simpleMap.remove(state.values, varName),
    };
  }

  if (storyActions.clearStory.match(action)) {
    return initState;
  }

  return state;
}

export const getVariableSelectors = <S>(
  getSlice: (rootState: S) => VariableSliceState
) => {
  function selectVarIsTrackedBool(rootState: S, varName: string) {
    return simpleMap.has(getSlice(rootState).trackedBools, varName);
  }
  function selectVarIsTrackedInt(rootState: S, varName: string) {
    return simpleMap.has(getSlice(rootState).trackedInts, varName);
  }
  function selectVarIsTrackedFloat(rootState: S, varName: string) {
    return simpleMap.has(getSlice(rootState).trackedFloats, varName);
  }
  function selectVarIsTrackedString(rootState: S, varName: string) {
    return simpleMap.has(getSlice(rootState).trackedStrings, varName);
  }
  function selectVarValue(rootState: S, varName: string) {
    return simpleMap.get(getSlice(rootState).values, varName);
  }

  return {
    selectVarIsTracked(rootState: S, varName: string) {
      if (selectVarIsTrackedBool(rootState, varName)) return true;
      if (selectVarIsTrackedInt(rootState, varName)) return true;
      if (selectVarIsTrackedFloat(rootState, varName)) return true;
      if (selectVarIsTrackedString(rootState, varName)) return true;
      return false;
    },
    selectVarIsTrackedBool,
    selectVarIsTrackedInt,
    selectVarIsTrackedFloat,
    selectVarIsTrackedString,
    selectVarValue,
    selectVarStringValue(rootState: S, varName: string) {
      const value = selectVarValue(rootState, varName);
      if (typeof value !== "string") {
        return undefined;
      }
      return value;
    },
    selectVarBoolValue(rootState: S, varName: string) {
      const value = selectVarValue(rootState, varName);
      if (typeof value !== "boolean") {
        return undefined;
      }
      return value;
    },
    selectVarNumberValue(rootState: S, varName: string) {
      const value = selectVarValue(rootState, varName);
      if (typeof value !== "number") {
        return undefined;
      }
      return value;
    },
  };
};
