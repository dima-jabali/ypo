"use client"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles"
import { TrendingUp } from "lucide-react"
import type { YpoProfile } from "@/lib/types/ypo-profile"
import { NetworkGraphClient } from "./network-graph-client"

interface GraphNode {
  id: string
  name: string
  profile: YpoProfile
  avatar?: string
}

interface GraphLink {
  source: string
  target: string
}

export function NetworkGraph() {
  const { data, isLoading } = useYpoProfiles()

  const profiles = data?.pages.flatMap((page) => page.results) ?? []

  const graphData = useMemo(() => {
    if (!profiles.length) return { nodes: [], links: [] }

    const nodes: GraphNode[] = profiles.map((profile) => ({
      id: profile.id,
      name: profile.name || "Unknown",
      profile,
      avatar: profile.avatar || undefined,
    }))

    const relationshipMap = new Map<string, Set<string>>()

    for (let i = 0; i < profiles.length; i++) {
      const p1 = profiles[i]
      if (!relationshipMap.has(p1.id)) {
        relationshipMap.set(p1.id, new Set())
      }

      for (let j = i + 1; j < profiles.length; j++) {
        const p2 = profiles[j]

        let hasConnection = false

        if (p1.ypo_chapter === p2.ypo_chapter && p1.ypo_chapter) hasConnection = true
        if (p1.current_company_industry === p2.current_company_industry && p1.current_company_industry)
          hasConnection = true
        if (p1.location === p2.location && p1.location) hasConnection = true

        if (hasConnection) {
          relationshipMap.get(p1.id)!.add(p2.id)
          if (!relationshipMap.has(p2.id)) {
            relationshipMap.set(p2.id, new Set())
          }
          relationshipMap.get(p2.id)!.add(p1.id)
        }
      }
    }

    const links: GraphLink[] = []
    const processedPairs = new Set<string>()

    relationshipMap.forEach((targets, source) => {
      targets.forEach((target) => {
        const pairKey = [source, target].sort().join("-")
        if (!processedPairs.has(pairKey)) {
          const isBidirectional = relationshipMap.get(target)?.has(source)
          links.push({
            source,
            target,
          })
          processedPairs.add(pairKey)
        }
      })
    })

    return { nodes, links }
  }, [profiles])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-muted-foreground">Loading network graph...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Member Network Graph</h1>
          <p className="text-muted-foreground mt-1">Explore connections across the YPO global network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-2">
          <CardContent className="p-0">
            <NetworkGraphClient graphData={graphData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Network Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <Badge variant="secondary">{graphData.nodes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connections</span>
                <Badge variant="secondary">{graphData.links.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Connections</span>
                <Badge variant="secondary">
                  {graphData.nodes.length > 0 ? ((graphData.links.length * 2) / graphData.nodes.length).toFixed(1) : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Hover over nodes to see member details</li>
                <li>• Drag nodes to reposition them</li>
                <li>• Single arrow = one-way connection</li>
                <li>• Double arrow = two-way connection</li>
                <li>• Dragged nodes stay in new position</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
