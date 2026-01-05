import { axiosClient } from "../axios-client";
import type { YpoProfile, YpoProfilesResponse, YpoProfileResponse } from "../types/ypo-profile";

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
  const response = await axiosClient.get<YpoProfileResponse>(
    `/api/v1/ypo/profile?ypo_profile_id=${id}`,
  );

  // Handle both response formats: { profile: {...} } or just {...}
  if (response.data && typeof response.data === "object" && "profile" in response.data) {
    return response.data.profile;
  }

  return response.data as YpoProfile;
}
