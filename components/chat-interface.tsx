"use client";

import { Search, Sparkles, Send, Clock, Calendar, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useStore,
  useMembers,
  useEvents,
  useContent,
  useChatMessages,
  type Member,
  type Event,
  type Content,
} from "@/lib/store";
import { cn } from "@/lib/utils";

// Intelligent search function with fuzzy matching
function searchMembers(
  query: string,
  members: Member[],
  filters?: {
    industries: string[];
    locations: string[];
    chapters: string[];
  },
): { results: Member[]; highlights: Map<string, string[]> } {
  const lowerQuery = query.toLowerCase();
  const results: Member[] = [];
  const highlights = new Map<string, string[]>();

  // Parse natural language queries
  const tokens = lowerQuery.split(" ").filter((t) => t.length > 0);

  for (const member of members) {
    if (filters) {
      if (filters.industries.length > 0 && !filters.industries.includes(member.industry)) continue;
      if (
        filters.locations.length > 0 &&
        !filters.locations.some((loc) => member.location.includes(loc))
      )
        continue;
      if (filters.chapters.length > 0 && !filters.chapters.includes(member.chapter)) continue;
    }

    const matches: string[] = [];
    let score = 0;

    // Name matching (highest priority)
    if (member.name.toLowerCase().includes(lowerQuery)) {
      score += 100;
      matches.push("name");
    } else {
      // Fuzzy name matching (first name, last name)
      const nameParts = member.name.toLowerCase().split(" ");
      for (const token of tokens) {
        if (nameParts.some((part) => part.startsWith(token) || part.includes(token))) {
          score += 50;
          matches.push("name");
          break;
        }
      }
    }

    // Location matching
    if (member.location.toLowerCase().includes(lowerQuery)) {
      score += 40;
      matches.push("location");
    } else {
      for (const token of tokens) {
        if (member.location.toLowerCase().includes(token)) {
          score += 20;
          matches.push("location");
        }
      }
    }

    // Industry matching
    if (member.industry.toLowerCase().includes(lowerQuery)) {
      score += 35;
      matches.push("industry");
    }

    // Expertise matching
    for (const exp of member.expertise) {
      if (exp.toLowerCase().includes(lowerQuery)) {
        score += 30;
        matches.push("expertise");
      }
    }

    // Interests matching
    for (const interest of member.interests) {
      if (interest.toLowerCase().includes(lowerQuery)) {
        score += 25;
        matches.push("interests");
      }
    }

    // CEO DNA matching
    if (member.ceoDNA) {
      const allDNA = [
        ...(member.ceoDNA.health || []),
        ...(member.ceoDNA.wellness || []),
        ...(member.ceoDNA.sports || []),
        ...(member.ceoDNA.hobbies || []),
      ];
      for (const dna of allDNA) {
        if (dna.toLowerCase().includes(lowerQuery)) {
          score += 20;
          matches.push("lifestyle");
        }
      }
    }

    // Multi-attribute queries (e.g., "Women CEOs in San Diego")
    if (tokens.length >= 2) {
      let multiMatchScore = 0;
      if (
        tokens.some((t) => ["women", "woman", "female"].includes(t)) &&
        member.networkMemberships.some((n) => n.toLowerCase().includes("women"))
      ) {
        multiMatchScore += 15;
        matches.push("network");
      }
      if (
        (tokens.some((t) => ["ceo", "founder", "president"].includes(t)) &&
          member.title.toLowerCase().includes("ceo")) ||
        member.title.toLowerCase().includes("founder")
      ) {
        multiMatchScore += 15;
        matches.push("title");
      }
      score += multiMatchScore;
    }

    // Chapter matching
    if (member.chapter.toLowerCase().includes(lowerQuery)) {
      score += 20;
      matches.push("chapter");
    }

    if (score > 0) {
      results.push(member);
      highlights.set(member.id, [...new Set(matches)]);
    }
  }

  // Sort by score
  results.sort((a, b) => {
    const scoreA = highlights.get(a.id)?.length || 0;
    const scoreB = highlights.get(b.id)?.length || 0;
    return scoreB - scoreA;
  });

  return { results: results.slice(0, 8), highlights };
}

// AI-powered response generation
function generateResponse(
  query: string,
  results: { members?: Member[]; events?: Event[]; content?: Content[] },
): string {
  const lowerQuery = query.toLowerCase();

  // Natural language response patterns
  if (lowerQuery.includes("who") || lowerQuery.includes("meet") || lowerQuery.includes("connect")) {
    if (results.members && results.members.length > 0) {
      return `I found ${results.members.length} members who match your search. Here are the top results based on shared attributes and connection potential.`;
    }
    return "I couldn't find any members matching your search. Try different keywords or filters.";
  }

  if (
    lowerQuery.includes("event") ||
    lowerQuery.includes("summit") ||
    lowerQuery.includes("conference")
  ) {
    if (results.events && results.events.length > 0) {
      return `Here are ${results.events.length} upcoming events that might interest you.`;
    }
  }

  if (
    lowerQuery.includes("talk") ||
    lowerQuery.includes("article") ||
    lowerQuery.includes("content")
  ) {
    if (results.content && results.content.length > 0) {
      return `I found ${results.content.length} pieces of content matching your search.`;
    }
  }

  // Default response
  if (results.members && results.members.length > 0) {
    return `Found ${results.members.length} members matching "${query}". Showing top results with the strongest matches.`;
  }

  return "Let me search for that. What specific attributes are you looking for?";
}

interface ChatInterfaceProps {
  filters?: {
    contentTypes: string[];
    eventCities: string[];
    industries: string[];
    eventTypes: string[];
    locations: string[];
    chapters: string[];
  };
}

export function ChatInterface({ filters }: ChatInterfaceProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { addChatMessage, addSearchHistory, clearChat } = useStore();
  const chatMessages = useStore(useChatMessages);
  const members = useStore(useMembers);
  const content = useStore(useContent);
  const events = useStore(useEvents);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);

    // Add user message
    addChatMessage({
      id: `user-${Date.now()}`,
      type: "user",
      content: query,
      timestamp: new Date(),
    });

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const { results: memberResults, highlights } = searchMembers(query, members, {
      industries: filters?.industries || [],
      locations: filters?.locations || [],
      chapters: filters?.chapters || [],
    });

    let filteredEvents = events;
    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter((e) => filters.eventTypes.includes(e.type));
    }
    if (filters?.eventCities && filters.eventCities.length > 0) {
      filteredEvents = filteredEvents.filter((e) => filters.eventCities.includes(e.city));
    }

    const eventResults = filteredEvents
      .filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.city.toLowerCase().includes(query.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
      )
      .slice(0, 4);

    let filteredContent = content;
    if (filters?.contentTypes && filters.contentTypes.length > 0) {
      filteredContent = filteredContent.filter((c) => filters.contentTypes.includes(c.type));
    }

    const contentResults = filteredContent
      .filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.author.toLowerCase().includes(query.toLowerCase()) ||
          c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
      )
      .slice(0, 4);

    // Generate AI response
    const aiResponse = generateResponse(query, {
      members: memberResults,
      events: eventResults,
      content: contentResults,
    });

    // Add assistant response
    addChatMessage({
      id: `assistant-${Date.now()}`,
      type: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      results: {
        members: memberResults,
        events: eventResults,
        content: contentResults,
      },
    });

    // Add to search history
    addSearchHistory({
      id: `search-${Date.now()}`,
      query,
      timestamp: new Date(),
      results: memberResults.length + eventResults.length + contentResults.length,
    });

    setInputValue("");
    setIsSearching(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };

  const quickSearches = [
    "Women CEOs in San Diego who like wellness",
    "James New York",
    "Oil & gas founders",
    "Who did I meet at GLC Singapore?",
    "Tech leaders in AI",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-w-5xl mx-auto simple-scrollbar">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Member Brain Search</h2>

            <p className="text-sm text-muted-foreground">
              Ask anything about members, events, or content
            </p>
          </div>
        </div>

        {chatMessages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="p-4 bg-primary/5 rounded-full">
                <Search className="h-12 w-12 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Magical Member Search</h3>

                <p className="text-muted-foreground max-w-md text-pretty">
                  Search by name, location, industry, interests, or ask natural questions. Our AI
                  understands what you're looking for.
                </p>
              </div>

              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm font-medium text-muted-foreground">Try these searches:</p>

                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((search, i) => (
                    <Button
                      onClick={() => handleSearch(search)}
                      className="text-xs"
                      variant="outline"
                      size="sm"
                      key={i}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.type === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.type === "assistant" && (
                    <div className="p-2 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "space-y-3 max-w-[85%]",
                      message.type === "user" && "max-w-[70%]",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2",
                        message.type === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted",
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>

                    {/* Results Display */}
                    {message.results && message.type === "assistant" && (
                      <div className="space-y-3">
                        {/* Member Results */}
                        {message.results.members && message.results.members.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              Top Matches
                            </div>

                            <div className="grid gap-2">
                              {message.results.members.map((member) => (
                                <Link href={`/members/${member.id}`} key={member.id}>
                                  <Card className="hover:border-primary transition-colors cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12">
                                          <AvatarImage
                                            src={member.avatar || "/placeholder.svg"}
                                            alt={member.name}
                                          />

                                          <AvatarFallback>
                                            {member.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-sm">{member.name}</p>

                                            <Badge variant="secondary" className="text-xs">
                                              {member.socialScore}% match
                                            </Badge>
                                          </div>

                                          <p className="text-xs text-muted-foreground mb-1">
                                            {member.title} at {member.company}
                                          </p>

                                          <div className="flex flex-wrap gap-1">
                                            {member.expertise.slice(0, 3).map((exp, i) => (
                                              <Badge className="text-xs" variant="outline" key={i}>
                                                {exp}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Event Results */}
                        {message.results.events && message.results.events.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Related Events
                            </div>

                            <div className="grid gap-2">
                              {message.results.events.map((event) => (
                                <Link href={`/events/${event.id}`} key={event.id}>
                                  <Card className="hover:border-primary transition-colors cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm mb-1">
                                            {event.title}
                                          </p>

                                          <p className="text-xs text-muted-foreground">
                                            {event.city}
                                          </p>
                                        </div>

                                        <Badge variant="secondary" className="text-xs">
                                          {event.type}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Content Results */}
                        {message.results.content && message.results.content.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              Related Content
                            </div>

                            <div className="grid gap-2">
                              {message.results.content.map((item) => (
                                <Link href={`/content/${item.id}`} key={item.id}>
                                  <Card className="hover:border-primary transition-colors cursor-pointer">
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm mb-1 line-clamp-1">
                                            {item.title}
                                          </p>

                                          <p className="text-xs text-muted-foreground">
                                            by {item.author}
                                          </p>
                                        </div>

                                        <Badge className="text-xs" variant="outline">
                                          {item.type}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.type === "user" && (
                    <div className="p-2 h-8 w-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder='Try "Women CEOs in San Diego" or "James New York"...'
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSearching}
          value={inputValue}
          className="flex-1"
        />

        <Button type="submit" disabled={isSearching || !inputValue.trim()}>
          {isSearching ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
