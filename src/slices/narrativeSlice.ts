import { nanoid } from "nanoid";
import { AnyAction } from "redux";
import { action } from "../actions";
import * as simpleSet from "../util/simpleSet";
import * as simpleMap from "../util/simpleMap";
import { SomeOmitSomePartial } from "../util/types";
import { storyActions } from "../storyActions";
import { objEntries } from "../util/objEntries";

export interface Narration {
  /**
   * A unique identifier for the Narration.
   * Only used within inkjs-redux, has no significance to inkjs itself.
   */
  readonly id: NarrationId;

  /**
   * The index of the Narration within a larger sequence of textual content.
   */
  readonly index: number;

  /**
   * A collection of metadata associated with the Narration by the user of
   * this library.
   */
  readonly meta?: simpleMap.SimpleMap<any>;

  /**
   * Any tags that were associated with the text by the Story.
   */
  readonly tags?: simpleSet.SimpleSet;

  /**
   * The text emitted by the Story. May include newlines, so
   * the string may need to be split accordingly when presented to
   * a player.
   */
  readonly text: string;
}

type NarrationId = string;
type NarrationIdGrouping = ReadonlyArray<NarrationId>;

export interface NarrativeSliceState {
  readonly flatNarrationIdOrdering: ReadonlyArray<NarrationId>;
  readonly groupedNarrationIdOrdering: ReadonlyArray<
    NarrationId | NarrationIdGrouping
  >;
  readonly groupTagReference: simpleSet.SimpleSet;
  readonly narrationMap: simpleMap.SimpleMap<Narration>;
  readonly ungroupTagReference: simpleSet.SimpleSet;
}

const initState: NarrativeSliceState = {
  flatNarrationIdOrdering: [],
  groupedNarrationIdOrdering: [],
  groupTagReference: simpleSet.create(),
  narrationMap: simpleMap.create(),
  ungroupTagReference: simpleSet.create(),
};

export const narrativeActions = {
  addNarration: action(
    "narrative/addNarration",
    (
      narration: SomeOmitSomePartial<Narration, "index" | "tags", "id"> & {
        tags?: string[] | simpleSet.SimpleSet;
      }
    ) => {
      const newNarration = { ...narration };
      if (!newNarration.id) {
        newNarration.id = nanoid();
      }
      if (newNarration.meta && simpleSet.size(newNarration.meta) === 0) {
        delete newNarration.meta;
      }
      if (Array.isArray(newNarration.tags)) {
        newNarration.tags = simpleSet.create(newNarration.tags!);
      }
      if (newNarration.tags && simpleSet.size(newNarration.tags) === 0) {
        delete newNarration.tags;
      }
      return {
        narration: newNarration as Omit<Narration, "index">,
      };
    }
  ),
  setNarrationMetadata: action(
    "narrative/setNarrationMetadata",
    (narrationId: string, entries: Record<string, any>) => ({
      id: narrationId,
      entries: objEntries(entries),
    })
  ),
  setTagReference: action(
    "narrative/setGroupTagReference",
    (groupTags: string[], ungroupTags: string[]) => ({ groupTags, ungroupTags })
  ),
};

export function narrativeReducer(
  state = initState,
  action: AnyAction
): NarrativeSliceState {
  if (!action) return state;

  if (narrativeActions.addNarration.match(action)) {
    const {
      payload: { narration },
    } = action;

    return {
      ...state,
      flatNarrationIdOrdering: [
        ...state.flatNarrationIdOrdering,
        narration.id,
      ],
      groupedNarrationIdOrdering: incorporateNewNarrationIntoGroups(
        narration,
        state.groupedNarrationIdOrdering,
        state.groupTagReference,
        state.ungroupTagReference
      ),
      narrationMap: simpleMap.set(state.narrationMap, narration.id, {
        ...narration,
        index: state.flatNarrationIdOrdering.length,
      }),
    };
  }

  if (narrativeActions.setNarrationMetadata.match(action)) {
    const {
      payload: { entries, id },
    } = action;

    if (!simpleMap.has(state.narrationMap, id)) {
      return state;
    }

    return {
      ...state,
      narrationMap: simpleMap.replace(
        state.narrationMap,
        id,
        (narration) => ({
          ...narration!,
          meta: simpleMap.setMany(narration?.meta, entries),
        })
      ),
    };
  }

  if (narrativeActions.setTagReference.match(action)) {
    return {
      ...state,
      groupTagReference: simpleSet.create(action.payload.groupTags),
      ungroupTagReference: simpleSet.create(action.payload.ungroupTags),
    };
  }

  if (storyActions.clearStory.match(action)) {
    return initState;
  }

  return state;
}

function incorporateNewNarrationIntoGroups(
  narration: Pick<Narration, "id" | "tags">,
  groups: NarrativeSliceState["groupedNarrationIdOrdering"],
  groupTags: NarrativeSliceState["groupTagReference"],
  ungroupTags: NarrativeSliceState["ungroupTagReference"]
): NarrativeSliceState["groupedNarrationIdOrdering"] {
  // If this is the first narration, it always begins a new group.
  if (groups.length === 0) {
    return [[narration.id]];
  }

  // Is this narration an ungroup? Exclude it from any groups.
  if (simpleSet.overlaps(narration.tags, ungroupTags)) {
    return [...groups, narration.id];
  }

  // Does this narration start a new group?
  if (simpleSet.overlaps(narration.tags, groupTags)) {
    return [...groups, [narration.id]];
  }

  const mostRecentGroup = groups[groups.length - 1];

  // This new narration just wants to continue any existing group,
  // but it will begin a new one anyway if the prior entry is an
  // ungroup.
  if (typeof mostRecentGroup === "string") {
    return [...groups, [narration.id]];
  }

  // Otherwise, just continue the existing group
  return [...groups.slice(0, -1), [...mostRecentGroup, narration.id]];
}

export const getNarrativeSelectors = <S>(
  getSlice: (rootState: S) => NarrativeSliceState
) => ({
  selectFlatNarrationOrdering(rootState: S) {
    return getSlice(rootState).flatNarrationIdOrdering;
  },
  selectGroupedNarrationOrdering(rootState: S) {
    return getSlice(rootState).groupedNarrationIdOrdering;
  },
  selectIsGroupTag(rootState: S, tag: string) {
    return simpleSet.has(getSlice(rootState).groupTagReference, tag);
  },
  selectIsUngroupTag(rootState: S, tag: string) {
    return simpleSet.has(getSlice(rootState).ungroupTagReference, tag);
  },
  selectNarrationById(rootState: S, narrationId: string) {
    return simpleMap.get(getSlice(rootState).narrationMap, narrationId);
  },
});
