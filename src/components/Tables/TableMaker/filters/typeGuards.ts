import type { SerializedFilterGroup } from "./utilityTypes";

export const isSerializedFilterGroup = (
  obj: Record<string, unknown>,
): obj is SerializedFilterGroup =>
  Boolean((obj as SerializedFilterGroup).filterOperator && (obj as SerializedFilterGroup).children);

export const isUndefined = (value: unknown): value is undefined => value === undefined;
