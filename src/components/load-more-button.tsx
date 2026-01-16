import { memo } from "react";

import { useFetchBotConversationMessageListPage } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { LOADER } from "./Button";

export const LoadMoreButton = memo(function LoadMoreButton() {
  const botConversationMessageListPageInfiniteQuery = useFetchBotConversationMessageListPage();

  if (!botConversationMessageListPageInfiniteQuery.hasNextPage) {
    return null;
  }

  async function handleLoadMore() {
    await botConversationMessageListPageInfiniteQuery.fetchNextPage();
  }

  return (
    <li className="flex chat-content items-center justify-center w-full p-2 h-10">
      <button
        className="disabled:opacity-50 p-2 text-xs not-disabled:link not-disabled:hover:underline flex gap-2 items-center"
        disabled={botConversationMessageListPageInfiniteQuery.isFetchingNextPage}
        onClick={handleLoadMore}
        type="button"
      >
        {botConversationMessageListPageInfiniteQuery.isFetchingNextPage ? (
          <>
            {LOADER}

            <span>Loading more...</span>
          </>
        ) : (
          "Load more"
        )}
      </button>
    </li>
  );
});
