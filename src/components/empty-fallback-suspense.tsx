"use client";

import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type PropsWithChildren, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

export function EmptyFallbackSuspense({ children }: PropsWithChildren) {
	  if (typeof window === "undefined") {
    return null;
  }

  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
  if (error) {
  console.error(error);
  }
  }, [error]);

  return (
    <Suspense fallback={null}>
      <QueryErrorResetBoundary>
        <ErrorBoundary fallback={null} onError={e => setError(e)}>{children}</ErrorBoundary>
      </QueryErrorResetBoundary>
    </Suspense>
  );
}
