"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeyFactory } from "#/hooks/query-keys";
import type { NotebookTag } from "#/types/notebook";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export type FetchTagsResponse = { results: Array<NotebookTag> };

export function useFetchOrganizationTags() {
  if (typeof window === "undefined") {
    return null;
  }

  const organizationId = generalContextStore.use.organizationId();

  const queryOptions = useMemo(
    () => queryKeyFactory.get["organization-tag-list"](organizationId),
    [organizationId],
  );

  return useQuery({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...queryOptions,
  });
}
