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
  setSearchQuery: (query: string) => void;
  setSelectedFilters: (filters: AppState["selectedFilters"]) => void;
  setCurrentLocation: (location: string | undefined) => void;
  addSearchHistory: (item: SearchHistoryItem) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setSelectedYpoProfileId: (id: number | null) => void;
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

// Fake realistic data
const generateMembers = (): Member[] => [
  {
    id: "1",
    name: "Sarah Chen",
    title: "CEO",
    company: "TechVenture AI",
    chapter: "New York Metro",
    region: "North America",
    location: "New York, NY",
    industry: "Technology",
    expertise: ["AI/ML", "SaaS", "Enterprise Software", "Scaling"],
    interests: ["Quantum Computing", "Climate Tech", "Education"],
    leadershipDNA: ["Visionary", "Strategic", "Empathetic"],
    avatar: "/professional-woman-ceo.png",
    bio: "Serial entrepreneur with 2 successful exits in enterprise AI. Passionate about using technology to solve global challenges.",
    linkedinBio:
      "CEO at TechVenture AI | 2x Founder | Forbes 40 Under 40 | Passionate about democratizing AI for enterprise",
    yearsInYPO: 4,
    forumName: "Innovators Circle",
    networkMemberships: ["Women's Network", "Tech Leaders Network"],
    recentEvents: ["GLC Singapore 2024", "AI Summit NYC"],
    languages: ["English", "Mandarin"],
    travelPattern: ["New York", "San Francisco", "Singapore", "London"],
    exitHistory: "Sold DataCorp to Oracle (2022) - $340M",
    socialScore: 94,
    ceoDNA: {
      health: ["Marathon Running", "Plant-Based Diet"],
      wellness: ["Meditation", "Yoga"],
      sports: ["Tennis", "Skiing"],
      hobbies: ["Classical Piano", "Wine Collecting"],
    },
    personalGoals: ["Scale to $1B valuation", "Expand to APAC markets", "Mentor 10 women founders"],
    connectionStrength: 92,
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    title: "Founder & CEO",
    company: "GreenScale Manufacturing",
    chapter: "Los Angeles",
    region: "North America",
    location: "Los Angeles, CA",
    industry: "Manufacturing",
    expertise: ["Sustainable Manufacturing", "Supply Chain", "Operations", "Robotics"],
    interests: ["Sustainability", "Automation", "Family Business"],
    leadershipDNA: ["Resilient", "Innovative", "Results-Driven"],
    avatar: "/professional-entrepreneur.png",
    bio: "Third-generation manufacturer transforming traditional manufacturing with sustainable practices and automation.",
    linkedinBio:
      "CEO & 3rd Gen Owner at GreenScale Manufacturing | Sustainable Manufacturing Pioneer | TEDx Speaker",
    yearsInYPO: 6,
    forumName: "Legacy Builders",
    networkMemberships: ["Sustainable Business Network", "Manufacturing Excellence"],
    recentEvents: ["Regional Forum LA", "Sustainability Summit"],
    languages: ["English", "Spanish"],
    travelPattern: ["Los Angeles", "Mexico City", "Dubai", "Shanghai"],
    socialScore: 88,
    ceoDNA: {
      health: ["CrossFit", "Pescatarian"],
      wellness: ["Family Time", "Nature Hikes"],
      sports: ["Soccer", "Golf"],
      hobbies: ["Woodworking", "Craft Beer Brewing"],
    },
    personalGoals: [
      "Carbon neutral by 2026",
      "Double revenue sustainably",
      "Pass business to next gen",
    ],
    connectionStrength: 85,
  },
  {
    id: "3",
    name: "Priya Sharma",
    title: "CEO & Co-Founder",
    company: "HealthBridge Innovations",
    chapter: "San Francisco Bay Area",
    region: "North America",
    location: "San Francisco, CA",
    industry: "Healthcare",
    expertise: ["Digital Health", "Telemedicine", "Healthcare IT", "Patient Experience"],
    interests: ["Mental Health", "Preventive Care", "Health Equity"],
    leadershipDNA: ["Compassionate", "Data-Driven", "Disruptive"],
    avatar: "/professional-woman-doctor.png",
    bio: "Pioneering digital health solutions that make quality healthcare accessible to underserved communities.",
    linkedinBio:
      "Co-Founder & CEO at HealthBridge | Digital Health Innovator | Stanford Medicine Alum | Serving 2M+ patients",
    yearsInYPO: 3,
    forumName: "Health Innovators",
    networkMemberships: ["Women's Network", "Healthcare Leaders"],
    recentEvents: ["Health Tech Conference", "GLC Dubai 2024"],
    languages: ["English", "Hindi", "Gujarati"],
    travelPattern: ["San Francisco", "New York", "Bangalore", "Dubai"],
    socialScore: 91,
    ceoDNA: {
      health: ["Ayurveda Practitioner", "Vegetarian"],
      wellness: ["Mindfulness", "Breathwork"],
      sports: ["Hiking", "Badminton"],
      hobbies: ["Indian Classical Dance", "Cooking", "Reading"],
    },
    personalGoals: ["Reach 10M patients", "IPO by 2027", "Health equity advocacy"],
    connectionStrength: 89,
  },
  {
    id: "4",
    name: "David Okonkwo",
    title: "Managing Director",
    company: "Okonkwo Consumer Brands",
    chapter: "London",
    region: "Europe",
    location: "London, UK",
    industry: "Consumer Goods",
    expertise: ["Brand Strategy", "Market Expansion", "Retail", "E-commerce"],
    interests: ["African Markets", "Youth Entrepreneurship", "Sports"],
    leadershipDNA: ["Bold", "Culturally Aware", "Growth-Oriented"],
    avatar: "/professional-man-business.png",
    bio: "Building pan-African consumer brands with global reach. Advocate for entrepreneurship in emerging markets.",
    linkedinBio:
      "Managing Director at Okonkwo Brands | Pan-African Brand Builder | Oxford MBA | Empowering African Entrepreneurs",
    yearsInYPO: 5,
    forumName: "Global Growth",
    networkMemberships: ["African Business Network", "Consumer Brands Forum"],
    recentEvents: ["GLC Singapore 2024", "Africa Business Summit"],
    languages: ["English", "French", "Yoruba"],
    travelPattern: ["London", "Lagos", "Dubai", "Paris"],
    socialScore: 86,
    ceoDNA: {
      health: ["Boxing", "Intermittent Fasting"],
      wellness: ["Music Therapy", "Community Service"],
      sports: ["Football (Soccer)", "Basketball"],
      hobbies: ["DJ-ing", "Photography", "African Art Collecting"],
    },
    personalGoals: [
      "Expand to 20 African countries",
      "Launch US market",
      "Youth entrepreneurship fund",
    ],
    connectionStrength: 83,
  },
  {
    id: "5",
    name: "Elena Volkov",
    title: "CEO",
    company: "Quantum Robotics",
    chapter: "Dubai",
    region: "Middle East",
    location: "Dubai, UAE",
    industry: "Robotics",
    expertise: ["Robotics", "AI", "Industrial Automation", "R&D"],
    interests: ["Space Tech", "STEM Education", "Innovation Policy"],
    leadershipDNA: ["Pioneering", "Technical", "Collaborative"],
    avatar: "/professional-woman-engineer.png",
    bio: "Leading robotics innovation in the Middle East. Former aerospace engineer turned entrepreneur.",
    linkedinBio:
      "CEO at Quantum Robotics | Ex-Aerospace Engineer | MIT PhD | Building the future of automation in MENA",
    yearsInYPO: 2,
    forumName: "Tech Pioneers",
    networkMemberships: ["Tech Leaders Network", "Innovation Forum"],
    recentEvents: ["GLC Dubai 2024", "Robotics Expo Tokyo"],
    languages: ["English", "Russian", "Arabic"],
    travelPattern: ["Dubai", "Moscow", "Singapore", "Berlin"],
    socialScore: 89,
    ceoDNA: {
      health: ["Rock Climbing", "Keto Diet"],
      wellness: ["Chess", "Sauna"],
      sports: ["Ice Skating", "Kitesurfing"],
      hobbies: ["Astrophotography", "Classical Music", "Coding for Fun"],
    },
    personalGoals: [
      "First MENA robotics unicorn",
      "Space robotics division",
      "STEM programs for girls",
    ],
    connectionStrength: 87,
  },
  {
    id: "6",
    name: "James Mitchell",
    title: "President",
    company: "Mitchell Financial Group",
    chapter: "New York Metro",
    region: "North America",
    location: "New York, NY",
    industry: "Financial Services",
    expertise: ["Private Equity", "M&A", "Investment Strategy", "Risk Management"],
    interests: ["Impact Investing", "Philanthropy", "Education Reform"],
    leadershipDNA: ["Analytical", "Principled", "Mentorship-Focused"],
    avatar: "/professional-man-finance.png",
    bio: "Managing partner focused on impact investing and sustainable business growth. Board member of multiple education nonprofits.",
    linkedinBio:
      "President at Mitchell Financial Group | Impact Investor | Harvard MBA | Board Member at Education First",
    yearsInYPO: 8,
    forumName: "Financial Leaders",
    networkMemberships: ["Finance Network", "Impact Investment Forum"],
    recentEvents: ["Finance Summit NYC", "Impact Investing Conference"],
    languages: ["English", "French"],
    travelPattern: ["New York", "London", "Zurich", "Hong Kong"],
    socialScore: 92,
    ceoDNA: {
      health: ["Triathlon", "Mediterranean Diet"],
      wellness: ["Stoic Philosophy", "Journaling"],
      sports: ["Sailing", "Squash"],
      hobbies: ["Rare Book Collecting", "Opera", "Mentorship"],
    },
    personalGoals: ["$5B impact fund", "Education endowment", "Write investment memoir"],
    connectionStrength: 90,
  },
  {
    id: "7",
    name: "Yuki Tanaka",
    title: "CEO",
    company: "NextGen Automotive",
    chapter: "Tokyo",
    region: "Asia Pacific",
    location: "Tokyo, Japan",
    industry: "Automotive",
    expertise: ["Electric Vehicles", "Autonomous Systems", "Manufacturing", "Innovation"],
    interests: ["Clean Energy", "Urban Mobility", "Design"],
    leadershipDNA: ["Perfectionist", "Customer-Centric", "Forward-Thinking"],
    avatar: "/professional-man-automotive.jpg",
    bio: "Transforming the automotive industry with next-generation electric and autonomous vehicles.",
    linkedinBio:
      "CEO at NextGen Automotive | EV Pioneer | Tokyo University Engineering | Redefining urban mobility",
    yearsInYPO: 4,
    forumName: "Mobility Innovators",
    networkMemberships: ["Automotive Leaders", "Clean Tech Network"],
    recentEvents: ["Auto Expo Tokyo", "GLC Singapore 2024"],
    languages: ["Japanese", "English", "German"],
    travelPattern: ["Tokyo", "Singapore", "Munich", "San Francisco"],
    socialScore: 87,
    ceoDNA: {
      health: ["Aikido", "Traditional Japanese Diet"],
      wellness: ["Tea Ceremony", "Onsen Therapy"],
      sports: ["Kendo", "Cycling"],
      hobbies: ["Japanese Calligraphy", "Bonsai", "Automotive Design"],
    },
    personalGoals: ["Launch Level 5 autonomous vehicle", "Zero emission fleet", "Design museum"],
    connectionStrength: 86,
  },
  {
    id: "8",
    name: "Isabella Costa",
    title: "Founder & CEO",
    company: "EduTech Global",
    chapter: "São Paulo",
    region: "Latin America",
    location: "São Paulo, Brazil",
    industry: "Education Technology",
    expertise: ["EdTech", "Digital Learning", "Scale-ups", "Emerging Markets"],
    interests: ["Education Access", "Social Impact", "Youth Development"],
    leadershipDNA: ["Passionate", "Mission-Driven", "Adaptive"],
    avatar: "/professional-woman-education.jpg",
    bio: "Building accessible education technology for Latin America. Impacting 5M+ students across 12 countries.",
    linkedinBio:
      "Founder & CEO at EduTech Global | EdTech Pioneer in LATAM | 5M+ Students Reached | Social Entrepreneur",
    yearsInYPO: 3,
    forumName: "Education Pioneers",
    networkMemberships: ["Women's Network", "Social Impact Network", "EdTech Forum"],
    recentEvents: ["EdTech Summit Brazil", "Regional Forum LATAM"],
    languages: ["Portuguese", "Spanish", "English"],
    travelPattern: ["São Paulo", "Mexico City", "Miami", "Madrid"],
    socialScore: 90,
    ceoDNA: {
      health: ["Beach Volleyball", "Açaí Bowls"],
      wellness: ["Capoeira", "Beach Walks"],
      sports: ["Surfing", "Dancing"],
      hobbies: ["Samba", "Sustainable Fashion", "Travel"],
    },
    personalGoals: ["Impact 50M students", "Expand to Africa", "Education equity foundation"],
    connectionStrength: 88,
  },
  {
    id: "9",
    name: "Ahmed Al-Rashid",
    title: "CEO",
    company: "Al-Rashid Energy Solutions",
    chapter: "Dubai",
    region: "Middle East",
    location: "Dubai, UAE",
    industry: "Oil & Gas",
    expertise: ["Energy", "Renewable Transition", "Strategic Planning", "Innovation"],
    interests: ["Clean Energy", "Innovation", "Regional Development"],
    leadershipDNA: ["Transformational", "Strategic", "Visionary"],
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Leading traditional energy company through renewable transition. Champion of sustainable energy in the Middle East.",
    linkedinBio:
      "CEO at Al-Rashid Energy | Energy Transition Leader | Wharton MBA | Transforming MENA Energy Landscape",
    yearsInYPO: 7,
    forumName: "Energy Leaders",
    networkMemberships: ["Energy Network", "Innovation Forum", "Regional Leaders"],
    recentEvents: ["Energy Summit Dubai", "GLC Singapore 2024"],
    languages: ["Arabic", "English", "French"],
    travelPattern: ["Dubai", "Abu Dhabi", "London", "Houston"],
    socialScore: 85,
    ceoDNA: {
      health: ["Padel Tennis", "Mediterranean Diet"],
      wellness: ["Reading", "Family Time"],
      sports: ["Falconry", "Golf"],
      hobbies: ["Horses", "Architecture", "Heritage Preservation"],
    },
    personalGoals: [
      "50% renewable portfolio by 2030",
      "Regional clean energy hub",
      "Innovation center",
    ],
    connectionStrength: 84,
  },
  {
    id: "10",
    name: "Jennifer Walsh",
    title: "CEO",
    company: "WellnessFirst Corp",
    chapter: "San Diego",
    region: "North America",
    location: "San Diego, CA",
    industry: "Wellness",
    expertise: ["Corporate Wellness", "Health Tech", "Behavioral Science", "Scaling"],
    interests: ["Holistic Health", "Mental Wellness", "Work-Life Balance"],
    leadershipDNA: ["Empathetic", "Innovative", "Purpose-Driven"],
    avatar: "/placeholder.svg?height=100&width=100",
    bio: "Pioneer in corporate wellness programs. Helping Fortune 500 companies create healthier workplace cultures.",
    linkedinBio:
      "CEO at WellnessFirst | Corporate Wellness Pioneer | Behavioral Scientist | 500+ Corporate Clients",
    yearsInYPO: 5,
    forumName: "Health & Wellness",
    networkMemberships: ["Women's Network", "Healthcare Leaders", "Wellness Network"],
    recentEvents: ["Wellness Summit SD", "Women's Network Retreat"],
    languages: ["English", "Spanish"],
    travelPattern: ["San Diego", "San Francisco", "Austin", "Miami"],
    socialScore: 93,
    ceoDNA: {
      health: ["Pilates", "Organic Whole Foods"],
      wellness: ["Meditation", "Sound Healing", "Forest Bathing"],
      sports: ["Surfing", "Beach Yoga"],
      hobbies: ["Essential Oils", "Healthy Cooking", "Wellness Blogging"],
    },
    personalGoals: ["1M employees reached", "Global expansion", "Wellness certification program"],
    connectionStrength: 91,
  },
];

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
    image: "/singapore-conference-center.jpg",
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
    image: "/tech-conference-ai.jpg",
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
    image: "/dubai-business-conference.jpg",
    timeZone: "Asia/Dubai",
    locationType: "Venue",
    audience: ["Business Leaders"],
    programFormat: "Summit",
    status: "Confirmed",
    focus: ["Sustainability Practices", "ESG Leadership"],
    url: "https://www.ypointernational.org/sustainability-summit",
    networks: ["Middle East Network"],
  },
  {
    id: "4",
    title: "Women's Network Annual Retreat",
    type: "Network",
    date: "2025-02-25",
    location: "Napa Valley Resort",
    city: "San Francisco",
    description:
      "Empowering retreat for women leaders with workshops on leadership, balance, and growth.",
    tags: ["Women Leaders", "Leadership", "Personal Growth", "Networking"],
    attendees: 156,
    capacity: 200,
    image: "/women-leadership-retreat.jpg",
    timeZone: "America/Los_Angeles",
    locationType: "Venue",
    audience: ["Women Entrepreneurs"],
    programFormat: "Retreat",
    status: "Confirmed",
    focus: ["Women in Leadership", "Personal Development"],
    url: "https://www.ypointernational.org/womens-retreat",
    networks: ["Women's Network"],
  },
  {
    id: "5",
    title: "Manufacturing Excellence Forum",
    type: "Forum",
    date: "2025-01-28",
    location: "Industry Hub, Los Angeles",
    city: "Los Angeles",
    description: "Forum exploring advanced manufacturing, automation, and supply chain innovation.",
    tags: ["Manufacturing", "Innovation", "Operations", "Automation"],
    attendees: 64,
    capacity: 80,
    image: "/modern-manufacturing-facility.png",
    timeZone: "America/Los_Angeles",
    locationType: "Venue",
    audience: ["Manufacturing Leaders"],
    programFormat: "Forum",
    status: "Confirmed",
    focus: ["Manufacturing Excellence", "Supply Chain Innovation"],
    url: "https://www.ypointernational.org/manufacturing-forum",
    networks: ["Manufacturing Excellence Network"],
  },
  {
    id: "6",
    title: "Paris Chapter Networking Evening",
    type: "Chapter",
    date: "2025-01-22",
    location: "Le Marais District, Paris",
    city: "Paris",
    description: "Informal networking evening with Paris chapter members and visiting YPO leaders.",
    tags: ["Networking", "Social", "Paris", "Chapter Event"],
    attendees: 42,
    capacity: 60,
    image: "/paris-evening-event.jpg",
    timeZone: "Europe/Paris",
    locationType: "Venue",
    audience: ["Paris Chapter Members"],
    programFormat: "Networking Evening",
    status: "Confirmed",
    focus: ["Paris Networking"],
    url: "https://www.ypointernational.org/paris-networking-evening",
    networks: ["Europe Network"],
  },
  {
    id: "7",
    title: "Scale-Up Strategy Workshop",
    type: "Network",
    date: "2025-02-05",
    location: "Tech Quarter, London",
    city: "London",
    description: "Interactive workshop on scaling strategies for high-growth companies.",
    tags: ["Growth", "Strategy", "Scale-Up", "Workshop"],
    attendees: 78,
    capacity: 100,
    image: "/london-business-workshop.jpg",
    timeZone: "Europe/London",
    locationType: "Venue",
    audience: ["Entrepreneurs"],
    programFormat: "Workshop",
    status: "Confirmed",
    focus: ["Scaling Strategies", "Entrepreneurship"],
    url: "https://www.ypointernational.org/scale-up-workshop",
    networks: ["Global Network"],
  },
  {
    id: "8",
    title: "Healthcare Innovation Summit",
    type: "Network",
    date: "2025-03-01",
    location: "Medical District, New York",
    city: "New York",
    description:
      "Summit focused on digital health innovations and the future of healthcare delivery.",
    tags: ["Healthcare", "Innovation", "Digital Health", "Future"],
    attendees: 112,
    capacity: 150,
    image: "/healthcare-innovation-conference.jpg",
    timeZone: "America/New_York",
    locationType: "Venue",
    audience: ["Healthcare Leaders"],
    programFormat: "Summit",
    status: "Confirmed",
    focus: ["Digital Health", "Healthcare Innovation"],
    url: "https://www.ypointernational.org/healthcare-summit",
    networks: ["Healthcare Leaders Network"],
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

export const useStore = create<AppState>((set) => ({
  members: generateMembers(),
  events: generateEvents(),
  content: generateContent(),
  searchQuery: "",
  selectedFilters: {},
  currentLocation: undefined,
  searchHistory: [],
  recommendations: [],
  chatMessages: [],
  selectedYpoProfileId: null,
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
}));
