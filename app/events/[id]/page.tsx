"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, useEvents, useMembers } from "@/lib/store";
import { MapPin, Calendar, Users, Sparkles, UserCheck, Target } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { generateRecommendations } from "@/lib/recommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const events = useStore(useEvents);
  const members = useStore(useMembers);
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <main className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event not found</p>
            <Link href="/events">
              <Button variant="link" className="mt-2">
                Back to Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const attendancePercentage = (event.attendees / event.capacity) * 100;

  const currentUser = members[0];

  const eventAttendees = members.filter(
    (m) =>
      m.recentEvents.some((e) => e.includes(event.city)) ||
      m.interests.some((i) => event.tags.includes(i)) ||
      m.expertise.some((e) =>
        event.tags.some((tag) => tag.toLowerCase().includes(e.toLowerCase())),
      ),
  );

  const recommendations = generateRecommendations(currentUser, eventAttendees, 12);
  const topRecommendations = recommendations.slice(0, 6);

  const previouslyMet = members
    .filter(
      (m) =>
        m.recentEvents.some((e) => currentUser.recentEvents.includes(e)) && m.id !== currentUser.id,
    )
    .slice(0, 4);

  const newConnections = recommendations
    .filter((r) => !previouslyMet.some((p) => p.id === r.member.id))
    .slice(0, 4);

  const similarEvents = events
    .filter(
      (e) =>
        e.id !== event.id &&
        (e.type === event.type || e.tags.some((tag) => event.tags.includes(tag))),
    )
    .slice(0, 3);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <Link href="/events">
        <Button variant="ghost" size="sm">
          ← Back to Events
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="relative h-64 md:h-96 w-full bg-muted">
              <Image
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={event.type === "GLC" ? "default" : "secondary"} className="text-sm">
                  {event.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{event.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{event.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  <p className="text-sm text-muted-foreground">{event.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium mb-2">Attendance</p>
                  <div className="space-y-2">
                    <Progress value={attendancePercentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {event.attendees.toLocaleString()} of {event.capacity.toLocaleString()}{" "}
                      registered ({Math.round(attendancePercentage)}% capacity)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topics & Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Event Intelligence</CardTitle>
              </div>
              <CardDescription>
                Smart insights to maximize your networking at this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recommended" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="recommended">People to Meet</TabsTrigger>
                  <TabsTrigger value="previous">Reconnect</TabsTrigger>
                </TabsList>

                <TabsContent value="recommended" className="mt-4 space-y-4">
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">
                        {newConnections.length} high-value connections identified for you
                      </p>
                    </div>
                    <div className="space-y-3">
                      {newConnections.map((rec) => (
                        <Link key={rec.member.id} href={`/members/${rec.member.id}`}>
                          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={rec.member.avatar || "/placeholder.svg"}
                                alt={rec.member.name}
                              />
                              <AvatarFallback>
                                {rec.member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{rec.member.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round((rec.score / 100) * 100)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {rec.member.title} at {rec.member.company}
                              </p>
                              {rec.reasons[0] && (
                                <p className="text-xs text-primary mt-1">
                                  {rec.reasons[0].type === "interest" && "🎯 "}
                                  {rec.reasons[0].type === "expertise" && "💼 "}
                                  {rec.reasons[0].type === "industry" && "🏢 "}
                                  {rec.reasons[0].value}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="previous" className="mt-4 space-y-4">
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">
                        {previouslyMet.length} people you've met before will be there
                      </p>
                    </div>
                    <div className="space-y-3">
                      {previouslyMet.map((member) => (
                        <Link key={member.id} href={`/members/${member.id}`}>
                          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <Avatar className="h-10 w-10">
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
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.title} at {member.company}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Previously met at:{" "}
                                {member.recentEvents.find((e) =>
                                  currentUser.recentEvents.includes(e),
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full mb-3" size="lg">
                Register for Event
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                Add to Calendar
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/50 to-accent/20 border-accent">
            <CardHeader>
              <CardTitle className="text-base">Networking Potential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Attendees</span>
                <span className="font-bold text-lg">{event.attendees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Your Matches</span>
                <span className="font-bold text-lg text-primary">{topRecommendations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Previous Connections</span>
                <span className="font-bold text-lg text-primary">{previouslyMet.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Match Score</span>
                <Badge variant="default" className="text-sm">
                  {Math.round((topRecommendations.length / event.attendees) * 100 * 1000)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Members to Meet</CardTitle>
              <CardDescription className="text-xs">Highest compatibility scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRecommendations.slice(0, 5).map((rec) => (
                <Link key={rec.member.id} href={`/members/${rec.member.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={rec.member.avatar || "/placeholder.svg"}
                        alt={rec.member.name}
                      />
                      <AvatarFallback>
                        {rec.member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">{rec.member.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((rec.score / 100) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{rec.member.company}</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Button variant="link" className="w-full text-xs">
                View All Attendees
              </Button>
            </CardContent>
          </Card>

          {similarEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Similar Events</CardTitle>
                <CardDescription className="text-xs">Based on type and topics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {similarEvents.map((similarEvent) => (
                  <Link key={similarEvent.id} href={`/events/${similarEvent.id}`}>
                    <div className="p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm leading-tight">
                          {similarEvent.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {similarEvent.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{similarEvent.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(similarEvent.date).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  Explore More Events
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
