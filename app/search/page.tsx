"use client";

import { useState } from "react";
import { Users, Calendar, BookOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useStore, useMembers, useEvents } from "@/lib/store";
import { ChatInterface } from "@/components/chat-interface";
import { ClientOnly } from "@/components/client-only";

export default function SearchPage() {
	const members = useStore(useMembers);
	const events = useStore(useEvents);

	// Member filters
	const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

	// Event filters
	const [selectedEventCities, setSelectedEventCities] = useState<string[]>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

	// Content filters
	const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
		[],
	);

	const uniqueCities = Array.from(
		new Set(members.flatMap((m) => m.travelPattern)),
	).sort();
	const uniqueIndustries = Array.from(
		new Set(members.map((m) => m.industry)),
	).sort();
	const uniqueChapters = Array.from(
		new Set(members.map((m) => m.chapter)),
	).sort();
	const eventCities = Array.from(new Set(events.map((e) => e.city))).sort();
	const eventTypes = ["GLC", "Forum", "Network", "Regional", "Chapter"];
	const contentTypes = ["Talk", "Article", "Podcast", "Video"];

	const toggleFilter = (
		value: string,
		selected: string[],
		setter: (v: string[]) => void,
	) => {
		setter(
			selected.includes(value)
				? selected.filter((v) => v !== value)
				: [...selected, value],
		);
	};

	const clearAllFilters = () => {
		setSelectedContentTypes([]);
		setSelectedEventCities([]);
		setSelectedIndustries([]);
		setSelectedEventTypes([]);
		setSelectedLocations([]);
		setSelectedChapters([]);
	};

	const hasActiveFilters =
		selectedIndustries.length > 0 ||
		selectedLocations.length > 0 ||
		selectedChapters.length > 0 ||
		selectedEventTypes.length > 0 ||
		selectedEventCities.length > 0 ||
		selectedContentTypes.length > 0;

	return (
		<ClientOnly>
			<main className="container mx-auto p-6">
				<div className="flex flex-col lg:flex-row gap-6">
					<aside className="w-full lg:w-72 space-y-4 lg:sticky lg:top-6 lg:self-start">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Filters</CardTitle>

									{hasActiveFilters && (
										<Button
											variant="ghost"
											size="sm"
											onClick={clearAllFilters}
											className="h-8 text-xs"
										>
											Clear All
										</Button>
									)}
								</div>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* Member Filters */}
								<div className="space-y-3">
									<h4 className="font-semibold text-sm flex items-center gap-2">
										<Users className="h-4 w-4" />
										Members
									</h4>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Industry
										</Label>

										<div className="space-y-2 max-h-40 simple-scrollbar">
											{uniqueIndustries.slice(0, 8).map((industry) => (
												<div
													className="flex items-center space-x-2"
													key={industry}
												>
													<Checkbox
														checked={selectedIndustries.includes(industry)}
														id={`industry-${industry}`}
														onCheckedChange={() =>
															toggleFilter(
																industry,
																selectedIndustries,
																setSelectedIndustries,
															)
														}
													/>

													<label
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
														htmlFor={`industry-${industry}`}
													>
														{industry}
													</label>
												</div>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Location
										</Label>

										<div className="space-y-2 max-h-40 simple-scrollbar">
											{uniqueCities.slice(0, 8).map((city) => (
												<div key={city} className="flex items-center space-x-2">
													<Checkbox
														checked={selectedLocations.includes(city)}
														id={`city-${city}`}
														onCheckedChange={() =>
															toggleFilter(
																city,
																selectedLocations,
																setSelectedLocations,
															)
														}
													/>

													<label
														htmlFor={`city-${city}`}
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
													>
														{city}
													</label>
												</div>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Chapter
										</Label>

										<div className="space-y-2 max-h-40 simple-scrollbar">
											{uniqueChapters.slice(0, 6).map((chapter) => (
												<div
													key={chapter}
													className="flex items-center space-x-2"
												>
													<Checkbox
														checked={selectedChapters.includes(chapter)}
														id={`chapter-${chapter}`}
														onCheckedChange={() =>
															toggleFilter(
																chapter,
																selectedChapters,
																setSelectedChapters,
															)
														}
													/>

													<label
														htmlFor={`chapter-${chapter}`}
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
													>
														{chapter}
													</label>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Event Filters */}
								<div className="space-y-3 pt-4 border-t">
									<h4 className="font-semibold text-sm flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										Events
									</h4>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Event Type
										</Label>

										<div className="space-y-2">
											{eventTypes.map((type) => (
												<div key={type} className="flex items-center space-x-2">
													<Checkbox
														checked={selectedEventTypes.includes(type)}
														id={`event-${type}`}
														onCheckedChange={() =>
															toggleFilter(
																type,
																selectedEventTypes,
																setSelectedEventTypes,
															)
														}
													/>

													<label
														htmlFor={`event-${type}`}
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
													>
														{type}
													</label>
												</div>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											City
										</Label>

										<div className="space-y-2 max-h-40 simple-scrollbar">
											{eventCities.slice(0, 8).map((city) => (
												<div key={city} className="flex items-center space-x-2">
													<Checkbox
														checked={selectedEventCities.includes(city)}
														id={`event-city-${city}`}
														onCheckedChange={() =>
															toggleFilter(
																city,
																selectedEventCities,
																setSelectedEventCities,
															)
														}
													/>

													<label
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
														htmlFor={`event-city-${city}`}
													>
														{city}
													</label>
												</div>
											))}
										</div>
									</div>
								</div>

								{/* Content Filters */}
								<div className="space-y-3 pt-4 border-t">
									<h4 className="font-semibold text-sm flex items-center gap-2">
										<BookOpen className="h-4 w-4" />
										Content
									</h4>

									<div className="space-y-2">
										<Label className="text-xs text-muted-foreground">
											Content Type
										</Label>

										<div className="space-y-2">
											{contentTypes.map((type) => (
												<div key={type} className="flex items-center space-x-2">
													<Checkbox
														checked={selectedContentTypes.includes(type)}
														id={`content-${type}`}
														onCheckedChange={() =>
															toggleFilter(
																type,
																selectedContentTypes,
																setSelectedContentTypes,
															)
														}
													/>

													<label
														className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
														htmlFor={`content-${type}`}
													>
														{type}
													</label>
												</div>
											))}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</aside>

					<div className="flex-1 min-w-0">
						<ChatInterface
							filters={{
								contentTypes: selectedContentTypes,
								eventCities: selectedEventCities,
								industries: selectedIndustries,
								eventTypes: selectedEventTypes,
								locations: selectedLocations,
								chapters: selectedChapters,
							}}
						/>
					</div>
				</div>
			</main>
		</ClientOnly>
	);
}
