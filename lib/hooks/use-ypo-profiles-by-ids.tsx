"use client"

import { useQueries } from "@tanstack/react-query"
import { axiosClient } from "../axios-client"
import type { YpoProfile } from "../types/ypo-profile"
import { ypoQueryKeys } from "./use-ypo-profiles"

/**
 * Hook to fetch multiple YPO profiles by their IDs
 * Uses parallel queries for efficient fetching
 */
export function useYpoProfilesByIds(ids: number[]) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ypoQueryKeys.profile(id as unknown as string),
      queryFn: async () => {
        const response = await axiosClient.get<YpoProfile>(`/api/v1/ypo/profile?ypo_profile_id=${id}`)
        return response.data
      },
      enabled: !!id,
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const profiles = queries.map((q) => q.data).filter((profile): profile is YpoProfile => !!profile)

  return {
    profiles,
    isLoading,
    isError,
    queries,
  }
}
