import { objEntries, objFromEntries } from "./objEntries";
import { objHas } from "./objHas";

type Key = string | number;

export interface SimpleMap<V> {
  readonly size: number;
  readonly entries: {
    readonly [key: Key]: V;
  };
}

const emptyMap: SimpleMap<never> = {
  size: 0,
  entries: {},
};

export const has = <V>(map: SimpleMap<V> | undefined | null, key: Key) => {
  return !!map && objHas(map.entries, key);
};

export const size = <V>(map: SimpleMap<V> | undefined | null) =>
  map == null ? 0 : map.size;

export function create<V>(entries?: [Key, V][]): SimpleMap<V> {
  if (entries == null || entries.length === 0) return emptyMap;

  const mapEntries = objFromEntries(entries);
  return {
    entries: mapEntries,
    size: Object.keys(mapEntries).length,
  };
}

export function set<V>(
  map: SimpleMap<V> | null | undefined,
  key: Key,
  value: V
): SimpleMap<V> {
  map ??= emptyMap;
  const alreadyHad = has(map, key);
  if (value === undefined) {
    if (!alreadyHad) return map;
    const newEntries = { ...map.entries };
    delete newEntries[key];
    return {
      entries: newEntries,
      size: size(map) - 1,
    };
  } else {
    if (alreadyHad && map.entries[key] === value) {
      return map;
    }
    return {
      entries: {
        ...map.entries,
        [key]: value,
      },
      size: size(map) + (alreadyHad ? 0 : 1),
    };
  }
}

export function get<V>(
  map: SimpleMap<V> | null | undefined,
  key: Key
): V | undefined {
  map ??= emptyMap;
  // The user might try & get(map, 'toString') after all
  if (!has(map, key)) return undefined;
  return map.entries[key];
}

export function setMany<V>(
  map: SimpleMap<V> | null | undefined,
  entries: [key: Key, value: V][]
): SimpleMap<V> {
  map ??= emptyMap;
  const newEntries = { ...map.entries };
  let newSize = size(map);
  let actuallyChanged = false;
  for (const [key, value] of entries) {
    if (value === undefined) {
      if (objHas(newEntries, key)) {
        newSize -= 1;
        delete newEntries[key];
        actuallyChanged = true;
      }
    } else {
      if (!objHas(newEntries, key)) {
        newSize += 1;
        newEntries[key] = value;
        actuallyChanged = true;
      } else if (objHas(newEntries, key) && newEntries[key] !== value) {
        newEntries[key] = value;
        actuallyChanged = true;
      }
    }
  }

  if (!actuallyChanged) {
    return map;
  }
  return {
    entries: newEntries,
    size: newSize,
  };
}

export function remove<V>(
  map: SimpleMap<V> | null | undefined,
  ...keys: Key[]
): SimpleMap<V> {
  map ??= emptyMap;
  if (keys.length === 0 || size(map) === 0) {
    return emptyMap;
  }

  const newEntries: Record<Key, V> = { ...map.entries };
  let newSize = size(map);
  for (const key of keys) {
    if (objHas(newEntries, key)) {
      newSize -= 1;
      delete newEntries[key];
    }
  }
  if (newSize === 0) return emptyMap;
  if (newSize === size(map)) return map;
  return {
    entries: newEntries,
    size: newSize,
  };
}

export function replace<V>(
  simplSet: SimpleMap<V> | undefined | null,
  key: Key,
  callback: (val: V | undefined) => V | undefined
) {
  simplSet ??= emptyMap;
  const prevVal = get(simplSet, key);
  const newVal = callback(prevVal);
  if (newVal === undefined) {
    return remove(simplSet, key);
  }
  return set(simplSet, key, newVal);
}

export function entries<V>(set: SimpleMap<V> | undefined | null): [Key, V][] {
  return set == null ? [] : objEntries(set.entries);
}
