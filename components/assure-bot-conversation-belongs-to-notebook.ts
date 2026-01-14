import { memo } from "react";

import { isValidNumber } from "#/helpers/utils";
import { useDownloadedNotebookBotConversationId } from "#/hooks/fetch/use-fetch-notebook";
import { useFetchNotebookListPage } from "#/hooks/fetch/use-fetch-notebook-list-page";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export const AssureBotConversationBelongsToNotebook = memo(
	function AssureBotConversationBelongsToNotebook({
		children,
	}: React.PropsWithChildren) {
		const botConversationFromDownloadedNotebook =
			useDownloadedNotebookBotConversationId();
		const botConversationIdFromGeneralStore =
			generalContextStore.use.botConversationId();
		const notebookList = useFetchNotebookListPage();

		if (
			!isValidNumber(botConversationIdFromGeneralStore) ||
			!isValidNumber(botConversationFromDownloadedNotebook)
		) {
			console.log("Notebook or current bot conversation is not defined.", {
				botConversationFromDownloadedNotebook,
				botConversationIdFromGeneralStore,
			});

			return null;
		}

		if (
			botConversationFromDownloadedNotebook !==
			botConversationIdFromGeneralStore
		) {
			let msg = "Bot conversation does not belong to the current notebook.";

			const notebookBotConversationBelongsTo = notebookList.data.pages
				.flatMap((page) => page.results)
				.find(
					(notebook) =>
						notebook.bot_conversation?.id ===
						botConversationFromDownloadedNotebook,
				);

			if (notebookBotConversationBelongsTo) {
				msg += `\nThis bot conversation belongs to notebook "${notebookBotConversationBelongsTo.title} (${notebookBotConversationBelongsTo.id})", to which you have access to.\nChange notebook in the top right corner to access it.`;
			}

			console.log({
				botConversationFromDownloadedNotebook,
				botConversationIdFromGeneralStore,
			});

			throw new Error(msg);
		}

		return children;
	},
);
