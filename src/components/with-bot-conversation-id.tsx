"use client";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import { useFetchNotebook } from "#/hooks/fetch/use-fetch-notebook";

const SELECT_NOTEBOOK_WITH_BOT_CONVERSATION = (
	<div className="flex items-center justify-center w-full h-full bg-notebook text-primary">
		Please select a notebook with a bot conversation.
	</div>
);

function TriggerSuspenseToHaveBotConversationIdFromDownloadedNotebook(
	props: React.PropsWithChildren<{ fallback?: React.ReactNode }>,
) {
			if (typeof window === "undefined") {
		return null;
	}
	
	const notebook = useFetchNotebook(); // This is the call that triggers Suspense

	const botConversationIdFromNotebook = notebook.metadata.bot_conversation?.id;
	const isValidBotConversationId = isValidNumber(botConversationIdFromNotebook);

	if (isValidBotConversationId) {
		generalContextStore.setState({
			botConversationId: botConversationIdFromNotebook,
			notebookId: notebook.metadata.id,
		});
	}

	return isValidBotConversationId
		? props.children
		: props.fallback !== undefined
			? props.fallback
			: SELECT_NOTEBOOK_WITH_BOT_CONVERSATION;
}


export function WithBotConversationId(
	props: React.PropsWithChildren<{ fallback: React.ReactNode }>,
) {
			if (typeof window === "undefined") {
		return null;
	}
	
	const notebookMetadataBotConversationId =
		generalContextStore.use.botConversationId();

	return isValidNumber(notebookMetadataBotConversationId) ? (
		props.children
	) : (
		<TriggerSuspenseToHaveBotConversationIdFromDownloadedNotebook {...props} />
	);
}

