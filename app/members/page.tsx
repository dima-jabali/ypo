"use client";

import type React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Building2, Globe, X } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles";
import type { ProfileSearchParams } from "@/lib/types/ypo-profile";
import { ClientOnly } from "@/components/client-only";

const CARD_HEIGHT = 390;
const ROW_GAP = 16;

function Members() {
  const [searchParams, setSearchParams] = useState<ProfileSearchParams>({
    limit: 100,
    offset: 0,
  });

  const { data, isLoading, error } = useYpoProfiles(searchParams);

  const members = useMemo(() => data?.results || [], [data]);

  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string | undefined>();
  const [chapterFilter, setChapterFilter] = useState<string | undefined>();
  const [countryFilter, setCountryFilter] = useState<string | undefined>();
  const [cityFilter, setCityFilter] = useState<string | undefined>();
  const [locationFilter, setLocationFilter] = useState<string | undefined>();
  const [positionFilter, setPositionFilter] = useState<string | undefined>();
  const [companyNameFilter, setCompanyNameFilter] = useState<string | undefined>();
  const [companyIndustryFilter, setCompanyIndustryFilter] = useState<string | undefined>();
  const [languagesFilter, setLanguagesFilter] = useState<string | undefined>();
  const [topicsFilter, setTopicsFilter] = useState<string | undefined>();
  const [hobbiesFilter, setHobbiesFilter] = useState<string | undefined>();
  const [interestsFilter, setInterestsFilter] = useState<string | undefined>();
  const [offsetFilter, setOffsetFilter] = useState(0);

  const timeoutToChangeSearchStringRef = useRef<NodeJS.Timeout>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const uniqueIndustries = useMemo(
    () => Array.from(new Set(members.map((m) => m.ypo_industry).filter(Boolean))).sort(),
    [members],
  );
  const uniqueChapters = useMemo(
    () => Array.from(new Set(members.map((m) => m.ypo_chapter).filter(Boolean))).sort(),
    [members],
  );
  const uniqueCountries = useMemo(
    () => Array.from(new Set(members.map((m) => m.country_code).filter(Boolean))).sort(),
    [members],
  );
  const uniqueCities = useMemo(
    () => Array.from(new Set(members.map((m) => m.city).filter(Boolean))).sort(),
    [members],
  );
  const uniqueLocations = useMemo(
    () => Array.from(new Set(members.map((m) => m.location).filter(Boolean))).sort(),
    [members],
  );
  const uniquePositions = useMemo(
    () => Array.from(new Set(members.map((m) => m.position).filter(Boolean))).sort(),
    [members],
  );
  const uniqueCompanyNames = useMemo(
    () => Array.from(new Set(members.map((m) => m.current_company_name).filter(Boolean))).sort(),
    [members],
  );
  const uniqueCompanyIndustries = useMemo(
    () =>
      Array.from(new Set(members.map((m) => m.current_company_industry).filter(Boolean))).sort(),
    [members],
  );
  const uniqueLanguages = useMemo(() => {
    const allLanguages = members.flatMap((m) => m.languages || []);
    return Array.from(new Set(allLanguages)).sort();
  }, [members]);
  const uniqueTopics = useMemo(() => {
    const allTopics = members.flatMap((m) => m.topics || []);
    return Array.from(new Set(allTopics)).sort();
  }, [members]);
  const uniqueHobbies = useMemo(() => {
    const allHobbies = members.flatMap((m) => m.hobbies || []);
    return Array.from(new Set(allHobbies)).sort();
  }, [members]);
  const uniqueInterests = useMemo(() => {
    const allInterests = members.flatMap((m) => m.interests || []);
    return Array.from(new Set(allInterests)).sort();
  }, [members]);

  useEffect(() => {
    setSearchParams({
      limit: 100,
      search_term: localSearchTerm || undefined,
      ypo_industry_filter: industryFilter,
      ypo_chapter_filter: chapterFilter,
      country_code_filter: countryFilter,
      city_filter: cityFilter,
      location_filter: locationFilter,
      position_filter: positionFilter,
      current_company_name_filter: companyNameFilter,
      current_company_industry_filter: companyIndustryFilter,
      languages_filter: languagesFilter,
      topics_filter: topicsFilter,
      hobbies_filter: hobbiesFilter,
      interests_filter: interestsFilter,
      offset: offsetFilter,
    });
  }, [
    localSearchTerm,
    offsetFilter,
    industryFilter,
    chapterFilter,
    countryFilter,
    cityFilter,
    locationFilter,
    positionFilter,
    companyNameFilter,
    companyIndustryFilter,
    languagesFilter,
    topicsFilter,
    hobbiesFilter,
    interestsFilter,
  ]);

  function handleChangeLocalSearch(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timeoutToChangeSearchStringRef.current);

    timeoutToChangeSearchStringRef.current = setTimeout(() => {
      setLocalSearchTerm(e.target.value);
    }, 500);
  }

  const clearAllFilters = () => {
    setLocalSearchTerm("");
    setIndustryFilter(undefined);
    setChapterFilter(undefined);
    setCountryFilter(undefined);
    setCityFilter(undefined);
    setLocationFilter(undefined);
    setPositionFilter(undefined);
    setCompanyNameFilter(undefined);
    setCompanyIndustryFilter(undefined);
    setLanguagesFilter(undefined);
    setTopicsFilter(undefined);
    setHobbiesFilter(undefined);
    setInterestsFilter(undefined);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const columnCount =
    typeof window !== "undefined"
      ? window.innerWidth >= 1024
        ? 3
        : window.innerWidth >= 768
          ? 2
          : 1
      : 3;
  const rowCount = Math.ceil(members.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    gap: ROW_GAP,
    overscan: 2,
  });

  const hasActiveFilters =
    localSearchTerm ||
    industryFilter ||
    chapterFilter ||
    countryFilter ||
    cityFilter ||
    locationFilter ||
    positionFilter ||
    companyNameFilter ||
    companyIndustryFilter ||
    languagesFilter ||
    topicsFilter ||
    hobbiesFilter ||
    interestsFilter;

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Member Directory</h1>
          <p className="text-muted-foreground">
            Search and connect with {data?.num_results || members.length}+ YPO members worldwide
          </p>
        </div>

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
                  ref={inputRef}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={industryFilter || ""}
                  onValueChange={(value) => setIndustryFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="YPO Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All YPO Industries</SelectItem>
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
                  value={chapterFilter || ""}
                  onValueChange={(value) => setChapterFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="YPO Chapter" />
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
                  value={countryFilter || ""}
                  onValueChange={(value) => setCountryFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map((country) =>
                      country ? (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={cityFilter || ""}
                  onValueChange={(value) => setCityFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map((city) =>
                      city ? (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={companyIndustryFilter || ""}
                  onValueChange={(value) => setCompanyIndustryFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Company Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Company Industries</SelectItem>
                    {uniqueCompanyIndustries.map((industry) =>
                      industry ? (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={positionFilter || ""}
                  onValueChange={(value) => setPositionFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    {uniquePositions.map((position) =>
                      position ? (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={companyNameFilter || ""}
                  onValueChange={(value) => setCompanyNameFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Company Name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {uniqueCompanyNames.map((company) =>
                      company ? (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={locationFilter || ""}
                  onValueChange={(value) => setLocationFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map((location) =>
                      location ? (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={languagesFilter || ""}
                  onValueChange={(value) => setLanguagesFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {uniqueLanguages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={topicsFilter || ""}
                  onValueChange={(value) => setTopicsFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={hobbiesFilter || ""}
                  onValueChange={(value) => setHobbiesFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hobbies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hobbies</SelectItem>
                    {uniqueHobbies.map((hobby) => (
                      <SelectItem key={hobby} value={hobby}>
                        {hobby}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={interestsFilter || ""}
                  onValueChange={(value) => setInterestsFilter(value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Interests" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Interests</SelectItem>
                    {uniqueInterests.map((interest) => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full bg-transparent"
                >
                  Clear All Filters
                </Button>
              )}

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {localSearchTerm && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {localSearchTerm}
                      <button
                        onClick={() => {
                          setLocalSearchTerm("");
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {industryFilter && (
                    <Badge variant="secondary" className="gap-1">
                      YPO Industry: {industryFilter}
                      <button
                        onClick={() => setIndustryFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {chapterFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Chapter: {chapterFilter}
                      <button
                        onClick={() => setChapterFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {countryFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Country: {countryFilter}
                      <button
                        onClick={() => setCountryFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {cityFilter && (
                    <Badge variant="secondary" className="gap-1">
                      City: {cityFilter}
                      <button
                        onClick={() => setCityFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Location: {locationFilter}
                      <button
                        onClick={() => setLocationFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {positionFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Position: {positionFilter}
                      <button
                        onClick={() => setPositionFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {companyNameFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Company: {companyNameFilter}
                      <button
                        onClick={() => setCompanyNameFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {companyIndustryFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Company Industry: {companyIndustryFilter}
                      <button
                        onClick={() => setCompanyIndustryFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {languagesFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Languages: {languagesFilter}
                      <button
                        onClick={() => setLanguagesFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {topicsFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Topics: {topicsFilter}
                      <button
                        onClick={() => setTopicsFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {hobbiesFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Hobbies: {hobbiesFilter}
                      <button
                        onClick={() => setHobbiesFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {interestsFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Interests: {interestsFilter}
                      <button
                        onClick={() => setInterestsFilter(undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Loading members..."
            ) : (
              <>
                Showing <strong>{members.length}</strong> members
              </>
            )}
          </p>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading members...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Error loading members. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && members.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No members found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && members.length > 0 && (
          <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIdx = virtualRow.index * columnCount;
                const rowMembers = members.slice(startIdx, startIdx + columnCount);

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      className="grid gap-6"
                      style={{
                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                        height: `${CARD_HEIGHT}px`,
                      }}
                    >
                      {rowMembers.map((member) => (
                        <Link key={member.id} href={`/members/${member.id}`}>
                          <Card
                            className="hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            style={{ height: `${CARD_HEIGHT}px` }}
                          >
                            <CardContent className="p-0 h-full flex flex-col">
                              <div className="relative h-20 bg-gradient-to-r from-primary/20 to-primary/10">
                                {member.banner_image && (
                                  <img
                                    src={member.banner_image || "/placeholder.svg"}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                )}
                                <Avatar className="absolute -bottom-10 left-4 h-20 w-20 border-4 border-background">
                                  <AvatarImage
                                    src={member.avatar || undefined}
                                    alt={member.name || "Member"}
                                  />
                                  <AvatarFallback>
                                    {member.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase() || "M"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>

                              <div className="pt-12 px-4 pb-4 flex-1 flex flex-col overflow-hidden">
                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                  {member.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                                  {member.position || "Position not specified"}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                  {member.current_company_name && (
                                    <>
                                      <Building2 className="h-3 w-3" />
                                      <span className="line-clamp-1">
                                        {member.current_company_name}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {member.about && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                                    {member.about}
                                  </p>
                                )}

                                <div className="mt-auto space-y-2">
                                  {member.location && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="line-clamp-1">{member.location}</span>
                                    </div>
                                  )}

                                  {member.ypo_chapter && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs truncate max-w-full"
                                    >
                                      {member.ypo_chapter}
                                    </Badge>
                                  )}

                                  {member.experience && member.experience.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {member.experience.slice(0, 2).map((exp, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs truncate max-w-[45%]"
                                        >
                                          {exp.company}
                                        </Badge>
                                      ))}
                                      {member.experience.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{member.experience.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MembersPage() {
  return (
    <ClientOnly>
      <Members />
    </ClientOnly>
  );
}
