"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles"
import { ypoProfilesToMembers } from "@/lib/ypo-to-member-adapter"
import { useStore, useEvents } from "@/lib/store"
import { Users, Sparkles, TrendingUp, MapPin, Calendar, Heart } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { generateRecommendations, type Recommendation } from "@/lib/recommendations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMemo } from "react"

export default function ConnectionsPage() {
  const { data: ypoData, isLoading } = useYpoProfiles()
  const events = useStore(useEvents)

  const members = useMemo(() => {
    if (!ypoData?.pages) return []
    const allProfiles = ypoData.pages.flatMap((page) => page.results)
    return ypoProfilesToMembers(allProfiles)
  }, [ypoData])

  const currentUser = members[0]

  if (isLoading || members.length === 0) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading connections...</p>
          </div>
        </div>
      </main>
    )
  }

  const allRecommendations = generateRecommendations(currentUser, members, 20)

  const topRecommendations = allRecommendations.slice(0, 6)
  const interestBased = allRecommendations
    .filter((r) => r.reasons.some((reason) => reason.type === "interest" || reason.type === "expertise"))
    .slice(0, 4)
  const industryBased = allRecommendations
    .filter((r) => r.reasons.some((reason) => reason.type === "industry"))
    .slice(0, 4)
  const locationBased = allRecommendations
    .filter((r) => r.reasons.some((reason) => reason.type === "location" || reason.type === "travel"))
    .slice(0, 4)
  const lifestyleBased = allRecommendations
    .filter((r) => r.reasons.some((reason) => reason.type === "ceoDNA" || reason.type === "leadership"))
    .slice(0, 4)

  const ConnectionCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const { member, score, reasons, sharedAttributes } = recommendation

    return (
      <Link href={`/members/${member.id}`}>
        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-balance">{member.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((score / 100) * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{member.title}</p>
                <p className="text-sm font-medium text-primary mb-2">{member.company}</p>

                {/* Top reason */}
                {reasons[0] && (
                  <div className="mb-3 p-2 bg-accent/30 rounded-md">
                    <p className="text-xs font-medium text-foreground">
                      {reasons[0].type === "interest" && "🎯 Shared Interest: "}
                      {reasons[0].type === "expertise" && "💼 Shared Expertise: "}
                      {reasons[0].type === "industry" && "🏢 Same Industry: "}
                      {reasons[0].type === "location" && "📍 Same Location: "}
                      {reasons[0].type === "leadership" && "⭐ Similar Leadership: "}
                      {reasons[0].type === "network" && "🤝 Shared Network: "}
                      {reasons[0].type === "event" && "📅 Met at Event: "}
                      {reasons[0].type === "ceoDNA" && "❤️ Similar Lifestyle: "}
                      {reasons[0].type === "travel" && "✈️ Travel Overlap: "}
                      {reasons[0].value}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {sharedAttributes.slice(0, 3).map((attr, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {attr}
                    </Badge>
                  ))}
                  {sharedAttributes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{sharedAttributes.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <main className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recommended Connections</h1>
        <p className="text-muted-foreground">
          Discover YPO members you should connect with based on AI-powered recommendations
        </p>
      </div>

      {/* AI Insights Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Connections</CardTitle>
          </div>
          <CardDescription>
            Our unified member brain analyzes your profile, interests, expertise, and activity to surface the most
            valuable connections for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Similar Leadership DNA</p>
                <p className="text-xs text-muted-foreground">Members who share your leadership traits</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Complementary Expertise</p>
                <p className="text-xs text-muted-foreground">Skills that complement yours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Proximity-Based</p>
                <p className="text-xs text-muted-foreground">Members in your area or destinations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Lifestyle Match</p>
                <p className="text-xs text-muted-foreground">Similar wellness and hobbies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Top Recommendations For You</h2>
            <p className="text-sm text-muted-foreground">Highest match scores based on multiple factors</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topRecommendations.map((rec) => (
            <ConnectionCard key={rec.member.id} recommendation={rec} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Browse by Connection Type</CardTitle>
          <CardDescription>Explore recommendations categorized by what you have in common</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="interests" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="industry">Industry</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            </TabsList>

            <TabsContent value="interests" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interestBased.map((rec) => (
                  <ConnectionCard key={rec.member.id} recommendation={rec} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="industry" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industryBased.map((rec) => (
                  <ConnectionCard key={rec.member.id} recommendation={rec} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="location" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locationBased.map((rec) => (
                  <ConnectionCard key={rec.member.id} recommendation={rec} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lifestyle" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lifestyleBased.map((rec) => (
                  <ConnectionCard key={rec.member.id} recommendation={rec} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Event-Based Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Event-Based Connections</CardTitle>
          </div>
          <CardDescription>Connect with members attending the same upcoming events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => {
              const eventRecommendations = allRecommendations
                .filter((r) => r.reasons.some((reason) => reason.type === "event"))
                .slice(0, 3)

              return (
                <div key={event.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.city} • {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{event.attendees.toLocaleString()} attending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You have {eventRecommendations.length} recommended connections attending this event
                  </p>
                  <Link href={`/events/${event.id}`}>
                    <Button variant="outline" size="sm">
                      View Attendees
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
