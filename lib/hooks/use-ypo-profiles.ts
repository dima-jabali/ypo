"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { axiosClient } from "../axios-client"
import type { YpoProfile, YpoProfileId, YpoProfilesResponse, ProfileSearchParams } from "../types/ypo-profile"

// Query keys
export const ypoQueryKeys = {
  all: ["ypo-profiles"] as const,
  profiles: (params?: ProfileSearchParams) => [...ypoQueryKeys.all, "list", params] as const,
  profile: (id: YpoProfileId) => [...ypoQueryKeys.all, "detail", id] as const,
}

export function useYpoProfiles(searchParams?: ProfileSearchParams) {
  return useQuery({
    queryKey: ypoQueryKeys.profiles(searchParams),
    queryFn: async () => {
      const params = new URLSearchParams()

      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value))
          }
        })
      }

      const queryString = params.toString()
      const url = queryString ? `/api/v1/ypo/profiles?${queryString}` : "/api/v1/ypo/profiles"

      const response = await axiosClient.get<YpoProfilesResponse>(url)

      return response.data
    },
  })
}

/**
 * Hook to fetch all YPO profiles with infinite scrolling
 * Only fetches when user is authenticated and userId is available
 */
export function useYpoProfilesInfinite() {
  return useInfiniteQuery({
    initialPageParam: {
      limit: 100,
      offset: 0,
    },
    queryKey: ypoQueryKeys.profiles(),
    queryFn: async ({ pageParam }) => {
      const searchParams = new URLSearchParams(pageParam as unknown as Record<string, string>).toString()

      const response = await axiosClient.get<YpoProfilesResponse>(`/api/v1/ypo/profiles?${searchParams}`)

      return response.data
    },

    getNextPageParam: (lastPage, _allPages, lastPageParams) => {
      const nextOffset = lastPageParams.offset + lastPageParams.limit

      if (lastPage && nextOffset > lastPage.num_results) return

      return { ...lastPageParams, offset: nextOffset }
    },

    getPreviousPageParam: (_firstPage, _allPages, firstPageParams) => {
      const prevOffset = firstPageParams.offset - firstPageParams.limit

      if (prevOffset < 0) return

      return { ...firstPageParams, offset: prevOffset }
    },
  })
}

/**
 * Hook to fetch a single YPO profile by ID
 * Only fetches when user is authenticated and ID is provided
 */
export function useYpoProfile(id: YpoProfileId) {
  return useQuery({
    queryKey: ypoQueryKeys.profile(id),
    queryFn: async () => {
      const response = await axiosClient.get<YpoProfile>(`/api/v1/ypo/profile?ypo_profile_id=${id}`)

      return response.data
    },
  })
}
