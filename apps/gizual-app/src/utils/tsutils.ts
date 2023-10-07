import { RefObject } from "react";

export type DefinedRefObject<T> = RefObject<T> & {
  current: T;
};

// Asserts that the provided forwardedRef is valid.
export function isRef<T>(ref: React.ForwardedRef<T>): ref is DefinedRefObject<T> {
  return ref !== null && typeof ref !== "function";
}

export function isObject(o: unknown): o is Record<string, unknown> {
  return typeof o === "object";
}

export function isPromise<T>(p: unknown): p is Promise<T> {
  return isObject(p) && typeof p.then === "function";
}
