import type { Tagged } from "type-fest"

export type YpoProfileId = Tagged<string, "YpoProfileId">

export interface YpoProfilesResponse {
  results: YpoProfile[]
  num_results: number
  offset: string
  limit: string
}

export interface YPOProfileResponse {
  results: YpoProfile[]
}

export interface YpoProfile {
  id: YpoProfileId
  name: string | null
  position: string | null
  city: string | null
  location: string | null
  country_code: string | null
  linkedin_id: string | null
  linkedin_num_id: string | null
  url: string | null
  input_url: string | null
  avatar: string | null
  banner_image: string | null
  about: string | null
  followers: number | null
  connections: number | null
  memorialized_account: boolean
  default_avatar: string | boolean // Appears as both "True"/"False" and boolean in data

  // Professional Information
  current_company_name: string | null
  current_company_industry: string | null
  current_commpany_company_id: string | null
  current_company: CurrentCompany | null
  experience: Experience[] | null

  // YPO Specific Data
  ypo_chapter: string | null
  ypo_industry: string | null
  topics: string[] | null

  // Education and Other Details
  education: Education[] | null
  educations_details: string | null
  languages: string[] | null
  certifications: string[] | null
  honors_and_awards: unknown[] | null
  publications: unknown[] | null
  patents: unknown[] | null
  projects: unknown[] | null
  volunteer_experience: unknown[] | null
  courses: unknown[] | null

  // Social/Activity
  activity: Activity[] | null
  posts: unknown[] | null
  recommendations: string[] | null
  recommendations_count: number | null
  people_also_viewed: PersonViewed[] | null
  similar_profiles: unknown[]

  // Personal Interests
  hobbies: string[] | null
  interests: string[] | null

  // Metadata and Analysis
  umap_x: number | null
  umap_y: number | null
  hdbscan_cluster: number | null
  closest_hdbscan_cluster: number | null
  similar_neighbors: unknown[] | null
  created_at: string // ISO Date String
  updated_at: string // ISO Date String
}

export interface Experience {
  title: string | null
  company: string | null
  company_id?: string | null
  company_logo_url: string | null
  description?: string | null
  description_html: string | null
  start_date?: string | null
  end_date?: string | null
  duration?: string | null
  location?: string | null
  url?: string | null
  subtitle?: string | null
}

export interface CurrentCompany {
  name: string | null
  link?: string | null
  location: string | null
  company_id?: string | null
}

export interface Education {
  title: string | null
  url?: string | null
  start_year: string | null
  end_year: string | null
  description: string | null
  description_html: string | null
  institute_logo_url: string | null
}

export interface Activity {
  id: string
  title: string | null
  link: string | null
  img: string | null
  interaction: string | null
}

export interface PersonViewed {
  name: string
  about: string | null
  location: string | null
  profile_link: string
}

export interface ProfileSimilarityResponse {
  similarity: number
  similarity_reasons: {
    title: string
    what_you_have_in_common: string
    where_you_differ: string
    what_you_might_learn_from_each_other: string
    how_you_might_be_helpful_to_each_other: string
    closing: string
  }
}
