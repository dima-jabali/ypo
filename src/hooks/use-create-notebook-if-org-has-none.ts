"use client";

import { useQuery } from "@tanstack/react-query";

import { createNotebookUuid } from "#/helpers/utils";
import { NotebookImportance, NotebookStatus } from "#/types/notebook";
import { useHasNotebooksInList } from "./fetch/use-fetch-notebook-list-page";
import { useCreateNotebook } from "./mutation/use-create-notebook";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type HasCreatedNotebook = boolean;

export function useCreateNotebookIfOrgHasNone() {
  if (typeof window === "undefined") {
    return null;
  }

  const organizationId = generalContextStore.use.organizationId();
  const hasNotebooksInList = useHasNotebooksInList();
  const createNotebook = useCreateNotebook();

  return useQuery({
    queryKey: ["create-notebook-if-org-has-none", organizationId],
    enabled: !hasNotebooksInList,
    refetchOnMount: true,
    throwOnError: false,
    staleTime: 0, // Important
    retry: true,
    gcTime: 0, // Important
    queryFn: async (): Promise<HasCreatedNotebook> => {
      await createNotebook.mutateAsync({
        metadata: {
          status: NotebookStatus.NotStarted,
          priority: NotebookImportance.Low,
          uuid: createNotebookUuid(),
          title: "New Chat",
          favorited: false,
          assigned_to: [],
          description: "",
          tags: [],
        },
        organizationId,
        blocks: [],
      });

      return true;
    },
  });
}
