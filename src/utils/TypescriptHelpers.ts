export function hasKey<T>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && (value.length === 0 || value.every(item => typeof item === "string"));
}
