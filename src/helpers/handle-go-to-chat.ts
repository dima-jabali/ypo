import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { queryClient } from "#/contexts/query-client";
import { isValidNumber, noop, OPTIMISTIC_NEW_NOTEBOOK_ID } from "#/helpers/utils";
import type { BotConversationId, NotebookId, OrganizationId } from "#/types/general";
import type { GetBotConversationMessagesPageRequest } from "../hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { queryKeyFactory } from "../hooks/query-keys";

export function handleGoToChat(
  notebookId: NotebookId,
  botConversationId: BotConversationId | null,
) {
  const { notebookId: notebookIdFromStore } = generalContextStore.getState();

  if (notebookId === notebookIdFromStore) {
    return;
  }

  generalContextStore.setState({
    botConversationId,
    notebookId,
  });
}

export function handlePrefetchChat(
  notebookId: NotebookId,
  botConversationId: BotConversationId | null,
  organizationId: OrganizationId,
) {
  const isOptimisticNewNotebook = notebookId === OPTIMISTIC_NEW_NOTEBOOK_ID;

  if (!isOptimisticNewNotebook) {
    queryClient.prefetchQuery(queryKeyFactory.get["notebook-by-id"](notebookId)).catch(noop);

    queryClient
      .prefetchQuery(queryKeyFactory.get["settings"](organizationId, notebookId))
      .catch(noop);

    if (isValidNumber(botConversationId)) {
      queryClient
        .prefetchQuery(
          queryKeyFactory.get["bot-plan"](botConversationId, organizationId, notebookId),
        )
        .catch(noop);

      queryClient
        .prefetchQuery(queryKeyFactory.get["bot-conversation"](botConversationId))
        .catch(noop);

      const initialPageParam: GetBotConversationMessagesPageRequest = {
        visible_to_user: "true",
        botConversationId,
        limit: 100,
        offset: 0,
      };

      queryClient
        .prefetchInfiniteQuery({
          ...queryKeyFactory.get["bot-conversation-message-list-page"](botConversationId),
          initialPageParam,
        })
        .catch(noop);
    }
  }
}
