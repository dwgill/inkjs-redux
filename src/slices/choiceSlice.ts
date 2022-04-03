import { AnyAction } from "redux";
import { action } from "../actions";
import { SomePartial } from "../util/types";
import { nanoid } from "nanoid/non-secure";
import { storyActions } from "../storyActions";
import * as simpleMap from "../util/simpleMap";

export interface Choice {
  readonly id: string;
  readonly index: number;
  readonly text: string;
  readonly isInvisibleDefault: boolean;
}

export interface ChoiceSliceState {
  readonly orderedChoices: ReadonlyArray<Choice>;
  readonly orderedChoiceIds: ReadonlyArray<string>;
  readonly choiceIdIndexMap: simpleMap.SimpleMap<number>;
}

const initState: ChoiceSliceState = {
  orderedChoices: [],
  orderedChoiceIds: [],
  choiceIdIndexMap: simpleMap.create(),
};

export const choiceActions = {
  setChoices: action(
    "choice/setChoices",
    (newChoices: SomePartial<Choice, "id">[]) => {
      if (newChoices.some((choice) => !choice.id)) {
        newChoices = newChoices.map((choice) => {
          if (choice.id) return choice;
          return { ...choice, id: `choice/${nanoid()}` };
        });
      }
      return {
        choices: newChoices as Choice[],
      };
    }
  ),
};

export function choiceReducer(
  state = initState,
  action: AnyAction
): ChoiceSliceState {
  if (!action) {
    return state;
  }

  if (choiceActions.setChoices.match(action)) {
    const orderedChoices = [...action.payload.choices].sort(
      (a, b) => a.index - b.index
    );
    return {
      ...state,
      choiceIdIndexMap: simpleMap.create(
        action.payload.choices.map((choice) => [choice.id, choice.index])
      ),
      orderedChoices,
      orderedChoiceIds: orderedChoices.map((choice) => choice.id),
    };
  }

  if (storyActions.clearStory.match(action)) {
    return initState;
  }

  return state;
}

export const getChoiceSelectors = <S>(
  getSlice: (rootState: S) => ChoiceSliceState
) => ({
  selectAllChoices(rootState: S) {
    return getSlice(rootState).orderedChoices;
  },
  selectAllChoiceIds(rootState: S) {
    return getSlice(rootState).orderedChoiceIds;
  },
  selectNumberOfChoices(rootState: S) {
    return getSlice(rootState).orderedChoices.length;
  },
  selectChoiceById(rootState: S, id: string): Choice | undefined {
    const state = getSlice(rootState);
    const idIndexMap = state.choiceIdIndexMap;
    if (!simpleMap.has(idIndexMap, id)) return undefined;
    return state.orderedChoices[simpleMap.get(idIndexMap, id)!];
  },
  selectChoiceByIndex(rootState: S, index: number): Choice | undefined {
    const state = getSlice(rootState);
    return state.orderedChoices[index];
  },
});
