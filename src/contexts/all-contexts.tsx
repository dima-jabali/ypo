"use client";

import { ClerkProvider, SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { memo } from "react";

import { Toaster } from "#/components/Toast/toaster";
import { TooltipProvider } from "#/components/Tooltip";
import { WithClerk } from "#/components/with-clerk";
import { ClearAllStoresOnSignedOut } from "#/features/clear-all-stores-on-signed-out";
import { WebsocketProvider } from "./Websocket/websocket-provider";
import { authStore } from "./auth/auth";

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined");
}

export const AllContexts = memo(function AllContexts({ children }: React.PropsWithChildren) {
  const isUsingClerk = authStore.use.isUsingLocalClerk();

  const signedInNodes = (
    <>
      <Toaster />

      <WebsocketProvider>
        <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
      </WebsocketProvider>
    </>
  );

  return isUsingClerk ? (
    <WithClerkProvider>
      <WithClerk>
        <SignedIn>{signedInNodes}</SignedIn>

        <SignedOut>
          <div className="h-screen w-screen flex items-center justify-center text-black">
            <SignIn />
          </div>

          <ClearAllStoresOnSignedOut />
        </SignedOut>
      </WithClerk>
    </WithClerkProvider>
  ) : (
    signedInNodes
  );
});

function WithClerkProvider({ children }: React.PropsWithChildren) {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined");
  }

  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{children}</ClerkProvider>;
}
