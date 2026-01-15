/* eslint-disable no-debugger */

import { rankItem } from "@tanstack/match-sorter-utils";
import type { FilterFn } from "@tanstack/react-table";

import type {
	BatchTableCell,
	BatchTableCellUuid,
	BatchTableColumn,
	BatchTableColumnUuid,
	BatchTableRowUuid,
} from "#/types/batch-table";
import type {
	BotConversationMessage,
	BotConversationMessageUuid,
} from "#/types/chat";
import {
	ColorScheme,
	type Base64File,
	type ISODateString,
	type NotebookId,
	type UUID,
} from "#/types/general";
import type {
	GeneralFile,
	NotebookBlock,
	NotebookBlockUuid,
	NotebookUuid,
} from "#/types/notebook";
import type { RequestId } from "#/types/websocket";

export const OPTIMISTIC_NEW_NOTEBOOK_ID = Number.EPSILON as NotebookId;
export const SEE_CONSOLE = "See console for more details.";
export const TITLE_YOUR_BLOCK = "Title your block";

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	day: "numeric",
	month: "short",
});


export function isObjectEmpty(arg: unknown) {
	if (!isRecord(arg)) {
		console.log("isObjectEmpty() argument:", { arg });

		throw new Error("Argument must be an object");
	}

	for (const _ in arg) {
		return false;
	}

	return true;
}

export function convertArrayOfObjectsToCSV(
	arr: Record<string, string | number>[],
) {
	const array: (Record<string, string | number> | string[])[] = [
		Object.keys(arr[0] || {}),
	];

	array.push(...arr);

	return array
		.map((item) =>
			Object.values(item)
				.map((value) => `"${value}"`)
				.toString(),
		)
		.join("\n");
}

export const createNotebookUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as NotebookUuid;
export const createUUID = () => (globalThis.crypto?.randomUUID() || "") as UUID;
export const createRequestId = () =>
	(globalThis.crypto?.randomUUID() || "") as RequestId;
export const createNotebookBlockUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as NotebookBlockUuid;
export const createBotConversationMessageUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as BotConversationMessageUuid;
export const createBatchTableColumnUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as BatchTableColumnUuid;
export const createBatchTableRowUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as BatchTableRowUuid;
export const createBatchTableCellUuid = () =>
	(globalThis.crypto?.randomUUID() || "") as BatchTableCellUuid;
export const createISODate = () => new Date().toISOString() as ISODateString;

export function getRandomSnakeCaseName(): string {
	// Generate a random number between 10000 and 99999
	const randomNumber = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;

	return `dataframe_${randomNumber}`;
}

export const SLATE_DEFAULT_CHILDREN = [{ text: "" }];

export function noop() {}

export function log(...params: unknown[]) {
	if (isDev) {
		console.log(params.map(stringifyUnknown).join(" "));
	}
}

export function shouldNeverHappen(msg?: string, ...args: unknown[]): never {
	console.error(msg, ...args);

	if (isDev) {
		// biome-ignore lint/suspicious/noDebugger: ignore
		debugger;
	}

	throw new Error(`This should never happen: ${msg}`);
}

export function stringifyUnknown(value: unknown, jsonSpace = 2): string {
	if (value instanceof HTMLElement) {
		return value.outerHTML;
	}

	switch (typeof value) {
		case "function":
		case "boolean":
		case "symbol":
		case "bigint":
		case "number":
		case "string":
			return `${value.toString()}`;

		case "object": {
			if (value === null) return "";

			try {
				return JSON.stringify(value, null, jsonSpace);
			} catch (error) {
				console.log("Error stringifying object at `stringifyUnknown()`:", {
					error,
					value,
				});

				return "";
			}
		}

		case "undefined":
			return "";
	}
}

export const isDev = process.env.DEV;

export const isRecord = (obj: unknown): obj is Record<string, unknown> =>
	typeof obj === "object" && obj !== null;

export const isValidNumber = (value: unknown): value is number =>
	value === 0 ? true : Number.isFinite(value || undefined);

export function dbg(...params: unknown[]) {
	const shouldLog = isDev || window?.SHOULD_LOG;

	if (!shouldLog) return;

	const error = new Error();
	const stackLines = error.stack?.split("\n") || [];
	const callerInfo = stackLines[2]; // Adjust index if necessary
	const caller =
		callerInfo?.split("/").at(-1)?.replace(")", "") || "<unknown file>";

	console.groupCollapsed(
		`%c${caller}\n`,
		"background: #222; color: #bada55; font-weight: bold; padding: 2px 4px;",
		...params,
	);
	console.log(error);
	console.groupEnd();
}

export function getErrorMessage(error: unknown) {
	return isRecord(error) &&
		"message" in error &&
		typeof error.message === "string"
		? error.message
		: undefined;
}

export function handleDragStart(e: DragEvent) {
	e.preventDefault();

	if (!e.dataTransfer) return;

	e.dataTransfer.effectAllowed = "copy";
	e.dataTransfer.dropEffect = "copy";
}

const units = ["bytes", "kB", "MB", "GB", "TB", "PB"];
const MATH_LOG_1024 = Math.log(1024);
export function prettyBytes(bytes: number) {
	if (!isValidNumber(bytes)) return "-";

	const number = Math.floor(Math.log(bytes) / MATH_LOG_1024);

	return `${(bytes / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`;
}

export function stopPropagation(e: { stopPropagation: () => void }) {
	e.stopPropagation();
}

export function preventDefault(e: { preventDefault: () => void }) {
	e.preventDefault();
}

export const CHAT_MESSAGE_LIST_HTML_ELEMENT_ID = "chat-message-list";

export const messageDateFormatter = new Intl.DateTimeFormat(undefined, {
	minute: "numeric",
	hour: "numeric",
	year: "numeric",
	day: "numeric",
	month: "long",
});

export function getFirstValueOfMap<K, V>(map: Map<K, V>): V | undefined {
	const [firstPair] = map;

	if (!firstPair) return undefined;

	const [, value] = firstPair;

	return value;
}

export const isLeftMultipleOfRight = (left: number, right: number) =>
	left % right === 0;

export function isMacOS() {
	return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function functionThatReturnsTrue() {
	return true;
}

export const identity = <In, Out = In>(value: In) => value as unknown as Out;

export const longNumericDateFormatter = new Intl.DateTimeFormat(undefined, {
	second: "numeric",
	minute: "numeric",
	hour: "numeric",
	year: "numeric",
	day: "numeric",
	month: "long",
	hour12: false,
});

export function assertUnreachable(x: never): never {
	debugger;

	throw new Error("Didn't expect to get here", {
		cause: `"${x}" should be unreachable!`,
	});
}

export function filterUndefinedFromObject(
	obj: Record<string, unknown | undefined>,
): Record<string, unknown> {
	const filteredEntries = Object.entries(obj).filter(
		([, value]) => value !== undefined,
	);

	return Object.fromEntries(filteredEntries);
}

export const collator = new Intl.Collator(undefined, { sensitivity: "base" });

export const LOCAL_STORAGE_COLOR_SCHEME_KEY = "color-scheme";
export const DATASET_COLOR_SCHEME_NAME = "colorScheme";

export function getIsRunningInIframe() {
	return window.self !== window.top;
}

export function selectNothing() {
	return null;
}

export const fuzzyFilter: FilterFn<unknown> = (
	row,
	columnId,
	value,
	addMeta,
) => {
	// Rank the item
	const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	addMeta({ itemRank });

	// Return if the item should be filtered in/out
	return itemRank.passed;
};

export function getUserPreferedColorScheme() {
	if (!globalThis.window) {
		return ColorScheme.light;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? ColorScheme.dark
		: ColorScheme.light;
}

export function isNotebookBlock(
	block: NotebookBlock | BotConversationMessage,
): block is NotebookBlock {
	return "type" in block;
}

export const GET_AWS_FILE_AS_STRING_BINARY_ACTION =
	"GET_AWS_FILE_AS_STRING_BINARY_ACTION";
export const UPLOAD_FILE_STRING_TO_AWS_ACTION =
	"UPLOAD_FILE_STRING_TO_AWS_ACTION";
export const GET_AWS_BASE64_FILE_ACTION = "GET_AWS_BASE64_FILE_ACTION";
export const DELETE_AWS_FILE_ACTION = "DELETE_AWS_FILE_ACTION";
export const UPLOAD_FILE_TO_AWS = "UPLOAD_FILE_TO_AWS";
export const GET_PRESIGNED_URL = "GET_PRESIGNED_URL";

export function toNumber(value: unknown): number {
	if (typeof value === "number") return value;

	if (typeof value === "string") {
		if (value === "") return NaN;

		return Number(value);
	}

	return Number(value);
}

export const getIsBatchTableCellEmpty = (cell: BatchTableCell) =>
	!cell.value || (Array.isArray(cell.value) && cell.value.length === 0);

export function getMapFirstValue<K, V>(map: Map<K, V>): V | undefined {
	const [firstEntry] = map;

	if (!firstEntry) return undefined;

	const [, firstValue] = firstEntry;

	return firstValue;
}

export function fileToBase64(file: File) {
	return new Promise<Base64File>((resolve, reject) => {
		const reader = new FileReader();

		// Start reading the file as a Data URL
		reader.readAsDataURL(file);

		// Success handler
		reader.onload = () => {
			resolve(reader.result as Base64File);
		};

		// Error handler
		reader.onerror = (error) => {
			reject(error);
		};
	});
}

export function fileToTextString(file: File) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		// Read the file as a plain text string
		reader.readAsText(file);

		// Success handler
		reader.onload = () => {
			resolve(reader.result as string);
		};

		// Error handler
		reader.onerror = (error) => {
			reject(error);
		};
	});
}
