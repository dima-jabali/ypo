"use client";

import { useYpoProfilesByIds } from "@/lib/hooks/use-ypo-profiles-by-ids";
import { Loader2 } from "lucide-react";
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

	return profiles.map((profile) => <YpoProfileCard profile={profile} key={profile.id} />);
}
