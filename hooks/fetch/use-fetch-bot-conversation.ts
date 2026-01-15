"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { identity, isValidNumber } from "#/helpers/utils"
import { queryKeyFactory } from "#/hooks/query-keys"
import type { BotConversation } from "#/types/notebook"

export type GetBotConversationByIdResponse = BotConversation

export function useFetchBotConversation<SelectedData = BotConversation>(
  botConversationId: number | null,
  select: (data: BotConversation) => SelectedData = identity<BotConversation, SelectedData>,
) {
  const safeId = isValidNumber(botConversationId) ? botConversationId : -1

  const queryOptions = useMemo(() => queryKeyFactory.get["bot-conversation"](safeId), [safeId])

  const result = useSuspenseQuery({
    gcTime: Number.POSITIVE_INFINITY, // Maintain on cache
    enabled: isValidNumber(botConversationId),
    ...queryOptions,
    select,
  })

  if (!isValidNumber(botConversationId)) {
    return { is_streaming: false } as SelectedData
  }

  return result.data
}

const selectIsStreaming = (data: BotConversation) => data.is_streaming
export function useIsStreaming(botConversationId: number | null) {
  return useFetchBotConversation(botConversationId, selectIsStreaming)
}
