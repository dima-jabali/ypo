import type { Tagged } from "type-fest";

export type BotConversationId = Tagged<number, "BotConversationId">;
export type OrganizationId = Tagged<number, "OrganizationId">;
export type ISODateString = Tagged<string, "ISODateString">;
export type BatchTableId = Tagged<number, "BatchTableId">;
export type NotebookId = Tagged<number, "NotebookIdId">;
export type StreamUuid = Tagged<number, "StreamUuid">;
export type FileId = Tagged<number, "FileId">;
export type Email = Tagged<string, "Email">;
export type UUID = Tagged<string, "UUID">;

export type Nullable<T> = { [P in keyof T]: T[P] | null };

export type Base64Image = `data:image/${string};base64,${string}`;
export type Base64File = `data:${string};base64,${string}`;

export const ColorScheme = Object.freeze({
  light: "light",
  dark: "dark",
} as const);

export type Mutable<T> =
  T extends ReadonlySet<T>
    ? Set<T>
    : T extends ReadonlyMap<infer K, infer V>
      ? Map<K, V>
      : { -readonly [P in keyof T]: T[P] };
