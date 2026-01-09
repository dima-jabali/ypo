"use client"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { TrendingUp } from "lucide-react"
import { NetworkGraphClient } from "./network-graph-client"
import { useStore } from "@/lib/store"
import similarNodesData from "@/data/similar-nodes.json"

interface Profile {
  id: number
  name: string
  position: string | null
  current_company_name: string | null
  avatar: string | null
  ypo_chapter: string | null
  similar_neighbors: Array<{
    id: number
    name: string
    similarity: number
  }>
}

interface GraphNode {
  id: string
  name: string
  profile: Profile
  avatar?: string
  depth: number
}

interface GraphLink {
  source: string
  target: string
  similarity: number
}

function buildDepthLimitedGraph(profiles: Profile[], startUserId: number, maxDepth: number) {
  const profilesMap = new Map(profiles.map((p) => [p.id, p]))
  const visitedNodes = new Map<number, number>() // id -> depth
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  const processedPairs = new Set<string>()

  // Start from user 2416
  const startProfile = profilesMap.get(startUserId)
  if (!startProfile) {
    console.log(`[v0] Start user ${startUserId} not found in data`)
    return { nodes, links }
  }

  // BFS to traverse the graph with depth limit
  const queue: Array<{ id: number; depth: number }> = [{ id: startUserId, depth: 0 }]
  visitedNodes.set(startUserId, 0)

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentProfile = profilesMap.get(current.id)

    if (!currentProfile) continue

    // Add current node
    nodes.push({
      id: String(current.id),
      name: currentProfile.name || "Unknown",
      profile: currentProfile,
      avatar: currentProfile.avatar || undefined,
      depth: current.depth,
    })

    // If we haven't reached max depth, explore neighbors
    if (current.depth < maxDepth && currentProfile.similar_neighbors) {
      currentProfile.similar_neighbors.forEach((neighbor) => {
        const neighborProfile = profilesMap.get(neighbor.id)
        if (!neighborProfile) return

        // Add edge
        const pairKey = [String(current.id), String(neighbor.id)].sort().join("-")
        if (!processedPairs.has(pairKey)) {
          links.push({
            source: String(current.id),
            target: String(neighbor.id),
            similarity: neighbor.similarity,
          })
          processedPairs.add(pairKey)
        }

        // Add neighbor to queue if not visited or found at a deeper level
        if (!visitedNodes.has(neighbor.id)) {
          visitedNodes.set(neighbor.id, current.depth + 1)
          queue.push({ id: neighbor.id, depth: current.depth + 1 })
        }
      })
    }
  }

  console.log(`[v0] Graph built: ${nodes.length} nodes, ${links.length} links`)
  return { nodes, links }
}

export function NetworkGraph() {
  const [selectedDepth, setSelectedDepth] = useState(3)
  const impersonatedProfileId = useStore((state) => state.impersonatedProfileId)

  const graphData = useMemo(() => {
    const profiles = similarNodesData as Profile[]
    const userId = impersonatedProfileId || 2416
    console.log(`[v0] Building depth-${selectedDepth} graph from user ${userId}`)
    return buildDepthLimitedGraph(profiles, userId, selectedDepth)
  }, [selectedDepth, impersonatedProfileId])

  const currentUserProfile = useMemo(() => {
    const profiles = similarNodesData as Profile[]
    return profiles.find((p) => p.id === (impersonatedProfileId || 2416))
  }, [impersonatedProfileId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">
            My Network {currentUserProfile?.name && `- ${currentUserProfile.name}`}
          </h1>
          <p className="text-muted-foreground mt-1">Showing connections up to {selectedDepth} degrees of separation</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Depth:</span>
          <div className="flex items-center gap-3 w-48">
            <Slider
              value={[selectedDepth]}
              onValueChange={(value) => setSelectedDepth(value[0])}
              min={1}
              max={8}
              step={1}
              className="flex-1"
            />
            <Badge variant="secondary" className="w-8 justify-center">
              {selectedDepth}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 border-2">
          <CardContent className="p-0">
            <NetworkGraphClient graphData={graphData} currentUserId={impersonatedProfileId || 2416} />
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
                <span className="text-sm text-muted-foreground">Depth Levels</span>
                <Badge variant="secondary">0-{selectedDepth}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• You are at the center</li>
                <li>• Depth 1: Your direct connections</li>
                <li>• Depth 2-3: Extended network</li>
                <li>• Hover over nodes for details</li>
                <li>• Drag nodes to reposition</li>
                <li>• Click "Focus on Me" to center view</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
