"use client";
import { MutationCache, onlineManager, QueryClient } from "@tanstack/react-query";

import { log, noop } from "#/helpers/utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";

onlineManager.setEventListener((setOnline) => {
  // Check if the browser environment supports the online/offline events
  if (typeof window === "undefined") {
    return noop; // Return a no-op cleanup function on the server
  }

  function handleOnline() {
    // Add a slight delay
    // to let the OS/browser fully establish the network connection
    // before allowing the refetch.
    setTimeout(() => {
      setOnline(true);
    }, 2_000);
  }

  function handleOffline() {
    setOnline(false);
  }

  // Use the event listener setup for standard browser events
  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  // Note: The visibilitychange logic is handled internally by default
  // unless you override the focusManager as well.

  return () => {
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("online", handleOnline);
  };
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
      staleTime: 60_000,
      gcTime: 120_000,
      retry: false,
      throwOnError(error, query) {
        log("Query error:", {
          msg: error.message,
          queryKeys: query.queryKey,
          query,
          error,
        });

        return true;
      },
    },

    mutations: {
      retry: false,
    },
  },

  mutationCache: new MutationCache({
    onSuccess(_data, _variables, _context, mutation) {
      const { successMessage, successTitle, skipToast } = mutation.meta ?? {};

      if (!skipToast && successMessage) {
        toast({
          variant: ToastVariant.Success,
          description: successMessage,
          title: successTitle,
        });
      }
    },

    async onMutate(_variables, mutation) {
      const { cancelQuery } = mutation.meta ?? {};

      if (cancelQuery) {
        await queryClient.cancelQueries(cancelQuery);
      }
    },

    onError(error, _variables, _context, mutation) {
      const { errorMessage, errorTitle, skipToast } = mutation.meta ?? {};

      if (!skipToast) {
        toast({
          description: errorMessage ?? error.message,
          variant: ToastVariant.Destructive,
          title: errorTitle,
        });
      }
    },

    async onSettled(_data, _error, _variables, _context, mutation) {
      if (mutation.meta?.invalidateQuery) {
        if (Array.isArray(mutation.meta.invalidateQuery)) {
          await Promise.allSettled(
            mutation.meta.invalidateQuery.map((queryKey) =>
              queryClient.invalidateQueries(queryKey),
            ),
          );
        } else {
          await queryClient.invalidateQueries(mutation.meta.invalidateQuery);
        }
      }
    },
  }),
});
