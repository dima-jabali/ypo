"use client"

import { useState } from "react"
import { Check, ChevronDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function ProfileSelector() {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useYpoProfiles()
  const { selectedYpoProfileId, setSelectedYpoProfileId } = useStore()

  const profiles = data?.pages.flatMap((page) => page.results) ?? []

  const selectedProfile = profiles.find((p) => p.id === selectedYpoProfileId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent" aria-label="Select profile">
          <User className="h-4 w-4" />
          {selectedProfile?.personal_info?.name ? (
            <span className="max-w-[120px] truncate">{selectedProfile.personal_info.name.split(" ")[0]}</span>
          ) : (
            <span>Select Profile</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="end">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Switch Profile</div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">Loading profiles...</div>
            ) : profiles.length > 0 ? (
              profiles.map((profile) => {
                if (!profile.personal_info?.name) return null

                const isSelected = profile.id === selectedYpoProfileId
                const initials = profile.personal_info.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()

                return (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSelectedYpoProfileId(profile.id)
                      setOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left",
                      isSelected && "bg-accent",
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.personal_info.name} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{profile.personal_info.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {profile.chapter?.name || "No chapter"}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">No profiles available</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
