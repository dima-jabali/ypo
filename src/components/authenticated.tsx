"use client";

import { useQuery } from "@tanstack/react-query";

import { authStore } from "#/contexts/auth/auth";
import { getIsRunningInIframe } from "#/helpers/utils";

export function Authenticated({ children }: React.PropsWithChildren) {
  if (typeof window === "undefined") {
    return null;
  }

  const isUsingLocalClerk = authStore.use.isUsingLocalClerk();
  const clerkApiToken = authStore.use.clerkApiToken();
  const token = authStore.use.token();

  const hasAnyToken = !!token || !!clerkApiToken;

  useQuery({
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    queryKey: ["auth", "handle-inside-iframe", hasAnyToken],
    queryFn: async () => {
      if (getIsRunningInIframe()) {
        console.log("App is running inside an iframe. Waiting for authentication to complete...");
      } else {
        console.log("App is not running inside an iframe. Using local Clerk immediately.");

        authStore.setState({ isUsingLocalClerk: true });
      }

      return null;
    },
  });

  return hasAnyToken || isUsingLocalClerk ? children : null;
}
