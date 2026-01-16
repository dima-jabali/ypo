import { axiosClient } from "../axios-client";
import type {
  YpoProfile,
  YpoProfilesResponse,
  ProfileSimilarityResponse,
} from "../types/ypo-profile";

/**
 * Get all YPO profiles
 * Uses POST method with empty body as per API requirements
 */
export async function getYpoProfiles(): Promise<YpoProfile[]> {
  const response = await axiosClient.get<YpoProfilesResponse>("/api/v1/ypo/profiles");

  // Handle both response formats: { profiles: [...] } or just [...]
  if (response.data && typeof response.data === "object" && "profiles" in response.data) {
    return response.data.profiles;
  }

  // If response is already an array
  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

/**
 * Get a single YPO profile by ID
 * Uses POST method with ypo_profile_id in body
 */
export async function getYpoProfileById(id: number): Promise<YpoProfile> {
  const response = await axiosClient.get(`/api/v1/ypo/profile?ypo_profile_id=${id}`);

  // Handle both response formats: { profile: {...} } or just {...}
  if (response.data && typeof response.data === "object" && "profile" in response.data) {
    return response.data.profile;
  }

  return response.data as YpoProfile;
}

/**
 * Get similarity score and reasons between two YPO profiles
 */
export async function getProfileSimilarity(
  profileId1: number,
  profileId2: number,
): Promise<ProfileSimilarityResponse> {
  const response = await axiosClient.get<ProfileSimilarityResponse>(
    `/api/v1/ypo/profile-similarity/?ypo_profile_id_1=${profileId1}&ypo_profile_id_2=${profileId2}`,
  );

  return response.data;
}
