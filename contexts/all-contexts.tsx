import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { dark } from "@clerk/themes";
import { memo } from "react";

import { Toaster } from "#/components/Toast/toaster";
import { TooltipProvider } from "#/components/Tooltip";
import { WithClerk } from "#/components/with-clerk";
import { CheckIfClerkUserHasChanged } from "#/features/auth/check-if-clerk-user-has-changed";
import { AddCompletionProviderToMonacoEditor } from "#/features/completion-providers/sql-completion-provider";
import { authStore } from "./auth/auth";
import { GeneralContextListeners } from "./general-ctx/listeners";
import { WebsocketProvider } from "./Websocket/websocket-provider";
import { generalContextStore } from "./general-ctx/general-context";
import { ColorScheme } from "#/types/general";
import { ClearAllStoresOnSignedOut } from "#/features/clear-all-stores-on-signed-out";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
	throw new Error(
		"import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined",
	);
}

export const AllContexts = memo(function AllContexts({
	children,
}: React.PropsWithChildren) {
	const isUsingClerk = authStore.use.isUsingLocalClerk();

	const signedInNodes = (
		<>
			<AddCompletionProviderToMonacoEditor />
			<GeneralContextListeners />

			<ReactQueryDevtools initialIsOpen={false} />

			<Toaster />

			<WebsocketProvider>
				<TooltipProvider delayDuration={100}>{children}</TooltipProvider>
			</WebsocketProvider>
		</>
	);

	return isUsingClerk ? (
		<WithClerkProvider>
			<WithClerk>
				<SignedIn>
					<CheckIfClerkUserHasChanged>
						{signedInNodes}
					</CheckIfClerkUserHasChanged>
				</SignedIn>

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
		throw new Error(
			"import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined",
		);
	}

	const colorScheme = generalContextStore.use.colorScheme();

	return (
		<ClerkProvider
			appearance={{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				theme: colorScheme === ColorScheme.dark ? (dark as any) : undefined!,
			}}
			publishableKey={CLERK_PUBLISHABLE_KEY}
		>
			{children}
		</ClerkProvider>
	);
}

AllContexts.whyDidYouRender = true;
