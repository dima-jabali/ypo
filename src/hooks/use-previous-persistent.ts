import { useRef } from "react";

export function usePreviousPersistent<T>(value: T, isEqualFunc?: (a: T, b: T) => boolean) {
  // initialise the ref with previous and current values
  const ref = useRef({
    prev: null as T | null,
    value: value,
  });

  const current = ref.current.value;

  // if the value passed into hook doesn't match what we store as "current"
  // move the "current" to the "previous"
  // and store the passed value as "current"
  if (isEqualFunc ? !isEqualFunc(value, current) : value !== current) {
    ref.current = {
      prev: current,
      value: value,
    };
  }

  // return the previous value only
  return ref.current.prev;
}
