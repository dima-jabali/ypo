"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Building2, Globe, X } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type Row,
} from "@tanstack/react-table"
import type { YpoProfile } from "@/lib/types/ypo-profile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import similarNodesData from "@/data/similar-nodes.json"
import { useVirtualizer } from "@tanstack/react-virtual"

const CARD_HEIGHT = 390
const ROW_GAP = 16

export default function MembersPage() {
  const members = useMemo(() => similarNodesData, [])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const timeoutToChangeSearchStringRef = useRef<NodeJS.Timeout>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const parentRef = useRef<HTMLDivElement>(null)

  const uniqueIndustries = useMemo(
    () => Array.from(new Set(members.map((m) => m.ypo_industry).filter(Boolean))).sort(),
    [members],
  )
  const uniqueChapters = useMemo(
    () => Array.from(new Set(members.map((m) => m.ypo_chapter).filter(Boolean))).sort(),
    [members],
  )
  const uniqueCountries = useMemo(
    () => Array.from(new Set(members.map((m) => m.country_code).filter(Boolean))).sort(),
    [members],
  )

  const industryFilter = columnFilters.find((f) => f.id === "ypo_industry")?.value as string | undefined
  const chapterFilter = columnFilters.find((f) => f.id === "ypo_chapter")?.value as string | undefined
  const countryFilter = columnFilters.find((f) => f.id === "country_code")?.value as string | undefined

  const globalFilterFn = (row: Row<YpoProfile>, columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase()
    const member = row.original

    return Boolean(
      member.name?.toLowerCase().includes(search) ||
        member.current_company_name?.toLowerCase().includes(search) ||
        member.about?.toLowerCase().includes(search) ||
        member.ypo_industry?.toLowerCase().includes(search) ||
        member.location?.toLowerCase().includes(search) ||
        member.ypo_chapter?.toLowerCase().includes(search) ||
        member.experience?.some((e) => e.company?.toLowerCase().includes(search)) ||
        member.interests?.some((i) => i.toLowerCase().includes(search)),
    )
  }

  const table = useReactTable({
    data: members,
    columns: [
      { accessorKey: "name", id: "name" },
      { accessorKey: "current_company_name", id: "current_company_name" },
      { accessorKey: "ypo_industry", id: "ypo_industry" },
      { accessorKey: "ypo_chapter", id: "ypo_chapter" },
      { accessorKey: "country_code", id: "country_code" },
    ],
    state: {
      columnFilters,
      globalFilter,
      sorting,
    },
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    globalFilterFn,
  })

  const setColumnFilter = (columnId: string, value: string | undefined) => {
    setColumnFilters((prev) => {
      const filtered = prev.filter((f) => f.id !== columnId)
      if (value) {
        return [...filtered, { id: columnId, value }]
      }
      return filtered
    })
  }

  const clearAllFilters = () => {
    setGlobalFilter("")
    setColumnFilters([])

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const filteredMembers = table.getRowModel().rows.map((row) => row.original)

  function handleChangeLocalSearch(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(timeoutToChangeSearchStringRef.current)

    timeoutToChangeSearchStringRef.current = setTimeout(() => {
      setGlobalFilter(e.target.value)
    }, 500)
  }

  const columnCount =
    typeof window !== "undefined" ? (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1) : 3
  const rowCount = Math.ceil(filteredMembers.length / columnCount)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT,
    gap: ROW_GAP,
    overscan: 2,
  })

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Member Directory</h1>

          <p className="text-muted-foreground">
            Search and connect with {filteredMembers.length}+ YPO members worldwide
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
                  onValueChange={(value) => setColumnFilter("ypo_industry", value || undefined)}
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
                  value={chapterFilter || ""}
                  onValueChange={(value) => setColumnFilter("ypo_chapter", value || undefined)}
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
                  value={countryFilter || ""}
                  onValueChange={(value) => setColumnFilter("country_code", value || undefined)}
                >
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2" />

                    <SelectValue placeholder="Location" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueCountries.map((city) =>
                      city ? (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>

                {(globalFilter || columnFilters.length > 0) && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>

              {columnFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {columnFilters.map((filter) => (
                    <Badge key={filter.id} variant="secondary" className="gap-1">
                      {filter.id}: {filter.value as string}
                      <button
                        onClick={() => setColumnFilter(filter.id, undefined)}
                        className="ml-1 hover:text-destructive"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{filteredMembers.length}</strong> members
          </p>
        </div>

        <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * columnCount
              const membersInRow = filteredMembers.slice(startIndex, startIndex + columnCount)

              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                    {membersInRow.map((member) => (
                      <Link href={`/members/${member.id}`} prefetch={false} key={member.id}>
                        <Card
                          className="hover:border-primary transition-colors cursor-pointer flex flex-col overflow-hidden"
                          style={{ height: `${CARD_HEIGHT}px` }}
                        >
                          <CardHeader className="flex-row items-start gap-3 space-y-0 pb-3 shrink-0">
                            <Avatar className="size-16 shrink-0">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name || ""} />

                              <AvatarFallback>
                                {member.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1 line-clamp-1">{member.name}</CardTitle>

                              <p className="text-sm text-muted-foreground line-clamp-2">{member.about}</p>

                              <p className="text-sm font-medium text-primary mt-1 line-clamp-1">
                                {member.ypo_industry}
                              </p>
                            </div>
                          </CardHeader>

                          <CardContent className="flex flex-col gap-2 pt-0 flex-1 min-h-0 overflow-hidden">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />

                              <span className="line-clamp-1">{member.location}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="size-3 shrink-0" />

                              <span className="line-clamp-1">{member.ypo_industry}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Globe className="size-3 shrink-0" />

                              <span className="line-clamp-1">{member.ypo_chapter}</span>
                            </div>

                            <div className="flex flex-wrap gap-1 overflow-hidden">
                              {member.experience?.slice(0, 3).map((exp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {exp.company}
                                </Badge>
                              ))}

                              {member.experience && member.experience.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{member.experience.length - 3}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {filteredMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-2">No members found matching your criteria.</p>

              <Button variant="link" onClick={clearAllFilters} className="mt-2">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
