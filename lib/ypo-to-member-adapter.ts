import type { YpoProfile } from "./types/ypo-profile"
import type { Member } from "./store"

/**
 * Converts YpoProfile to Member format for compatibility with existing recommendation system
 */
export function ypoProfileToMember(profile: YpoProfile): Member {
  // Extract first and last name from full name
  const nameParts = (profile.name || "Unknown").split(" ")
  const initials =
    nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : profile.name?.[0] || "?"

  // Parse expertise from topics and experience
  const expertise = [
    ...(profile.topics || []),
    ...(profile.experience
      ?.slice(0, 3)
      .map((exp) => exp.title)
      .filter(Boolean) || []),
  ].slice(0, 5) as string[]

  // Parse interests from hobbies and interests
  const interests = [...(profile.interests || []), ...(profile.hobbies || [])].slice(0, 5)

  // Determine region from country or location
  const region = determineRegion(profile.country_code, profile.location)

  // Extract company info
  const company = profile.current_company_name || profile.current_company?.name || "Company"

  return {
    id: profile.id,
    name: profile.name || "Unknown",
    title: profile.position || "Member",
    company,
    chapter: profile.ypo_chapter || "Unknown Chapter",
    region,
    location: profile.city || profile.location || "Unknown",
    industry: profile.ypo_industry || profile.current_company_industry || "Other",
    expertise,
    interests,
    leadershipDNA: [], // Could be derived from about text with AI in future
    avatar: profile.avatar || "",
    bio: profile.about || "",
    linkedinBio: profile.about || undefined,
    yearsInYPO: calculateYearsInYPO(profile.experience),
    forumName: undefined,
    networkMemberships: [],
    recentEvents: [],
    languages: profile.languages || [],
    travelPattern: extractTravelPattern(profile.experience),
    exitHistory: undefined,
    socialScore: calculateSocialScore(profile),
    ceoDNA: {
      health: [],
      wellness: [],
      sports:
        profile.hobbies?.filter((h) => h.toLowerCase().includes("sport") || h.toLowerCase().includes("fitness")) || [],
      hobbies: profile.hobbies || [],
    },
    personalGoals: [],
    connectionStrength: undefined,
  }
}

function determineRegion(countryCode: string | null, location: string | null): string {
  if (!countryCode && !location) return "Unknown"

  const code = countryCode?.toUpperCase()
  const loc = location?.toLowerCase() || ""

  // North America
  if (code === "US" || code === "CA" || code === "MX") return "North America"

  // Europe
  if (["GB", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI"].includes(code || "")) {
    return "Europe"
  }

  // Asia Pacific
  if (["CN", "JP", "KR", "SG", "HK", "TW", "IN", "AU", "NZ", "TH", "MY", "ID", "PH", "VN"].includes(code || "")) {
    return "Asia Pacific"
  }

  // Middle East & Africa
  if (["AE", "SA", "IL", "QA", "KW", "ZA", "EG", "KE", "NG"].includes(code || "")) {
    return "Middle East & Africa"
  }

  // Latin America
  if (["BR", "AR", "CL", "CO", "PE", "VE"].includes(code || "")) {
    return "Latin America"
  }

  return "Other"
}

function calculateYearsInYPO(experience: YpoProfile["experience"]): number {
  if (!experience) return 0

  // Look for YPO-related experience
  const ypoExp = experience.find(
    (exp) => exp.company?.toLowerCase().includes("ypo") || exp.title?.toLowerCase().includes("ypo"),
  )

  if (ypoExp?.start_date) {
    const startYear = Number.parseInt(ypoExp.start_date.split("-")[0])
    const currentYear = new Date().getFullYear()
    return Math.max(0, currentYear - startYear)
  }

  return 0
}

function extractTravelPattern(experience: YpoProfile["experience"]): string[] {
  if (!experience) return []

  const locations = new Set<string>()

  experience.forEach((exp) => {
    if (exp.location) {
      // Extract city from "City, State" or "City, Country" format
      const city = exp.location.split(",")[0].trim()
      if (city) locations.add(city)
    }
  })

  return Array.from(locations).slice(0, 5)
}

function calculateSocialScore(profile: YpoProfile): number {
  let score = 50 // Base score

  // LinkedIn connections boost
  if (profile.connections) {
    score += Math.min(30, Math.floor(profile.connections / 100))
  }

  // Activity boost
  if (profile.activity && profile.activity.length > 0) {
    score += Math.min(10, profile.activity.length)
  }

  // Recommendations boost
  if (profile.recommendations_count) {
    score += Math.min(10, profile.recommendations_count)
  }

  return Math.min(100, score)
}

/**
 * Batch convert multiple YPO profiles to members
 */
export function ypoProfilesToMembers(profiles: YpoProfile[]): Member[] {
  return profiles.map(ypoProfileToMember)
}
