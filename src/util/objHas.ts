export function objHas(obj: object, key: number | string | symbol): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function objHasTypeSafe<K extends number | string | symbol>(
  obj: object,
  key: K
): obj is { [k in K]: unknown } {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
