"use client";

import {
  QueryClientProvider,
  HydrationBoundary,
  type InvalidateQueryFilters,
  dehydrate,
} from "@tanstack/react-query";
import { useState } from "react";

import { setMutationDefaults } from "#/features/set-mutation-defaults";
import { queryClient } from "./query-client";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidateQuery?:
        | InvalidateQueryFilters<readonly unknown[]>
        | Array<InvalidateQueryFilters<readonly unknown[]>>;
      cancelQuery?: InvalidateQueryFilters<readonly unknown[]>;
      successMessage?: string;
      successTitle?: string;
      errorMessage?: string;
      errorTitle?: string;
      skipToast?: boolean;
    };
  }
}

export function MakeQueryClientProvider({ children }: React.PropsWithChildren) {
  useState(() => {
    setMutationDefaults(queryClient);
  });

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
