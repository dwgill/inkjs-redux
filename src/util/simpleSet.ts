import { objHas } from "./objHas";

type SetValue = string | number;

export interface SimpleSet {
  readonly size: number;
  readonly entries: {
    readonly [key: SetValue]: true;
  };
}

const emptySet: SimpleSet = {
  size: 0,
  entries: {},
};

export const has = (set: SimpleSet | undefined | null, value: SetValue) => {
  return !!set && objHas(set.entries, value);
};

export const size = (set: SimpleSet | undefined | null) =>
  set == null ? 0 : set.size;

export function create(values?: SetValue[]): SimpleSet {
  if (values == null || values.length === 0) return emptySet;
  const entries: Record<SetValue, true> = {};
  let size = 0;
  for (const value of values) {
    if (!objHas(entries, value)) {
      size += 1;
      entries[value] = true;
    }
  }
  return {
    entries,
    size,
  };
}

export function add(
  set: SimpleSet | null | undefined,
  ...values: SetValue[]
): SimpleSet {
  set ??= emptySet;
  if (values.length === 0) {
    return set;
  }

  const entries: Record<SetValue, true> = { ...set.entries };
  let newSize = size(set);
  for (const value of values) {
    if (value == null) {
      continue;
    }
    if (!objHas(entries, value)) {
      newSize += 1;
      entries[value] = true;
    }
  }
  if (newSize === size(set)) {
    return set;
  }
  return {
    entries,
    size: newSize,
  };
}

export function remove(
  set: SimpleSet | null | undefined,
  ...values: SetValue[]
): SimpleSet {
  set ??= emptySet;
  if (values.length === 0 || size(set) === 0) {
    return set;
  }

  const entries: Record<SetValue, true> = { ...set.entries };
  let newSize = size(set);
  for (const value of values) {
    if (objHas(entries, value)) {
      newSize -= 1;
      delete entries[value];
    }
  }

  if (newSize === size(set)) {
    return set;
  }

  return {
    entries,
    size: newSize,
  };
}

export const union = (
  set1: SimpleSet | undefined | null,
  set2: SimpleSet | undefined | null
) => add(set1 ?? emptySet, ...values(set2 ?? emptySet));

export const difference = (
  set1: SimpleSet | undefined | null,
  set2: SimpleSet | undefined | null
) => remove(set1 ?? emptySet, ...values(set2 ?? emptySet));

export function insersection(
  set1: SimpleSet | undefined | null,
  set2: SimpleSet | undefined | null
): SimpleSet {
  set1 ??= emptySet;
  set2 ??= emptySet;
  let smaller: SimpleSet, larger: SimpleSet;
  if (size(set1) < size(set2)) {
    smaller = set1;
    larger = set2;
  } else {
    smaller = set2;
    larger = set1;
  }
  const entries: Record<SetValue, true> = {};
  let newSize = 0;
  for (const value of values(smaller)) {
    if (has(larger, value)) {
      entries[value] = true;
      newSize += 1;
    }
  }

  return {
    entries,
    size: newSize,
  };
}

export function overlaps(
  set1: SimpleSet | undefined | null,
  set2: SimpleSet | undefined | null
) {
  set1 ??= emptySet;
  set2 ??= emptySet;
  let smaller: SimpleSet, larger: SimpleSet;
  if (size(set1) < size(set2)) {
    smaller = set1;
    larger = set2;
  } else {
    smaller = set2;
    larger = set1;
  }
  for (const value of values(smaller)) {
    if (has(larger, value)) {
      return true;
    }
  }
  return false;
}

export const values = (set: SimpleSet | undefined | null): string[] =>
  set == null ? [] : Object.keys(set.entries);
