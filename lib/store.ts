import { create } from "zustand";

export interface Member {
  id: string;
  name: string;
  title: string;
  company: string;
  chapter: string;
  region: string;
  location: string;
  industry: string;
  expertise: string[];
  interests: string[];
  leadershipDNA: string[];
  avatar: string;
  bio: string;
  linkedinBio?: string;
  yearsInYPO: number;
  forumName?: string;
  networkMemberships: string[];
  recentEvents: string[];
  languages: string[];
  travelPattern: string[];
  exitHistory?: string;
  socialScore: number;
  ceoDNA?: {
    health?: string[];
    wellness?: string[];
    sports?: string[];
    hobbies?: string[];
  };
  personalGoals?: string[];
  connectionStrength?: number;
}

export interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  city: string;
  description: string;
  tags: string[];
  attendees: number;
  capacity: number;
  image: string;
  timeZone?: string;
  locationType?: string;
  audience?: string[];
  programFormat?: string;
  status?: string;
  focus?: string[];
  url?: string;
  networks?: string[];
}

export interface Content {
  id: string;
  title: string;
  type: "Talk" | "Article" | "Podcast" | "Video";
  author: string;
  authorId: string;
  date: string;
  tags: string[];
  description: string;
  duration?: string;
  views: number;
}

interface AppState {
  members: Member[];
  events: Event[];
  content: Content[];
  searchQuery: string;
  selectedFilters: {
    location?: string;
    industry?: string;
    expertise?: string;
    chapter?: string;
  };
  currentLocation?: string;
  searchHistory: SearchHistoryItem[];
  recommendations: Recommendation[];
  chatMessages: ChatMessage[];
  selectedYpoProfileId: number | null;
  impersonatedProfileId: number | null;
  setSearchQuery: (query: string) => void;
  setSelectedFilters: (filters: AppState["selectedFilters"]) => void;
  setCurrentLocation: (location: string | undefined) => void;
  addSearchHistory: (item: SearchHistoryItem) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setSelectedYpoProfileId: (id: number | null) => void;
  setImpersonatedProfileId: (id: number | null) => void;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  results: number;
}

export interface Recommendation {
  member: Member;
  reason: string;
  score: number;
  sharedAttributes: string[];
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  results?: {
    members?: Member[];
    events?: Event[];
    content?: Content[];
  };
}

// Selectors
export const useSearchQuery = (state: AppState) => state.searchQuery;
export const useSelectedFilters = (state: AppState) => state.selectedFilters;
export const useMembers = (state: AppState) => state.members;
export const useEvents = (state: AppState) => state.events;
export const useContent = (state: AppState) => state.content;
export const useCurrentLocation = (state: AppState) => state.currentLocation;
export const useSearchHistory = (state: AppState) => state.searchHistory;
export const useRecommendations = (state: AppState) => state.recommendations;
export const useChatMessages = (state: AppState) => state.chatMessages;
export const useSelectedYpoProfileId = (state: AppState) => state.selectedYpoProfileId;
export const useImpersonatedProfileId = (state: AppState) => state.impersonatedProfileId;

// Fake realistic data
const generateEvents = (): Event[] => [
  {
    id: "1",
    title: "Global Leadership Conference 2025",
    type: "GLC",
    date: "2025-03-15",
    location: "Marina Bay Sands, Singapore",
    city: "Singapore",
    description:
      "Annual flagship event bringing together 2,500+ YPO members for transformative learning and networking.",
    tags: ["Leadership", "Global", "Networking", "Innovation"],
    attendees: 2847,
    capacity: 3000,
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop",
    timeZone: "Asia/Singapore",
    locationType: "Venue",
    audience: ["YPO Members", "Guests"],
    programFormat: "Conference",
    status: "Confirmed",
    focus: ["Leadership Development", "Networking"],
    url: "https://www.ypointernational.org/glc2025",
    networks: ["Global Network", "Asia Pacific Network"],
  },
  {
    id: "2",
    title: "AI & Future of Work Forum",
    type: "Network",
    date: "2025-01-20",
    location: "Silicon Valley",
    city: "San Francisco",
    description:
      "Exclusive forum exploring AI transformation and its impact on business leadership.",
    tags: ["AI", "Technology", "Future of Work", "Innovation"],
    attendees: 87,
    capacity: 100,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
    timeZone: "America/Los_Angeles",
    locationType: "Online",
    audience: ["Tech Leaders"],
    programFormat: "Forum",
    status: "Pending",
    focus: ["AI in Business", "Future of Work"],
    url: "https://www.ypointernational.org/ai-forum",
    networks: ["Tech Leaders Network"],
  },
  {
    id: "3",
    title: "Sustainable Business Summit",
    type: "Regional",
    date: "2025-02-10",
    location: "Green Business Center, Dubai",
    city: "Dubai",
    description: "Regional event focused on sustainable business practices and ESG leadership.",
    tags: ["Sustainability", "ESG", "Climate", "Leadership"],
    attendees: 234,
    capacity: 300,
    image: "https://images.unsplash.com/photo-1512453979798-5658abf4ff4e?w=800&h=600&fit=crop",
    timeZone: "Asia/Dubai",
    locationType: "Venue",
    audience: ["Business Leaders"],
    programFormat: "Summit",
    status: "Confirmed",
    focus: ["Sustainability Practices", "ESG Leadership"],
    url: "https://www.ypointernational.org/sustainability-summit",
    networks: ["Sustainable Business Network"],
  },
  {
    id: "4",
    title: "Women Leaders Network Retreat",
    type: "Network",
    date: "2025-01-25",
    location: "Napa Valley Resort",
    city: "San Francisco",
    description:
      "Intimate retreat for women CEOs focused on authentic leadership and peer mentorship.",
    tags: ["Women Leaders", "Leadership", "Mentorship", "Wellness"],
    attendees: 42,
    capacity: 50,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    timeZone: "America/Los_Angeles",
    locationType: "Venue",
    audience: ["Women CEOs"],
    programFormat: "Retreat",
    status: "Confirmed",
    focus: ["Women Leadership", "Personal Development"],
    url: "https://www.ypointernational.org/women-retreat",
    networks: ["Women's Network"],
  },
  {
    id: "5",
    title: "New York Metro Chapter Forum",
    type: "Chapter",
    date: "2025-02-05",
    location: "Manhattan Conference Center",
    city: "New York",
    description: "Monthly chapter forum for New York Metro members featuring expert speakers.",
    tags: ["Chapter", "Networking", "Local", "Business"],
    attendees: 156,
    capacity: 200,
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    timeZone: "America/New_York",
    locationType: "Venue",
    audience: ["Chapter Members"],
    programFormat: "Forum",
    status: "Confirmed",
    focus: ["Local Networking", "Chapter Building"],
    url: "https://www.ypointernational.org/ny-forum",
    networks: ["New York Metro Chapter"],
  },
  {
    id: "6",
    title: "Tech Leaders Summit Tokyo",
    type: "Regional",
    date: "2025-03-01",
    location: "Tokyo International Forum",
    city: "Tokyo",
    description:
      "Asia Pacific technology leadership summit focused on innovation and digital transformation.",
    tags: ["Technology", "Innovation", "Asia Pacific", "Digital"],
    attendees: 312,
    capacity: 400,
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
    timeZone: "Asia/Tokyo",
    locationType: "Venue",
    audience: ["Tech Leaders", "Innovators"],
    programFormat: "Summit",
    status: "Confirmed",
    focus: ["Technology Innovation", "Digital Transformation"],
    url: "https://www.ypointernational.org/tokyo-tech",
    networks: ["Tech Leaders Network", "Asia Pacific Network"],
  },
  {
    id: "7",
    title: "Family Business Forum",
    type: "Forum",
    date: "2025-02-15",
    location: "Los Angeles Convention Center",
    city: "Los Angeles",
    description:
      "Forum dedicated to family business succession, governance, and generational transitions.",
    tags: ["Family Business", "Succession", "Governance", "Legacy"],
    attendees: 189,
    capacity: 250,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
    timeZone: "America/Los_Angeles",
    locationType: "Venue",
    audience: ["Family Business Owners"],
    programFormat: "Forum",
    status: "Confirmed",
    focus: ["Family Business", "Succession Planning"],
    url: "https://www.ypointernational.org/family-business",
    networks: ["Family Business Network"],
  },
  {
    id: "8",
    title: "Impact Investing Conference",
    type: "Network",
    date: "2025-03-20",
    location: "London Impact Hub",
    city: "London",
    description: "Conference exploring social impact investing and sustainable finance strategies.",
    tags: ["Impact", "Investing", "Sustainability", "Finance"],
    attendees: 167,
    capacity: 200,
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop",
    timeZone: "Europe/London",
    locationType: "Venue",
    audience: ["Investors", "Social Entrepreneurs"],
    programFormat: "Conference",
    status: "Confirmed",
    focus: ["Impact Investing", "Sustainable Finance"],
    url: "https://www.ypointernational.org/impact-investing",
    networks: ["Impact Investment Forum"],
  },
];

const generateContent = (): Content[] => [
  {
    id: "1",
    title: "Scaling Through Crisis: Lessons from the Pandemic",
    type: "Talk",
    author: "Sarah Chen",
    authorId: "1",
    date: "2024-11-15",
    tags: ["Leadership", "Crisis Management", "Scaling", "Resilience"],
    description:
      "Sarah Chen shares how TechVenture AI grew 300% during the pandemic by adapting quickly and focusing on customer needs.",
    duration: "42 min",
    views: 3847,
  },
  {
    id: "2",
    title: "The Future of Sustainable Manufacturing",
    type: "Article",
    author: "Marcus Rodriguez",
    authorId: "2",
    date: "2024-12-01",
    tags: ["Manufacturing", "Sustainability", "Innovation", "ESG"],
    description:
      "An in-depth look at how traditional manufacturers can transform operations to meet sustainability goals without sacrificing profitability.",
    views: 2156,
  },
  {
    id: "3",
    title: "Breaking Barriers in Digital Health",
    type: "Podcast",
    author: "Priya Sharma",
    authorId: "3",
    date: "2024-10-22",
    tags: ["Healthcare", "Digital Health", "Innovation", "Access"],
    description:
      "Priya discusses the challenges and opportunities in making quality healthcare accessible through technology.",
    duration: "58 min",
    views: 1923,
  },
  {
    id: "4",
    title: "Building Global Brands from Africa",
    type: "Video",
    author: "David Okonkwo",
    authorId: "4",
    date: "2024-11-08",
    tags: ["Branding", "Africa", "Global Markets", "Growth"],
    description:
      "David shares his journey building consumer brands that bridge African markets with global consumers.",
    duration: "35 min",
    views: 2641,
  },
  {
    id: "5",
    title: "The AI-Robotics Convergence",
    type: "Talk",
    author: "Elena Volkov",
    authorId: "5",
    date: "2024-12-10",
    tags: ["AI", "Robotics", "Technology", "Future"],
    description:
      "Elena explores how AI and robotics are converging to create the next generation of automation solutions.",
    duration: "47 min",
    views: 4182,
  },
  {
    id: "6",
    title: "Impact Investing: Beyond Returns",
    type: "Article",
    author: "James Mitchell",
    authorId: "6",
    date: "2024-09-18",
    tags: ["Finance", "Impact Investing", "ESG", "Strategy"],
    description:
      "A comprehensive guide to building an impact investment strategy that delivers both financial and social returns.",
    views: 1876,
  },
  {
    id: "7",
    title: "The Electric Vehicle Revolution in Asia",
    type: "Talk",
    author: "Yuki Tanaka",
    authorId: "7",
    date: "2024-11-30",
    tags: ["Automotive", "Electric Vehicles", "Innovation", "Asia"],
    description:
      "Yuki discusses how Asian markets are leading the global EV revolution and what it means for the industry.",
    duration: "51 min",
    views: 3294,
  },
  {
    id: "8",
    title: "Education Technology for Emerging Markets",
    type: "Podcast",
    author: "Isabella Costa",
    authorId: "8",
    date: "2024-10-05",
    tags: ["Education", "EdTech", "Emerging Markets", "Social Impact"],
    description:
      "Isabella shares insights on scaling education technology in resource-constrained environments.",
    duration: "44 min",
    views: 2087,
  },
];

export const useStore = create<AppState>((set, get) => ({
  members: [],
  events: generateEvents(),
  content: generateContent(),
  searchQuery: "",
  selectedFilters: {},
  currentLocation: undefined,
  searchHistory: [],
  recommendations: [],
  chatMessages: [],
  selectedYpoProfileId: null,
  impersonatedProfileId: 2416, // Default to user 2416
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFilters: (filters) => set({ selectedFilters: filters }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  addSearchHistory: (item) =>
    set((state) => ({
      searchHistory: [item, ...state.searchHistory].slice(0, 10),
    })),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChat: () => set({ chatMessages: [] }),
  setSelectedYpoProfileId: (id) => set({ selectedYpoProfileId: id }),
  setImpersonatedProfileId: (id) => set({ impersonatedProfileId: id }),
}));
