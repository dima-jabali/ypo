"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { identity } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { Plan } from "#/types/chat";
import type { PatchProjectResponseAction } from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "./use-fetch-notebook";

export type GetBotPlanResponse = {
  updates: Array<PatchProjectResponseAction> | null;
  plan?: Plan | null;
  has_plan: boolean;
};

export function useFetchBotPlan<SelectedData = GetBotPlanResponse["plan"]>(
  select: (data: GetBotPlanResponse["plan"]) => SelectedData = identity<
    GetBotPlanResponse["plan"],
    SelectedData
  >,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId()!;

  const queryOptions = useMemo(
    () => queryKeyFactory.get["bot-plan"](botConversationId, organizationId, notebookId),
    [botConversationId, notebookId, organizationId],
  );

  return useSuspenseQuery({
    refetchOnWindowFocus: false,
    select,
    ...queryOptions,
  });
}
