"use client";

import dynamic from "next/dynamic";

import { ClientOnly } from "@/components/client-only";
import { Header } from "@/components/header";

const MakeQueryClientProvider = dynamic(
	() =>
		import("#/contexts/query-client-provider").then(
			(mod) => mod.MakeQueryClientProvider,
		),
	{ ssr: false },
);

const Authenticated = dynamic(
	() => import("#/components/authenticated").then((mod) => mod.Authenticated),
	{ ssr: false },
);

const AllContexts = dynamic(
	() => import("@/src/contexts/all-contexts").then((mod) => mod.AllContexts),
	{ ssr: false },
);

export function Providers({ children }: React.PropsWithChildren) {
	if (typeof window === "undefined") {
		return null;
	}

	return (
		<ClientOnly>
			<MakeQueryClientProvider>
				<Authenticated>
					<AllContexts>
						<Header />

						{children}
					</AllContexts>
				</Authenticated>
			</MakeQueryClientProvider>
		</ClientOnly>
	);
}
