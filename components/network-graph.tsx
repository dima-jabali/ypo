"use client"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, FocusIcon } from "lucide-react"
import { NetworkGraphClient } from "./network-graph-client"
import { useStore } from "@/lib/store"
import { useProfileSimilarity } from "@/lib/hooks/use-profile-similarity"
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

  return { nodes, links }
}

function NodeInfoCard({ node }: { node: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Member Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
            {node.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("") || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{node.name}</p>
            {node.profile?.position && (
              <p className="text-xs text-muted-foreground truncate">{node.profile.position}</p>
            )}
            {node.profile?.current_company_name && (
              <p className="text-xs text-muted-foreground truncate">{node.profile.current_company_name}</p>
            )}
          </div>
        </div>

        {node.profile?.location && <div className="text-xs text-muted-foreground">📍 {node.profile.location}</div>}

        <div className="flex flex-wrap gap-2">
          {node.profile?.ypo_chapter && (
            <Badge variant="default" className="text-xs">
              {node.profile.ypo_chapter}
            </Badge>
          )}
          {node.profile?.ypo_industry && (
            <Badge variant="secondary" className="text-xs">
              {node.profile.ypo_industry}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EdgeInfoCard({ edge, graphData }: { edge: any; graphData: { nodes: GraphNode[]; links: GraphLink[] } }) {
  const sourceNode = graphData.nodes.find((node) => node.id === edge.source)
  const targetNode = graphData.nodes.find((node) => node.id === edge.target)
  const similarityScore = edge.similarity ? Math.round(edge.similarity * 100) : 0

  const sourceId = sourceNode ? Number(sourceNode.id) : null
  const targetId = targetNode ? Number(targetNode.id) : null

  const { data: similarityData, isLoading } = useProfileSimilarity(sourceId, targetId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connection Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Similarity Score */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <span className="text-sm font-medium">Similarity Score</span>
          <Badge variant="default" className="text-lg font-bold">
            {similarityScore}%
          </Badge>
        </div>

        {/* Source Node */}
        {sourceNode && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Member 1</p>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {sourceNode.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{sourceNode.name}</p>
                {sourceNode.profile?.position && (
                  <p className="text-xs text-muted-foreground truncate">{sourceNode.profile.position}</p>
                )}
                {sourceNode.profile?.current_company_name && (
                  <p className="text-xs text-muted-foreground truncate">{sourceNode.profile.current_company_name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Target Node */}
        {targetNode && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Member 2</p>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {targetNode.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{targetNode.name}</p>
                {targetNode.profile?.position && (
                  <p className="text-xs text-muted-foreground truncate">{targetNode.profile.position}</p>
                )}
                {targetNode.profile?.current_company_name && (
                  <p className="text-xs text-muted-foreground truncate">{targetNode.profile.current_company_name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Similarity Reasons */}
        {isLoading && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Loading similarity details...</p>
          </div>
        )}

        {similarityData?.similarity_reasons && (
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-semibold text-primary">{similarityData.similarity_reasons.title}</p>

            {similarityData.similarity_reasons.what_you_have_in_common && (
              <div className="space-y-1">
                <p className="text-xs font-medium">What you have in common</p>
                <p className="text-xs text-muted-foreground">
                  {similarityData.similarity_reasons.what_you_have_in_common}
                </p>
              </div>
            )}

            {similarityData.similarity_reasons.where_you_differ && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Where you differ</p>
                <p className="text-xs text-muted-foreground">{similarityData.similarity_reasons.where_you_differ}</p>
              </div>
            )}

            {similarityData.similarity_reasons.what_you_might_learn_from_each_other && (
              <div className="space-y-1">
                <p className="text-xs font-medium">What you might learn from each other</p>
                <p className="text-xs text-muted-foreground">
                  {similarityData.similarity_reasons.what_you_might_learn_from_each_other}
                </p>
              </div>
            )}

            {similarityData.similarity_reasons.how_you_might_be_helpful_to_each_other && (
              <div className="space-y-1">
                <p className="text-xs font-medium">How you might be helpful to each other</p>
                <p className="text-xs text-muted-foreground">
                  {similarityData.similarity_reasons.how_you_might_be_helpful_to_each_other}
                </p>
              </div>
            )}

            {similarityData.similarity_reasons.closing && (
              <p className="text-xs text-muted-foreground italic pt-1">{similarityData.similarity_reasons.closing}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function NetworkGraph() {
  const [selectedDepth, setSelectedDepth] = useState(3)
  const impersonatedProfileId = useStore((state) => state.impersonatedProfileId)
  const [focusedElement, setFocusedElement] = useState<{
    type: "node" | "edge"
    data: any
  } | null>(null)

  const handleFocusChange = (element: { type: "node" | "edge"; data: any } | null) => {
    setFocusedElement(element)
  }

  const graphData = useMemo(() => {
    const profiles = similarNodesData as Profile[]
    const userId = impersonatedProfileId || 2416
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
            <NetworkGraphClient
              graphData={graphData}
              currentUserId={impersonatedProfileId || 2416}
              onFocusChange={handleFocusChange}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {focusedElement ? (
            focusedElement.type === "node" ? (
              <NodeInfoCard node={focusedElement.data} />
            ) : (
              <EdgeInfoCard edge={focusedElement.data} graphData={graphData} />
            )
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FocusIcon className="h-4 w-4" />
                  Selected Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Click or hover over nodes and edges to see details here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <li>• Click on nodes to see details</li>
              <li>• Drag nodes to reposition</li>
              <li>• Click "Focus on Me" to center view</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
