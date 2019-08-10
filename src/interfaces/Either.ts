export type Left = { tag: "left"; error: Error };
export type Right<T> = { tag: "right"; result: T };
export type Either<T> = Left | Right<T>;
