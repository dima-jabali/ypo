"use client";

import { useIsMutating } from "@tanstack/react-query";

import { queryKeyFactory } from "#/hooks/query-keys";

export function useIsCreatingNotebook() {
  return (
    useIsMutating({
      mutationKey: queryKeyFactory.post["notebook"].queryKey,
    }) > 0
  );
}
