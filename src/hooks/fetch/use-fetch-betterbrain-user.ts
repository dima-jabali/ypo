import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeyFactory } from "#/hooks/query-keys";
import type { BetterbrainUser } from "#/types/notebook";
import { authStore } from "#/contexts/auth/auth";

export type FetchBetterbrainUserResponse = BetterbrainUser;

export function useFetchBetterbrainUser() {

	
	const isUsingLocalClerk = authStore.use.isUsingLocalClerk();
	const clerkApiToken = authStore.use.token();
	const token = authStore.use.token();

	const queryOptions = useMemo(
		() =>
			queryKeyFactory.get["betterbrain-user"]({
				isUsingLocalClerk,
				clerkApiToken,
				token,
			}),
		[clerkApiToken, isUsingLocalClerk, token],
	);

	return useSuspenseQuery({
		staleTime: Infinity, // Maintain on cache
		gcTime: Infinity, // Maintain on cache
		...queryOptions,
	}).data;
}
