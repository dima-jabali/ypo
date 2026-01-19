"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useYpoProfilesByIds } from "@/lib/hooks/use-ypo-profiles-by-ids";
import { Loader2, Users } from "lucide-react";
import { YpoProfileCard } from "./ypo-profile-card";

interface YpoProfilesCarouselProps {
  profileIds: number[];
}

export function YpoProfilesCarousel({ profileIds }: YpoProfilesCarouselProps) {
  const { profiles, isLoading, isError } = useYpoProfilesByIds(profileIds);

  if (profileIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />

        <span className="text-sm">Loading profiles...</span>
      </div>
    );
  }

  if (isError || profiles.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "center",
          loop: profiles.length > 2,
        }}
        orientation="vertical"
        className="w-full"
      >
        <CarouselContent className="">
          {profiles.map((profile) => (
            <CarouselItem key={profile.id} className="p-0 pt-2 basis-full sm:basis-1/2 lg:basis-1/3">
              <YpoProfileCard profile={profile} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {profiles.length > 1 && (
          <>
            <CarouselPrevious className="size-4" />

            <CarouselNext className="size-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
