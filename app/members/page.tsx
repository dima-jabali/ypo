"use client";

import { Building2, Globe, Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles";
import { useCurrentLocation, useSelectedFilters, useStore } from "@/lib/store";

export default function MembersPage() {
	const [localSearch, setLocalSearch] = useState("");

	const timeoutToChangeSearchStringRef = useRef<NodeJS.Timeout>(undefined);

	const selectedFilters = useStore(useSelectedFilters);
	const currentLocation = useStore(useCurrentLocation);
	const { data, isLoading, error } = useYpoProfiles();
	const { setSelectedFilters } = useStore();

	const { members, uniqueChapters, uniqueCities, uniqueIndustries } =
		useMemo(() => {
			const members = data?.pages.flatMap((m) => m.results) || [];
			const uniqueIndustries = Array.from(
				new Set(members.map((m) => m.ypo_industry)),
			);
			const uniqueChapters = Array.from(
				new Set(members.map((m) => m.ypo_chapter)),
			);
			const uniqueCities = Array.from(new Set(members.flatMap((m) => m.city)));

			return {
				uniqueIndustries,
				uniqueChapters,
				uniqueCities,
				members,
			};
		}, [data]);

	if (isLoading) {
		return (
			<main className="container mx-auto p-6">
				<Card>
					<CardContent className="py-12 flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />

						<p className="text-muted-foreground">Loading members from API...</p>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (error) {
		return (
			<main className="container mx-auto p-6">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-destructive mb-2">
							Error loading members: {error.message}
						</p>
						<Button variant="outline" onClick={() => window.location.reload()}>
							Retry
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	function handleChangeLocalSearch(e: React.ChangeEvent<HTMLInputElement>) {
		clearTimeout(timeoutToChangeSearchStringRef.current);

		timeoutToChangeSearchStringRef.current = setTimeout(() => {
			setLocalSearch(e.target.value);
		}, 500);
	}

	return (
		<main className="container mx-auto p-6 space-y-6">
			<div className="flex flex-col gap-4">
				<div>
					<h1 className="text-3xl font-bold mb-2">Member Directory</h1>
					<p className="text-muted-foreground">
						Search and connect with {members.length}+ YPO members worldwide
					</p>
				</div>

				{currentLocation && (
					<Card className="bg-primary/5 border-primary/20">
						<CardContent className="flex items-center gap-2 py-3">
							<MapPin className="h-4 w-4 text-primary" />
							<span className="text-sm">
								Showing members in or traveling to{" "}
								<strong>{currentLocation}</strong>
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									useStore.getState().setCurrentLocation(undefined)
								}
								className="ml-auto"
							>
								Clear
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Search and Filters */}
				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by name, company, expertise, or industry..."
									onChange={handleChangeLocalSearch}
									className="pl-9"
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
								<Select
									value={selectedFilters.industry || ""}
									onValueChange={(value) =>
										setSelectedFilters({
											...selectedFilters,
											industry: value || undefined,
										})
									}
								>
									<SelectTrigger>
										<Building2 className="h-4 w-4 mr-2" />

										<SelectValue placeholder="Industry" />
									</SelectTrigger>

									<SelectContent>
										<SelectItem value="all">All Industries</SelectItem>

										{uniqueIndustries.map((industry) =>
											industry ? (
												<SelectItem key={industry} value={industry}>
													{industry}
												</SelectItem>
											) : null,
										)}
									</SelectContent>
								</Select>

								<Select
									value={selectedFilters.chapter || ""}
									onValueChange={(value) =>
										setSelectedFilters({
											...selectedFilters,
											chapter: value || undefined,
										})
									}
								>
									<SelectTrigger>
										<Globe className="h-4 w-4 mr-2" />
										<SelectValue placeholder="Chapter" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Chapters</SelectItem>
										{uniqueChapters.map((chapter) =>
											chapter ? (
												<SelectItem key={chapter} value={chapter}>
													{chapter}
												</SelectItem>
											) : null,
										)}
									</SelectContent>
								</Select>

								<Select
									value={selectedFilters.location || ""}
									onValueChange={(value) =>
										setSelectedFilters({
											...selectedFilters,
											location: value || undefined,
										})
									}
								>
									<SelectTrigger>
										<MapPin className="h-4 w-4 mr-2" />
										<SelectValue placeholder="Location" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Locations</SelectItem>
										{uniqueCities.map((city) =>
											city ? (
												<SelectItem key={city} value={city}>
													{city}
												</SelectItem>
											) : null,
										)}
									</SelectContent>
								</Select>

								<Button
									variant="outline"
									onClick={() => {
										setSelectedFilters({});
										setLocalSearch("");
									}}
								>
									Clear Filters
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Results Count */}
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Showing <strong>{members.length}</strong> members
					</p>
				</div>

				{/* Members Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{members.map((member) => (
						<Link key={member.id} href={`/members/${member.id}`}>
							<Card className="h-full hover:border-primary transition-colors cursor-pointer grid grid-rows-2 gap-2">
								<CardHeader className="flex items-start gap-3 h-fit">
									<Avatar className="size-16">
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
										<CardTitle className="text-lg mb-1">
											{member.name}
										</CardTitle>

										<p className="text-sm text-muted-foreground">
											{member.about}
										</p>

										<p className="text-sm font-medium text-primary">
											{member.ypo_industry}
										</p>
									</div>
								</CardHeader>

								<CardContent className="flex flex-col gap-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<MapPin className="size-3" />

										<span>{member.location}</span>
									</div>

									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Building2 className="size-3" />

										<span>{member.ypo_industry}</span>
									</div>

									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Globe className="size-3" />

										<span>{member.ypo_chapter}</span>
									</div>

									<div className="flex flex-wrap gap-1">
										{member.experience?.slice(0, 3).map((exp, idx) => (
											<Badge key={idx} variant="secondary" className="text-xs whitespace-pre-wrap">
												{exp.company}
											</Badge>
										))}
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>

				{members.length === 0 && (
					<Card>
						<CardContent className="py-12 text-center">
							<p className="text-muted-foreground">
								No members found matching your criteria.
							</p>

							<Button
								className="mt-2"
								variant="link"
								onClick={() => {
									setSelectedFilters({});
									setLocalSearch("");
								}}
							>
								Clear all filters
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</main>
	);
}
