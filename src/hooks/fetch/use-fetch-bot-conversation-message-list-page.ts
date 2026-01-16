"use client";

import { useSuspenseInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
  getReferencedSources,
  URL_TEXT_SEARCH,
  WEBSITE_PREFIX,
} from "#/components/Markdown/pre-processors";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { SourceID } from "#/contexts/source-citation-context";
import {
  getSourceMainValues,
  type SourceMainValues,
} from "#/features/sources-for-user/get-source-main-values";
import {
  normalizeSources,
  type NormalizedSource,
} from "#/features/sources-for-user/get-top-n-sources";
import { identity, isDev, isValidNumber, shouldNeverHappen } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type {
  BotConversationMessage,
  ParallelConversationId,
  SourceForUserType,
} from "#/types/chat";
import type { BotConversationId } from "#/types/general";
import { useFetchBotConversation } from "./use-fetch-bot-conversation";

export type GetBotConversationMessagesPageRequest = {
  /** If not present, will be as 'true'. */
  botConversationId: BotConversationId;
  visible_to_user?: "true" | "false";
  offset: number;
  limit: number;
};

export type GetBotConversationMessagesPageResponse = {
  results: Array<BotConversationMessage>;
  num_results: number;
  offset: number;
  limit: number;
};

export type SelectedBotConversationMessageListPage<
  SelectedData = BotConversationMessageListPageInfiniteResponse,
> = (data: BotConversationMessageListPageInfiniteResponse) => SelectedData;

export function useFetchBotConversationMessageListPage<
  SelectedData = BotConversationMessageListPageInfiniteResponse,
>(
  select: SelectedBotConversationMessageListPage<SelectedData> = identity<
    BotConversationMessageListPageInfiniteResponse,
    SelectedData
  >,
) {
  if (typeof window === "undefined") {
    return null;
  }

  useFetchBotConversation();

  const botConversationId = generalContextStore.use.botConversationId();

  if (!isValidNumber(botConversationId)) {
    shouldNeverHappen("notebookMetadataBotConversationId not defined!");
  }

  const { queryOptions, initialPageParam } = useMemo(() => {
    const initialPageParam: GetBotConversationMessagesPageRequest = {
      visible_to_user: "true",
      botConversationId,
      limit: 100,
      offset: 0,
    };

    const queryOptions =
      queryKeyFactory.get["bot-conversation-message-list-page"](botConversationId);

    return { queryOptions, initialPageParam };
  }, [botConversationId]);

  return useSuspenseInfiniteQuery({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: Infinity, // Maintain on cache
    initialPageParam,
    ...queryOptions,
    select,
    getNextPageParam: (lastPage, _allPages, lastPageParams) => {
      const nextOffset = lastPageParams.offset + lastPageParams.limit;

      if (lastPage && nextOffset > lastPage.num_results) return;

      return { ...lastPageParams, offset: nextOffset };
    },
    getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
      const prevOffset = firstPageParams.offset - firstPageParams.limit;

      if (prevOffset < 0) return;

      return { ...firstPageParams, offset: prevOffset };
    },
  });
}

export function selectHasAnyBotConversationMessage(
  data: BotConversationMessageListPageInfiniteResponse,
) {
  const results = data.pages[0]?.results;

  if (!results) {
    return false;
  }

  const { length } = results;

  if (length === 0) {
    return false;
  }
  // 	if (length === 1) {
  // 		if (results[0]?.block?.uuid) {
  // 			// Chances are that this single block is the notebook block
  // 			// that is created when a notebook is created. We ignore these.
  //
  // 			return false;
  // 		}
  // 	}

  return true;
}

export function useHasAnyMessage() {
  if (typeof window === "undefined") {
    return null;
  }

  return useFetchBotConversationMessageListPage(selectHasAnyBotConversationMessage).data;
}

export type BotConversationMessageListPageInfiniteResponse = InfiniteData<
  GetBotConversationMessagesPageResponse,
  GetBotConversationMessagesPageRequest
>;

export type NormalizedBotConversationMessage = {
  parallelMessages: Map<ParallelConversationId, Array<BotConversationMessage>> | null;
  message: BotConversationMessage | null;
  toggleHideParallelAnswers: boolean;
  withNotebookBlocks: boolean;
};

export function selectNormalizedMessages(
  data: BotConversationMessageListPageInfiniteResponse,
  withNotebookBlocks: boolean,
  toggleHideParallelAnswers: boolean,
) {
  const normalized: Array<NormalizedBotConversationMessage> = [];
  const flatArray = data.pages.flatMap((page) => page.results);
  const { length } = flatArray;

  let lastNormalizedParallelMessages: NormalizedBotConversationMessage | null = null;

  for (let index = 0; index < length; ++index) {
    const msg = flatArray[index]!;

    const parallelConversationId = msg.parallel_conversation_id;

    if (isValidNumber(parallelConversationId)) {
      if (lastNormalizedParallelMessages) {
        const arr = lastNormalizedParallelMessages.parallelMessages!.get(parallelConversationId);

        if (arr) {
          arr.push(msg);
        } else {
          if (lastNormalizedParallelMessages.parallelMessages!.size === 2) {
            lastNormalizedParallelMessages = {
              parallelMessages: new Map(),
              toggleHideParallelAnswers,
              withNotebookBlocks,
              message: null,
            };

            lastNormalizedParallelMessages.parallelMessages!.set(parallelConversationId, [msg]);

            normalized.push(lastNormalizedParallelMessages);
          } else {
            lastNormalizedParallelMessages.parallelMessages!.set(parallelConversationId, [msg]);
          }
        }
      } else {
        lastNormalizedParallelMessages = {
          parallelMessages: new Map(),
          toggleHideParallelAnswers,
          withNotebookBlocks,
          message: null,
        };

        lastNormalizedParallelMessages.parallelMessages!.set(parallelConversationId, [msg]);

        normalized.push(lastNormalizedParallelMessages);
      }
    } else {
      normalized.push({
        toggleHideParallelAnswers,
        parallelMessages: null,
        withNotebookBlocks,
        message: msg,
      });
    }
  }

  return normalized;
}

export function useNormalizedMessages(withNotebookBlocks: boolean) {
  if (typeof window === "undefined") {
    return null;
  }

  const toggleHideParallelAnswers = generalContextStore.use.toggleHideParallelAnswers();

  const msgs = useFetchBotConversationMessageListPage(
    useCallback(
      (data: BotConversationMessageListPageInfiniteResponse) =>
        selectNormalizedMessages(data, withNotebookBlocks, toggleHideParallelAnswers),
      [withNotebookBlocks, toggleHideParallelAnswers],
    ),
  ).data;

  return msgs;
}

function selectAllChatSourcesMainValues(
  data: BotConversationMessageListPageInfiniteResponse,
  onlyShowUsedReferences: boolean,
) {
  if (data.pages.length === 0 || data.pages[0]?.results.length === 0) {
    return [];
  }

  const start = performance.now();

  const map = new Map<
    SourceID,
    SourceMainValues<SourceForUserType, NormalizedSource["values_type"]>
  >();
  const referencedSources: Set<SourceID> = new Set();

  if (onlyShowUsedReferences) {
    for (const page of data.pages) {
      for (const msg of page.results) {
        if (msg.text) {
          const sourcesReferencedInThisMsg = getReferencedSources(msg.text);

          for (const ref of sourcesReferencedInThisMsg) {
            referencedSources.add(ref);
          }
        }

        if (msg.sources && msg.sources.length > 0) {
          const normalizedSources = normalizeSources(msg.sources);

          for (const source of normalizedSources) {
            const mainValues = getSourceMainValues(source);

            if (
              referencedSources.has(mainValues.id) ||
              referencedSources.has(
                mainValues.id.replace(WEBSITE_PREFIX, "").replace(URL_TEXT_SEARCH, "") as SourceID,
              )
            ) {
              map.set(mainValues.id, mainValues);
            }
          }
        }
      }
    }
  } else {
    for (const page of data.pages) {
      for (const msg of page.results) {
        if (msg.sources && msg.sources.length > 0) {
          const normalizedSources = normalizeSources(msg.sources);

          for (const source of normalizedSources) {
            const mainValues = getSourceMainValues(source);

            map.set(mainValues.id, mainValues);
          }
        }
      }
    }
  }

  const arr = Array.from(map.values());

  if (isDev) {
    const took = performance.now() - start;

    console.log({
      took,
      sourcesMainValues: arr,
      onlyShowUsedReferences,
      referencedSources,
      data,
    });
  }

  return arr;
}
export function useAllChatSourcesMainValues() {
  if (typeof window === "undefined") {
    return null;
  }

  const onlyShowUsedReferences = generalContextStore.use.onlyShowUsedReferences();

  const select = useCallback(
    (data: BotConversationMessageListPageInfiniteResponse) => {
      return selectAllChatSourcesMainValues(data, onlyShowUsedReferences);
    },
    [onlyShowUsedReferences],
  );

  return useFetchBotConversationMessageListPage(select).data;
}
