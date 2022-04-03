import { Story } from "inkjs";
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from "redux";
import { InkJsReduxState } from "./reducer";
import { getSelectors, Selectors } from "./selectors";
import { Choice, choiceActions } from "./slices/choiceSlice";
import { miscActions } from "./slices/miscSlice";
import { narrativeActions } from "./slices/narrativeSlice";
import { variableActions } from "./slices/variableSlice";
import { storyActions } from "./storyActions";
import { objEntries } from "./util/objEntries";
import { DistributiveOmit, ExternalStoryFunc } from "./util/types";

export { inkJsReduxReducer } from "./reducer";

interface CreateInkJsMiddlewareOptions<State> {
  getSlice: (state: State) => InkJsReduxState;
}
export function createInkJsMiddleware<State>({
  getSlice,
}: CreateInkJsMiddlewareOptions<State>): Middleware<{}, State> {
  return (api) => {
    const common = new InkJsReduxCommon(api, getSelectors(getSlice));
    return (next) => (action) => {
      if (!isTypicalAction(action)) {
        next(action);
        return;
      }

      for (const handler of allHandlers) {
        if (handler.match(action)) {
          handler.run(common, next, action as any);
          break;
        }
      }
    };
  };
}

function isTypicalAction(action: any): action is AnyAction {
  return (
    action != null &&
    typeof action === "object" &&
    typeof action.type === "string"
  );
}

class InkJsReduxCommon<S> {
  private story: null | InstanceType<typeof Story> = null;
  private boundExternalFunctionNames: Set<string>;

  public readonly api: MiddlewareAPI<Dispatch<AnyAction>, S>;
  public readonly selectors: Selectors<S>;

  constructor(
    api: MiddlewareAPI<Dispatch<AnyAction>, S>,
    selectors: Selectors<S>
  ) {
    this.api = api;
    this.selectors = selectors;
    this.boundExternalFunctionNames = new Set();
  }

  setStory(story: InstanceType<typeof Story>) {
    this.clearStory();
    this.story = story;
  }

  clearStory() {
    if (this.story == null) return;
    this.story.RemoveVariableObserver(this.variableObserver);
    this.boundExternalFunctionNames.forEach((name) => {
      this.unbindExternalFunction(name);
    });
    this.boundExternalFunctionNames.clear();
    this.story = null;
  }

  storyExists() {
    return this.story != null;
  }

  observeVariable(variableName: string) {
    if (this.story == null) {
      console.error(
        `Attempted to observe variable ${variableName} of non-existant story`
      );
      return;
    }
    this.story.ObserveVariable(variableName, this.variableObserver);
  }

  stopObservingVariable(variableName: string) {
    if (this.story == null) {
      console.error(
        `Attempted to stop observing variable ${variableName} of non-existant story`
      );
      return;
    }
    this.story.RemoveVariableObserver(this.variableObserver, variableName);
  }

  getCurrentVariableValue(variableName: string) {
    if (this.story == null) {
      console.error(
        `Attempted to read current value of variable '${variableName}' with non-existant story.`
      );
      return null;
    }

    try {
      return this.story.variablesState.$(variableName, undefined);
    } catch (err) {
      console.error(
        `Attempted to read current value of invalid variable '${variableName}'`,
        err
      );
      return null;
    }
  }

  setCurrentVariableValue(variableName: string, newValue: any) {
    if (this.story == null) {
      console.error(
        `Attempted to set current value of variable '${variableName}' with non-existant story.`
      );
      return;
    }

    try {
      this.story.variablesState.$(variableName, newValue);
    } catch (err) {
      if (
        (err as any)?.message?.match?.(
          /Cannot assign to a variable.*that hasn't been declared in the story/
        )
      ) {
        console.error(
          `Attempted to set variable '${variableName}' that has not been declared in the story.`
        );
        return;
      }
      if (
        (err as any)?.message?.match?.(
          /Invalid value passed to VariableState:.*/
        )
      ) {
        console.error(
          `Attempted to set variable '${variableName}' to invalid value: ${newValue}`
        );
        return;
      }
      console.error(
        `Encountered error setting current value of variable ${variableName}.`,
        err
      );
    }
  }

  private variableObserver = (varName: string, varValue: any) => {
    if (
      this.selectors.variables.selectVarIsTracked(this.api.getState(), varName)
    ) {
      this.api.dispatch(
        variableActions.observeChangedVariableFromStory(varName, varValue)
      );
    }
  };

  bindExternalFunction(
    name: string,
    func: ExternalStoryFunc<unknown>,
    lookaheadSafe: boolean
  ) {
    if (this.story == null) {
      console.error(
        `Attempted to bind external function '${name}' to non-existant story.`
      );
      return;
    }

    if (this.boundExternalFunctionNames.has(name)) {
      console.error(
        `Attempted to bind already-bound external function '${name}'`
      );
      return;
    }

    try {
      this.story.BindExternalFunction(name, func, lookaheadSafe);
    } catch (err) {
      console.error(
        `Encountered error binding external function '${name}' to story.`
      );
      return;
    }

    this.boundExternalFunctionNames.add(name);
  }

  unbindExternalFunction(name: string) {
    if (this.story == null) {
      console.error(
        `Attempted to unbind external function '${name}' from non-existant story.`
      );
      return;
    }

    if (!this.boundExternalFunctionNames.has(name)) {
      return;
    }

    try {
      this.story.UnbindExternalFunction(name);
    } catch (err) {
      console.error(
        `Encountered error unbinding external function '${name}' from story.`
      );
    }

    this.boundExternalFunctionNames.delete(name);
  }

  externalFunctionNameIsBound(name: string) {
    return this.boundExternalFunctionNames.has(name);
  }

  readStoryStateToRedux() {
    if (this.story == null) {
      console.error(
        "Attempted to read story state to redux from from non-existant story."
      );
      return null;
    }

    const canContinue = this.story.canContinue;
    const currentText = this.story.currentText ?? "";
    const currentTags = this.story.currentTags;
    const currentErrors = this.story.currentErrors ?? [];
    const currentChoices: DistributiveOmit<Choice, "id">[] =
      this.story.currentChoices.map((cc) => ({
        index: cc.index,
        isInvisibleDefault: cc.isInvisibleDefault,
        text: cc.text,
      }));

    this.api.dispatch(
      narrativeActions.addNarration({
        text: currentText,
        tags: currentTags ?? [],
      })
    );

    this.api.dispatch(miscActions.setCanContinue(!!canContinue));
    this.api.dispatch(miscActions.setStoryErrors(currentErrors));
    this.api.dispatch(choiceActions.setChoices(currentChoices));

    return {
      canContinue,
      currentText,
      currentTags,
      currentErrors,
      currentChoices,
    };
  }

  continueStory() {
    if (this.story == null) {
      console.error("Attempted to continue non-existant story.");
      return;
    }

    if (!this.story.canContinue) {
      console.error("Attempted to continue non-continuable story.");
    }

    this.story.Continue();
  }

  chooseChoiceIndex(choiceIndex: number) {
    if (this.story == null) {
      console.error(
        `Attempted to choose index ${choiceIndex} of non-existant story.`
      );
      return;
    }
    this.story.ChooseChoiceIndex(choiceIndex);
  }
}

interface Handler<A extends AnyAction> {
  match(action: AnyAction): action is A;
  run<S>(
    common: InkJsReduxCommon<S>,
    next: Dispatch<AnyAction>,
    action: A
  ): void;
}

const createHandler = <A extends AnyAction>(handler: Handler<A>) => handler;

const handleClearStory = createHandler({
  match: storyActions.clearStory.match,
  run(common, next, action) {
    common.clearStory();
    next(action);
  },
});

const handleSetStory = createHandler({
  match: storyActions.setStory.match,
  run(common, _next: unknown, action) {
    let { story, config } = action.payload;
    common.api.dispatch(storyActions.clearStory());
    common.clearStory();

    if (!config || config.version !== 1) {
      console.error("Attempted to set story with invalid configuration.");
      return;
    }
    if (story == null) {
      console.error("Attempted to set story with non-existant story.");
      return;
    }
    if (typeof story === "string") {
      try {
        story = new Story(story);
      } catch (err) {
        console.error("Attempted to set story with invalid json", err);
        return;
      }
    } else if (!(story instanceof Story)) {
      console.error("Attempted to set story with invalid story object", story);
      return;
    }

    common.setStory(story);
    common.api.dispatch(miscActions.setStoryIsLoaded(true));

    if (config.defaultContinueMaximally != null) {
      common.api.dispatch(
        miscActions.setDefaultContinueMax(!!config.defaultContinueMaximally)
      );
    }

    if (config.defaultContinueAfterChoice != null) {
      common.api.dispatch(
        miscActions.setDefaultContinueAfterChoice(
          !!config.defaultContinueAfterChoice
        )
      );
    }

    common.api.dispatch(
      narrativeActions.setTagReference(
        config?.lineGrouping?.groupTags ?? [],
        config?.lineGrouping?.grouplessTags ?? []
      )
    );

    for (const varName of config?.trackedVariables?.bool ?? []) {
      common.api.dispatch(
        variableActions.startTrackingVariable(varName, "boolean")
      );
    }
    for (const varName of config?.trackedVariables?.int ?? []) {
      common.api.dispatch(
        variableActions.startTrackingVariable(varName, "int")
      );
    }
    for (const varName of config?.trackedVariables?.float ?? []) {
      common.api.dispatch(
        variableActions.startTrackingVariable(varName, "float")
      );
    }
    for (const varName of config?.trackedVariables?.string ?? []) {
      common.api.dispatch(
        variableActions.startTrackingVariable(varName, "string")
      );
    }

    for (const [name, func] of objEntries(config?.externalFunctions ?? {})) {
      common.api.dispatch(
        storyActions.bindExternalFunction({
          func: func as any,
          name,
          lookaheadSafe: false,
        })
      );
    }

    for (const [name, func] of objEntries(
      config?.lookaheadSafeExternalFunctions ?? {}
    )) {
      common.api.dispatch(
        storyActions.bindExternalFunction({
          func: func as any,
          name,
          lookaheadSafe: false,
        })
      );
    }

    common.readStoryStateToRedux();
    if (
      common.selectors.misc.selectCanContinue(common.api.getState()) &&
      common.selectors.misc.selectDefaultContinueMax(common.api.getState())
    ) {
      common.api.dispatch(storyActions.continueStory());
    }
  },
});

const handleStartTrackingVariable = createHandler({
  match: variableActions.startTrackingVariable.match,
  run(common, next, action) {
    const { varName } = action.payload;
    if (!common.storyExists()) {
      console.error(
        `Attempted to track variable '${varName} of non-existant story.`
      );
      return;
    }

    if (
      common.selectors.variables.selectVarIsTracked(
        common.api.getState(),
        varName
      )
    ) {
      // If we're currently tracking the variable, stop so we can setup the new tracking logic.
      common.api.dispatch(variableActions.stopTrackingVariable(varName));
    }

    // Pass the new action through to the reducer so the state is in place as expected.
    next(action);

    const varValue = common.getCurrentVariableValue(varName);
    common.api.dispatch(
      variableActions.observeChangedVariableFromStory(varName, varValue)
    );

    common.observeVariable(varName);
  },
});

const handleStopTrackingVariable = createHandler({
  match: variableActions.stopTrackingVariable.match,
  run(common, next, action) {
    const { varName } = action.payload;
    if (!common.storyExists()) {
      console.error(
        `Attempted to stop tracking variable '${varName} of non-existant story.`
      );
      return;
    }

    if (
      common.selectors.variables.selectVarIsTracked(
        common.api.getState(),
        varName
      )
    ) {
      return;
    }

    next(action);

    common.stopObservingVariable(varName);
  },
});

const handleBindExternalFunction = createHandler({
  match: storyActions.bindExternalFunction.match,
  run(common, _next: unknown, action) {
    const { func, name, lookaheadSafe = false } = action.payload;
    if (common.externalFunctionNameIsBound(name)) {
      common.unbindExternalFunction(name);
    }

    common.bindExternalFunction(name, func, lookaheadSafe);
  },
});

const handleContinueStory = createHandler({
  match: storyActions.continueStory.match,
  run(common, _next: unknown, action) {
    if (!common.storyExists()) {
      console.error("Attempted to continue non-existant story.");
      return;
    }

    let maximally =
      action.payload.maximally ??
      common.selectors.misc.selectDefaultContinueMax(common.api.getState());

    let canContinue = common.selectors.misc.selectCanContinue(
      common.api.getState()
    );

    if (!canContinue) {
      console.error("Attempted to continue non-continuable story.");
      return;
    }

    while (canContinue) {
      common.continueStory();
      canContinue = !!common.readStoryStateToRedux()?.canContinue;
      if (!maximally) {
        break;
      }
    }
  },
});

const handleChooseChoice = createHandler({
  match: storyActions.chooseChoice.match,
  run(common, _next: unknown, action) {
    const { continueAfter } = action.payload;
    if (!common.storyExists()) {
      console.error("Tried to choose choice with non-existant story.");
      return;
    }

    const numChoices = common.selectors.choices.selectNumberOfChoices(
      common.api.getState()
    );

    if (numChoices === 0) {
      console.error("Tried to choose choice, but there are no known chocies.");
    }

    let choice: Choice | undefined;
    if ("index" in action.payload) {
      const { index } = action.payload;
      choice = common.selectors.choices.selectChoiceByIndex(
        common.api.getState(),
        index
      );
      if (choice == null) {
        console.error(`Failed to retrieve choice at index ${index}.`);
        return;
      }
    } else {
      const { id } = action.payload;
      choice = common.selectors.choices.selectChoiceById(
        common.api.getState(),
        id
      );
      if (choice == null) {
        console.error(`Failed to retrieve choice '${id}' from redux.`);
        return;
      }
    }

    common.chooseChoiceIndex(choice.index);
    common.readStoryStateToRedux();
    if (continueAfter) {
      common.api.dispatch(storyActions.continueStory(continueAfter === "max"));
    } else if (
      continueAfter == null &&
      common.selectors.misc.selectDefaultContinueAfterChoice(
        common.api.getState()
      )
    ) {
      common.api.dispatch(storyActions.continueStory());
    }
  },
});

const allHandlers = [
  handleChooseChoice,
  handleContinueStory,
  handleStartTrackingVariable,
  handleStopTrackingVariable,
  handleBindExternalFunction,
  handleClearStory,
  handleSetStory,
];
