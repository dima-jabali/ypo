"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, useEvents, useContent } from "@/lib/store";
import {
  Search,
  Users,
  Calendar,
  BookOpen,
  MapPin,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import similarNodesData from "@/data/similar-nodes.json";
import { ClientOnly } from "@/components/client-only";

function Home() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const members = useMemo(() => similarNodesData.slice(0, 100), []);

  const content = useStore(useContent);
  const events = useStore(useEvents);
  const router = useRouter();

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const upcomingEvents = events.slice(0, 3);

  const recommendedMembers =
    selectedLocations.length > 0
      ? members
          .filter((m) =>
            selectedLocations.some(
              (loc) =>
                m.location?.includes(loc) || m.city?.includes(loc) || m.ypo_chapter?.includes(loc),
            ),
          )
          .slice(0, 5)
      : members.slice(0, 5);

  const recentContent = content.slice(0, 3);

  const toggleLocation = (location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location],
    );
  };

  return (
    <main className="container mx-auto p-6 space-y-8 simple-scrollbar">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12 border border-primary/20">
        <div className="relative z-10">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            YPO for Enterprise
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Your Unified Member Brain
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mb-6 text-pretty">
            A single, intelligent layer powering world-class member connection, search,
            personalization, and future AI experiences for 38,000 global executives.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/members">
              <Button size="lg" className="gap-2">
                <Search className="h-4 w-4" />
                Explore Members
              </Button>
            </Link>

            <Link href="/events">
              <Button className="gap-2 bg-transparent" variant="outline" size="lg">
                <Calendar className="h-4 w-4" />
                Browse Events
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <Sparkles className="w-full h-full" />
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/members")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>

            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">38,000+</div>

            <p className="text-xs text-muted-foreground">Across 142 chapters</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/events")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>

            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>

            <p className="text-xs text-muted-foreground">Happening this quarter</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/content")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Library</CardTitle>

            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">1,200+</div>

            <p className="text-xs text-muted-foreground">Talks, articles, podcasts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />

              <CardTitle>Retention Rate</CardTitle>
            </div>

            <CardDescription>Year over year</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">96.5%</div>

            <p className="text-xs text-muted-foreground">Year over year</p>
          </CardContent>
        </Card>
      </section>

      {/* Location-Aware Section */}
      <Card className="bg-gradient-to-r from-accent/50 to-accent/20 border-accent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />

            <CardTitle>Location-Aware Recommendations</CardTitle>
          </div>

          <CardDescription>
            {selectedLocations.length > 0
              ? `Filtering by: ${selectedLocations.join(", ")}`
              : "Select locations to filter member recommendations below"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "New York",
              "Dubai",
              "Singapore",
              "London",
              "San Francisco",
              "Tokyo",
              "Mumbai",
              "Sydney",
            ].map((location) => (
              <Button
                key={location}
                onClick={() => toggleLocation(location)}
                variant={selectedLocations.includes(location) ? "default" : "outline"}
                size="sm"
                className={cn(
                  selectedLocations.includes(location) && "bg-primary text-primary-foreground",
                )}
              >
                <MapPin className="h-3 w-3 mr-1" /> {location}
              </Button>
            ))}
          </div>
          {selectedLocations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocations([])}
              className="mt-3"
            >
              Clear Selection
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recommended Connections</CardTitle>

                <CardDescription>
                  {selectedLocations.length > 0
                    ? `Members in ${selectedLocations.join(", ")}`
                    : "Members you should meet"}
                </CardDescription>
              </div>

              <Link href="/connections">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {recommendedMembers.length > 0 ? (
              recommendedMembers.map((member) => (
                <Link key={member.id} href={`/members/${member.id}`}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={member.avatar || "/placeholder.svg"}
                        alt={member.name || ""}
                      />

                      <AvatarFallback>
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{member.name}</p>

                        <Badge variant="outline" className="text-xs">
                          71% match
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {member.position} at {member.current_company_name}
                      </p>

                      <p className="text-xs text-muted-foreground">{member.location}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members found for selected locations. Try different filters.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>

                <CardDescription>Don't miss these opportunities</CardDescription>
              </div>

              <Link href="/events">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{event.type}</Badge>

                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm mb-1">{event.title}</h4>

                  <p className="text-xs text-muted-foreground mb-2">{event.city}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />

                    <span>{event.attendees} attending</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Featured Content</CardTitle>

              <CardDescription>Latest talks and articles from YPO members</CardDescription>
            </div>

            <Link href="/content">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentContent.map((item) => {
              const author = members.find((m) => m.id === item.authorId);

              return (
                <Link key={item.id} href={`/content/${item.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer h-full grid grid-rows-4">
                    <Badge variant="outline" className="h-fit">
                      {item.type}
                    </Badge>

                    <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>

                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={author?.avatar || "/placeholder.svg"} alt={item.author} />

                        <AvatarFallback>
                          {item.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <span className="text-xs text-muted-foreground">{item.author}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.duration || "Read"}</span>

                      <span>{item.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/network")}
        >
          <CardHeader>
            <Award className="h-8 w-8 text-primary mb-2" />

            <CardTitle>Unified Member Graph</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              A living model that understands relationships across chapters, forums, networks,
              industries, and interests.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/search")}
        >
          <CardHeader>
            <Search className="h-8 w-8 text-primary mb-2" />

            <CardTitle>Advanced Search</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Multi-modal search across members, events, and content with intelligent
              recommendations and filters.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />

            <CardTitle>AI-Ready Architecture</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Secure, governed AI tools via MCP for safe LLM access, predictions, and agentic
              workflows.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <ClientOnly>
      <Home />
    </ClientOnly>
  );
}
