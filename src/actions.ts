import { AnyAction } from "redux";

export const INKJS_REDUX_ACTION_PREFIX = "@inkjs-redux";

type ActionTypeString<T extends string> =
  `${typeof INKJS_REDUX_ACTION_PREFIX}/${T}`;

function actionType<T extends string>(type: T): ActionTypeString<T> {
  return `${INKJS_REDUX_ACTION_PREFIX}/${type}`;
}

interface PayloadAction<T extends string, P = void> {
  type: T;
  payload: P;
}

export interface InkJsActionCreator<
  Type extends string,
  Args extends unknown[],
  Payload = void
> {
  (...args: Args): PayloadAction<Type, Payload>;
  match(action: AnyAction): action is PayloadAction<Type, Payload>;
}

export function action<
  T extends string,
  Args extends unknown[],
  P = undefined | null
>(
  innerType: T,
  payloadCreator: (...args: Args) => P
): InkJsActionCreator<ActionTypeString<T>, Args, P> {
  const outerType = actionType(innerType);
  const actionCreator = (...args: Args) => ({
    payload: payloadCreator(...args),
    type: outerType,
  });

  actionCreator.match = (
    action: AnyAction
  ): action is PayloadAction<ActionTypeString<T>, P> => {
    return action.type === outerType;
  };

  return actionCreator;
}

export type ActionType<
  ActionCreator extends InkJsActionCreator<string, any, any>
> = ActionFromMatcher<ActionCreator>;

/**
 * The code below is repurposed from the matchers logic in rtk:
 * https://github.com/reduxjs/redux-toolkit/blob/master/packages/toolkit/src/matchers.ts
 */

interface TypeGuard<T> {
  (value: any): value is T;
}

interface Matcher<T> {
  match: TypeGuard<T>;
}

type ActionFromMatcher<T> = T extends Matcher<infer TT>
  ? TT
  : T extends TypeGuard<infer TT>
  ? TT
  : never;

type ActionMatchingAnyOf<Matchers extends [Matcher<any>, ...Matcher<any>[]]> =
  ActionFromMatcher<Matchers[number]>;

export function actionIsAnyOf<
  Matchers extends [Matcher<any>, ...Matcher<any>[]]
>(...matchers: Matchers) {
  return (action: AnyAction): action is ActionMatchingAnyOf<Matchers> => {
    return matchers.some((matcher) => matcher.match(action));
  };
}
