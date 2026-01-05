"use client";

import { useAuth } from "@clerk/nextjs";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { axiosClient } from "../axios-client";
import type {
  YpoProfileId,
  YpoProfileResponse,
  YpoProfilesResponse
} from "../types/ypo-profile";
import { isValidNumber } from "../utils";

// Query keys
export const ypoQueryKeys = {
	all: ["ypo-profiles"] as const,
	profiles: () => [...ypoQueryKeys.all, "list"] as const,
	profile: (id: YpoProfileId) => [...ypoQueryKeys.all, "detail", id] as const,
};

/**
 * Hook to fetch all YPO profiles
 * Only fetches when user is authenticated and userId is available
 */
export function useYpoProfiles() {
	const { isLoaded, userId } = useAuth();

	return useInfiniteQuery({
		initialPageParam: {
			limit: 100,
			offset: 0,
		},
		queryKey: ypoQueryKeys.profiles(),
		queryFn: async ({pageParam}) => {
			const searchParams = new URLSearchParams(
				pageParam as unknown as Record<string, string>,
			).toString();

			const response = await axiosClient.get<YpoProfilesResponse>(
				`/api/v1/ypo/profiles?${searchParams}`,
			);

			return response.data;
		},

		getNextPageParam: (lastPage, _allPages, lastPageParams) => {
			const nextOffset = lastPageParams.offset + lastPageParams.limit;

			if (lastPage && nextOffset > lastPage.num_results) return;

			return { ...lastPageParams, offset: nextOffset };
		},

		getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
			const prevOffset = firstPageParams.offset - firstPageParams.limit;

			if (prevOffset < 0) return;

			return { ...firstPageParams, offset: prevOffset };
		},

		enabled: isLoaded && !!userId,
	});
}

/**
 * Hook to fetch a single YPO profile by ID
 * Only fetches when user is authenticated and ID is provided
 */
export function useYpoProfile(id: YpoProfileId) {
	const { isLoaded, userId } = useAuth();

	return useQuery({
		queryKey: ypoQueryKeys.profile(id),
		queryFn: async () => {
			const response = await axiosClient.get<YpoProfileResponse>(
				`/api/v1/ypo/profile?ypo_profile_id=${id}`,
			);

			return response.data;
		},
		enabled: isLoaded && !!userId && isValidNumber(id),
	});
}
