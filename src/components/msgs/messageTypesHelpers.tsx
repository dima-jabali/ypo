import { ClipboardIcon } from "lucide-react";
import { titleCase } from "scule";

import { type BotConversationMessage } from "#/types/chat";
import { TIMEOUT_TO_CHANGE_COPY_ICON } from "./common";

export async function handleCopyTextToClipboard(
	text: string,
	setWasCopiedSuccessfully: React.Dispatch<
		React.SetStateAction<boolean | undefined>
	>,
) {
	try {
		await navigator.clipboard.writeText(text);

		setWasCopiedSuccessfully(true);

		setTimeout(() => {
			setWasCopiedSuccessfully(undefined);
		}, TIMEOUT_TO_CHANGE_COPY_ICON);
	} catch (error) {
		console.error("Failed to copy message:", error);

		setWasCopiedSuccessfully(false);

		setTimeout(() => {
			setWasCopiedSuccessfully(undefined);
		}, TIMEOUT_TO_CHANGE_COPY_ICON);
	}
}

const IGNORE_LIST_ITEM = [
	"execution_results_preview",
	"is_task_complete",
	"reflection",
	"reasoning",
	"response",
	"name",
];

export function makeExtraInfoListItem(
	key: string,
	value: unknown,
): React.ReactNode {
	if (IGNORE_LIST_ITEM.includes(key)) return null;

	switch (typeof value) {
		case "boolean":
		case "string":
		case "number": {
			if (value === "") return null;

			return (
				<p key={Math.random()}>
					<span className="font-bold">{titleCase(key)}</span> {`${value}`}
				</p>
			);
		}

		case "object": {
			if (!value) return null;

			if (Array.isArray(value)) {
				return value.map((v) => makeExtraInfoListItem(key, v));
			} else {
				return Object.entries(value).map(([k, v]) =>
					makeExtraInfoListItem(k, v),
				);
			}
		}

		default:
			console.log("Unhandled type", { key, value });
			return null;
	}
}

export function getJsonInfoOfToolResponseJson(
	message: BotConversationMessage,
): React.ReactNode {
	if (!message.json || typeof message.json !== "object") {
		return null;
	}

	const jsxs = Object.entries(message.json).map(([k, v]) =>
		makeExtraInfoListItem(k, v),
	);

	return <div className="flex flex-col gap-2">{jsxs}</div>;
}

export const CLIPBOARD_ICON = <ClipboardIcon className="size-4" />;
