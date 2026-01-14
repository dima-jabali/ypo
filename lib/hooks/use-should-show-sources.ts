import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import {
	BotConversationMessageType,
	type ParallelConversationId,
} from "#/types/chat";

export function useShouldShowSources(
	parallelConversationId: ParallelConversationId | null,
) {
	const shouldShowSourcesBasedOnSettings =
		generalContextStore.use.showInternalSources();

	if (shouldShowSourcesBasedOnSettings) {
		return shouldShowSourcesBasedOnSettings;
	}

	// 1. Let's check if this message is a parallel msg:
	const isParallelMessage = isValidNumber(parallelConversationId);

	if (!isParallelMessage) {
		return false;
	}

	const { getBotConversationMessageListPages, botConversationId } =
		generalContextStore.getState();

	const chatMessagesSoFar = getBotConversationMessageListPages(
		botConversationId!,
	)?.pages;

	if (!chatMessagesSoFar) {
		return false;
	}

	// 2. Let's check if this message is inside an "External Search" parallel msgs.
	// Check for the presence of a "Relevant_Urls_Message" in the same parallel conversation:
	for (const page of chatMessagesSoFar) {
		for (const { parallel_conversation_id, message_type } of page.results) {
			if (
				parallel_conversation_id === parallelConversationId &&
				message_type === BotConversationMessageType.Relevant_Urls_Message
			) {
				return true;
			}
		}
	}

	return false;
}
