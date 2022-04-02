import { Dispatch } from "redux";
import { Selectors } from "../selectors";

export type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

export type DistributivePick<T, K extends keyof T> = T extends unknown
  ? Pick<T, K>
  : never;

export type PickPartial<T, K extends keyof T> = Partial<Pick<T, K>>;

export type DistributivePickPartial<T, K extends keyof T> = T extends unknown
  ? PickPartial<T, K>
  : never;

export type SomePartial<T, K extends keyof T> = Omit<T, K> & PickPartial<T, K>;

export type DistributiveSomePartial<T, K extends keyof T> = T extends unknown
  ? SomePartial<T, K>
  : never;

export type SomeOmitSomePartial<
  T,
  Rem extends keyof T,
  Part extends keyof T
> = Omit<T, Rem | Part> & PickPartial<T, Part>;

export type DistributiveSomeOmitSomePartial<
  T,
  Rem extends keyof T,
  Part extends keyof T
> = T extends unknown ? SomeOmitSomePartial<T, Rem, Part> : never;

export interface ExternalStoryFunc<S = unknown, D = Dispatch<any>> {
  (meta: { getState(): S; dispatch: D }, ...args: any[]): any;
}

export interface StoryConfig<S = unknown, D = Dispatch<any>> {
  version: 1;
  trackedVariables?: {
    bool?: string[];
    int?: string[];
    float?: string[];
    string?: string[];
  };
  lineGrouping?: {
    groupTags: string[];
    grouplessTags: string[];
  };
  defaultContinueMaximally?: boolean;
  defaultContinueAfterChoice?: boolean;
  externalFunctions?: {
    [functionName: string]: ExternalStoryFunc<S, D>;
  };
  lookaheadSafeExternalFunctions?: {
    [functionName: string]: ExternalStoryFunc<S, D>;
  };
}
