export type Validator<T> = (obj: unknown) => obj is T;

export const isString: Validator<string> = (obj: unknown): obj is string => typeof obj === "string";
export const isNumber: Validator<number> = (obj: unknown): obj is number => typeof obj === "number";
export const isBoolean: Validator<boolean> = (obj: unknown): obj is boolean => typeof obj === "boolean";
export const isObject: Validator<object> = (obj: unknown): obj is object => typeof obj === "object";
