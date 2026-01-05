"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYpoProfile } from "@/lib/hooks/use-ypo-profiles";
import {
  Award,
  Building2,
  Globe,
  Heart,
  Languages,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Plane,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function MemberDetailPage({ params }: { params: { id: string } }) {

  const { id } = params;
  const { data: profile, isLoading, error } = useYpoProfile(Number.parseInt(id));

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading member profile...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Member not found</p>
            <Link href="/members">
              <Button variant="link" className="mt-2">
                Back to Members
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const member = {
    id: profile.ypo_member_id.toString(),
    name:
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : "Unknown Member",
    title: profile.role_title || "Executive",
    company: profile.primary_organization || "Company",
    location: profile.country || "Unknown",
    industry: profile.primary_industry || "Other",
    chapter: profile.country || "Global",
    expertise: [profile.primary_industry || "General"].filter(Boolean),
    interests: [],
    avatar: "",
    bio: profile.role_title
      ? `${profile.role_title} at ${profile.primary_organization}`
      : "YPO Member",
    travelPattern: [profile.country || "Unknown"].filter(Boolean),
    socialScore: 75,
    yearsInYPO: 5,
    languages: ["English"],
    leadershipDNA: ["Visionary", "Innovative"],
    recentEvents: ["YPO Global Summit 2024"],
    networkMemberships: ["Tech Leaders Network"],
    linkedinBio: `${profile.role_title} at ${profile.primary_organization}`,
    ceoDNA: {
      health: ["Fitness", "Nutrition"],
      wellness: ["Meditation", "Work-Life Balance"],
      sports: ["Golf", "Tennis"],
      hobbies: ["Reading", "Travel"],
    },
    personalGoals: ["Expand business globally", "Mentor next generation leaders"],
    forumName: "Executive Forum",
    exitHistory: undefined,
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link href="/members">
        <Button variant="ghost" size="sm">
          ← Back to Members
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                  <AvatarFallback className="text-3xl">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
                    <p className="text-lg text-muted-foreground">{member.title}</p>
                    <p className="text-lg font-semibold text-primary">{member.company}</p>
                    {member.linkedinBio && (
                      <div className="mt-3 p-3 bg-accent/30 rounded-lg border border-accent/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Linkedin className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            LinkedIn
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{member.linkedinBio}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Connect
                    </Button>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Mail className="h-4 w-4" />
                      Message
                    </Button>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Heart className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
              {member.exitHistory && (
                <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Recent Exit</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.exitHistory}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {member.ceoDNA && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>CEO DNA</CardTitle>
                </div>
                <CardDescription>Personal interests, wellness, and lifestyle</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="health" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="health">Health</TabsTrigger>
                    <TabsTrigger value="wellness">Wellness</TabsTrigger>
                    <TabsTrigger value="sports">Sports</TabsTrigger>
                    <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
                  </TabsList>
                  <TabsContent value="health" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {member.ceoDNA.health?.map((item, idx) => (
                        <Badge key={idx} variant="default" className="gap-1">
                          <Heart className="h-3 w-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="wellness" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {member.ceoDNA.wellness?.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="sports" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {member.ceoDNA.sports?.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="hobbies" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {member.ceoDNA.hobbies?.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {member.personalGoals && member.personalGoals.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle>Goals & Aspirations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {member.personalGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Expertise & Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="default">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {member.interests.map((interest, idx) => (
                    <Badge key={idx} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Leadership DNA</h4>
                <div className="flex flex-wrap gap-2">
                  {member.leadershipDNA.map((trait, idx) => (
                    <Badge key={idx} variant="outline">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {member.recentEvents.map((event, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Award className="h-3 w-3" />
                    {event}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block mb-2">
                <div className="text-4xl font-bold text-primary">{member.socialScore}%</div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium mb-1">Connection Match</p>
              <p className="text-xs text-muted-foreground">Based on shared interests & location</p>
              <div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${member.socialScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{member.location}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm text-muted-foreground">{member.industry}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Chapter</p>
                  <p className="text-sm text-muted-foreground">{member.chapter}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Award className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Years in YPO</p>
                  <p className="text-sm text-muted-foreground">{member.yearsInYPO} years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {member.forumName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forum & Networks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Forum</p>
                  <Badge variant="default">{member.forumName}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Network Memberships</p>
                  <div className="flex flex-wrap gap-1">
                    {member.networkMemberships.map((network, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {member.languages.map((lang, idx) => (
                  <Badge key={idx} variant="outline">
                    <Languages className="h-3 w-3 mr-1" />
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Travel Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {member.travelPattern.map((city, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Plane className="h-3 w-3 text-muted-foreground" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
