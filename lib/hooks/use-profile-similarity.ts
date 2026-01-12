"use client"

import { useQuery } from "@tanstack/react-query"
import { getProfileSimilarity } from "../api/ypo-api"

// Query keys
export const similarityQueryKeys = {
  all: ["profile-similarity"] as const,
  pair: (id1: number, id2: number) => [...similarityQueryKeys.all, id1, id2] as const,
}

/**
 * Hook to fetch similarity between two profiles
 * Only fetches when both IDs are provided
 */
export function useProfileSimilarity(profileId1: number | null, profileId2: number | null) {
  return useQuery({
    queryKey: similarityQueryKeys.pair(profileId1 || 0, profileId2 || 0),
    queryFn: async () => {
      if (!profileId1 || !profileId2) {
        throw new Error("Both profile IDs are required")
      }
      return getProfileSimilarity(profileId1, profileId2)
    },
    enabled: !!profileId1 && !!profileId2 && profileId1 !== profileId2,
  })
}
