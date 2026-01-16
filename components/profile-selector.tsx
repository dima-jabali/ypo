"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Check, ChevronDown, User } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import profilesData from "@/data/similar-nodes.json";

export function ProfileSelector() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const impersonatedProfileId = useStore((state) => state.impersonatedProfileId);
  const setImpersonatedProfileId = useStore((state) => state.setImpersonatedProfileId);

  const profiles = useMemo(() => {
    console.log("[v0] Loading profiles from JSON, count:", (profilesData as any[]).length);
    const validProfiles = (profilesData as any[]).filter((p) => p?.name);
    console.log("[v0] Valid profiles with names:", validProfiles.length);
    return validProfiles;
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter((profile) => {
      const name = profile.name?.toLowerCase() || "";
      const chapter = profile.ypo_chapter?.toLowerCase() || "";
      const company = profile.current_company_name?.toLowerCase() || "";
      return name.includes(query) || chapter.includes(query) || company.includes(query);
    });
  }, [profiles, searchQuery]);

  const selectedProfile = profiles.find((p) => p.id === impersonatedProfileId);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredProfiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rowVirtualizer.measure();
        });
      });
    }
  }, [open, rowVirtualizer]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          aria-label="Select profile"
        >
          <User className="h-4 w-4" />
          {selectedProfile?.name ? (
            <span className="max-w-[120px] truncate">{selectedProfile.name.split(" ")[0]}</span>
          ) : (
            <span>Select Profile</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="end">
        <div className="space-y-2">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Switch Profile ({profiles.length})
          </div>
          <div className="px-2">
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <div ref={parentRef} className="h-[400px] overflow-y-auto">
            {filteredProfiles.length > 0 ? (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const profile = filteredProfiles[virtualRow.index];
                  const isSelected = profile.id === impersonatedProfileId;
                  const initials = profile.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setImpersonatedProfileId(profile.id);
                        setOpen(false);
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left",
                        isSelected && "bg-accent",
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profile.avatar || "/placeholder.svg"}
                          alt={profile.name}
                        />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{profile.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {profile.ypo_chapter || profile.current_company_name || "No info"}
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {searchQuery ? "No profiles found" : "No profiles available"}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
