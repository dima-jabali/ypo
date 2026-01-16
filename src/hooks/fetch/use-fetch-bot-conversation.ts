"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { identity, isValidNumber, shouldNeverHappen } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BotConversation } from "#/types/notebook";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export type GetBotConversationByIdResponse = BotConversation;

export function useFetchBotConversation<SelectedData = BotConversation>(
  select: (data: BotConversation) => SelectedData = identity<BotConversation, SelectedData>,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const botConversationId = generalContextStore.use.botConversationId();

  if (!isValidNumber(botConversationId)) {
    shouldNeverHappen(
      "handleSendMessage must be used within a downloaded notebook so that botConversationId can be fetched.",
    );
  }

  console.log({ botConversationId });

  const queryOptions = useMemo(
    () => queryKeyFactory.get["bot-conversation"](botConversationId),
    [botConversationId],
  );

  return useSuspenseQuery({
    gcTime: Infinity, // Maintain on cache
    ...queryOptions,
    select,
  }).data;
}

const selectIsStreaming = (data: BotConversation) => data.is_streaming;
export function useIsStreaming() {
  if (typeof window === "undefined") {
    return null;
  }

  return useFetchBotConversation(selectIsStreaming);
}
