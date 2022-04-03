type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export function objEntries<O extends { [key: string]: any }>(
  obj: O
): Entries<O> {
  if (obj == null) return [];
  // @ts-ignore
  if (typeof Object.entries === "function") {
    // @ts-ignore
    return Object.entries(obj);
  }

  const ownProps = Object.keys(obj);
  let i = ownProps.length;
  const resArray = new Array(i);
  while (i--) {
    resArray[i] = [ownProps[i], obj[ownProps[i]]];
  }

  return resArray;
}

export function objFromEntries<S extends string | number, T>(
  entries: [S, T][]
): { [key in S]: T } {
  const obj: Record<any, any> = {};
  for (const [key, val] of entries) {
    obj[key] = val;
  }
  return obj as any;
}
