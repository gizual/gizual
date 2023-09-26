import { RefObject } from "react";

export type DefinedRefObject<T> = RefObject<T> & {
  current: T;
};

// Asserts that the provided forwardedRef is valid.
export function isRef<T>(ref: React.ForwardedRef<T>): ref is DefinedRefObject<T> {
  return ref !== null && typeof ref !== "function";
}
