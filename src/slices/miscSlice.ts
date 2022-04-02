import { AnyAction } from "redux";
import { action, actionIsAnyOf } from "../actions";
import { storyActions } from "../storyActions";

export interface MiscState {
  readonly storyErrors: string[];
  readonly canContinue: boolean;
  readonly storyIsLoaded: boolean;
  readonly defaults: {
    readonly continueMax: boolean;
    readonly continueAfterChoice: boolean;
  };
}

const initState: MiscState = {
  storyErrors: [],
  canContinue: false,
  storyIsLoaded: false,
  defaults: {
    continueAfterChoice: true,
    continueMax: false,
  },
};

export const miscActions = {
  setCanContinue: action("misc/setCanContinue", (canContinue: boolean) => ({
    canContinue,
  })),
  setStoryErrors: action("misc/setStoryErrors", (errorMsgs: string[]) => ({
    storyErrors: errorMsgs,
  })),
  setStoryIsLoaded: action("misc/setStoryIsLoaded", (isLoaded: boolean) => ({
    storyIsLoaded: isLoaded,
  })),
  setDefaultContinueMax: action(
    "misc/setDefaultContinueMax",
    (continueMax: boolean) => ({ continueMax })
  ),
  setDefaultContinueAfterChoice: action(
    "misc/setDefaultContinueAfterChoice",
    (continueAfterChoice: boolean) => ({ continueAfterChoice })
  ),
};

// The payloads of these actions mirror the shape of the state,
// so they're can be implemented with a simple spread.
const isSimpleMiscSetter = actionIsAnyOf(
  miscActions.setCanContinue,
  miscActions.setStoryErrors,
  miscActions.setStoryIsLoaded
);

const isSimpleDefaultsSetter = actionIsAnyOf(
  miscActions.setDefaultContinueMax,
  miscActions.setDefaultContinueAfterChoice
);

export function miscReducer(state = initState, action: AnyAction): MiscState {
  if (!action) {
    return initState;
  }

  if (isSimpleMiscSetter(action)) {
    return {
      ...state,
      ...action.payload,
    };
  }

  if (isSimpleDefaultsSetter(action)) {
    return {
      ...state,
      defaults: {
        ...state.defaults,
        ...action.payload,
      },
    };
  }

  if (storyActions.clearStory.match(action)) {
    return initState;
  }

  return state;
}

export const getMiscSelectors = <S>(getSlice: (rootState: S) => MiscState) => ({
  selectCanContinue(rootState: S) {
    return getSlice(rootState).canContinue;
  },
  selectDefaultContinueMax(rootState: S) {
    return getSlice(rootState).defaults.continueMax;
  },
  selectDefaultContinueAfterChoice(rootState: S) {
    return getSlice(rootState).defaults.continueAfterChoice;
  },
  selectStoryErrors(rootState: S) {
    return getSlice(rootState).storyErrors;
  },
  selectStoryIsLoaded(rootState: S) {
    return getSlice(rootState).storyIsLoaded;
  },
});
