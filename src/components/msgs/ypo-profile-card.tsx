"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { YpoProfile } from "@/lib/types/ypo-profile"
import { Building2, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface YpoProfileCardProps {
  profile: YpoProfile
}

export function YpoProfileCard({ profile }: YpoProfileCardProps) {
  const router = useRouter()

  const handleProfileClick = () => {
    router.push(`/members/${profile.id}`)
  }

  const initials =
    profile.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "?"

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={profile.avatar || undefined} alt={profile.name || ""} />
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile.name}</p>
            {profile.position && <p className="text-xs text-muted-foreground truncate">{profile.position}</p>}
            {profile.current_company_name && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="h-3 w-3 shrink-0" />
                {profile.current_company_name}
              </p>
            )}
          </div>
        </div>

        {(profile.city || profile.location) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {profile.city && profile.location
                ? `${profile.city}, ${profile.location}`
                : profile.city || profile.location}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {profile.ypo_chapter && (
            <Badge variant="default" className="text-xs">
              {profile.ypo_chapter}
            </Badge>
          )}
          {profile.ypo_industry && (
            <Badge variant="secondary" className="text-xs">
              {profile.ypo_industry}
            </Badge>
          )}
        </div>

        <Button className="w-full" size="sm" onClick={handleProfileClick}>
          View Profile
        </Button>
      </CardContent>
    </Card>
  )
}
