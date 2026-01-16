import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import { identity, selectNothing } from "#/helpers/utils";
import type { Email } from "#/types/general";
import type { BetterbrainUserId } from "#/types/notebook";

export type ChatUsageData = {
  num_messages_last_30_days: number;
  num_projects_last_30_days: number;
  num_projects_created: number;
  user_id: BetterbrainUserId;
  num_messages_sent: number;
  user_name: string;
  email: Email;
};

export type ChatUsageDataResponse = {
  results: Array<ChatUsageData>;
};

export function useFetchChatUsageData<SelectedData = ChatUsageDataResponse["results"]>(
  select: (data: ChatUsageDataResponse["results"]) => SelectedData = identity<
    ChatUsageDataResponse["results"],
    SelectedData
  >,
) {
  const organizationId = generalContextStore.use.organizationId();

  const queryOptions = useMemo(
    () => queryKeyFactory.get["chat-usage-data"](organizationId),
    [organizationId],
  );

  return useSuspenseQuery({
    staleTime: Infinity, // Maintain on cache
    gcTime: Infinity, // Maintain on cache
    ...queryOptions,
    select,
  }).data;
}

export function useJustFetchChatUsageData() {
  return useFetchChatUsageData(selectNothing);
}

function selectStats(results: ChatUsageDataResponse["results"]) {
  const data = {
    totalProjectsLast_30Days: 0,
    totalMessagesLast_30Days: 0,
    userCount: results.length,
    totalProjectsCreated: 0,
    totalMessagesSent: 0,
  };

  for (const userData of results) {
    data.totalMessagesLast_30Days += userData.num_messages_last_30_days;
    data.totalProjectsLast_30Days += userData.num_projects_last_30_days;
    data.totalProjectsCreated += userData.num_projects_created;
    data.totalMessagesSent += userData.num_messages_sent;
  }

  return data;
}
export function useUsageStats() {
  return useFetchChatUsageData(selectStats);
}
