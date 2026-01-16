"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useYpoProfilesByIds } from "@/lib/hooks/use-ypo-profiles-by-ids"
import { Loader2, Users } from "lucide-react"
import { YpoProfileCard } from "./ypo-profile-card"

interface YpoProfilesCarouselProps {
  profileIds: number[]
}

export function YpoProfilesCarousel({ profileIds }: YpoProfilesCarouselProps) {
  const { profiles, isLoading, isError } = useYpoProfilesByIds(profileIds)

  if (profileIds.length === 0) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading profiles...</span>
      </div>
    )
  }

  if (isError || profiles.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Relevant Members ({profiles.length})</span>
      </div>
      <div className="relative px-12">
        <Carousel
          opts={{
            align: "start",
            loop: profiles.length > 2,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {profiles.map((profile) => (
              <CarouselItem key={profile.id} className="pl-2 basis-full sm:basis-1/2 lg:basis-1/3">
                <YpoProfileCard profile={profile} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {profiles.length > 1 && (
            <>
              <CarouselPrevious className="-left-0" />
              <CarouselNext className="-right-0" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  )
}
