"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Focus, ExternalLink, Sparkles, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfileSimilarity } from "@/lib/hooks/use-profile-similarity"
import { Badge } from "@/components/ui/badge"

interface OptimizedProfile {
  id: number
  name: string
  position: string | null
  company: string | null
  avatar: string | null
  ypo_chapter: string | null
  ypo_industry: string | null
  location: string | null
  neighbors: Array<{
    id: number
    similarity: number
  }>
}

interface GraphNode {
  id: string
  name: string
  profile: OptimizedProfile
  avatar?: string
}

interface GraphLink {
  source: string
  target: string
  similarity: number
}

interface NetworkGraphClientProps {
  graphData: { nodes: GraphNode[]; links: GraphLink[] }
  currentUserId: number
}

interface EdgeData {
  profileId1: number
  profileId2: number
  position: { x: number; y: number }
}

export function NetworkGraphClient({ graphData, currentUserId }: NetworkGraphClientProps) {
  const [clickedNode, setClickedNode] = useState<GraphNode | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [clickedEdge, setClickedEdge] = useState<EdgeData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const connectedNodesRef = useRef<Set<string>>(new Set())
  const router = useRouter()
  const popupRef = useRef<HTMLDivElement>(null)
  const edgePopupRef = useRef<HTMLDivElement>(null)

  const focusOnCurrentUser = () => {
    if (!networkRef.current) return

    const currentUserIdString = String(currentUserId)
    networkRef.current.focus(currentUserIdString, {
      scale: 1.5,
      animation: {
        duration: 1000,
        easingFunction: "easeInOutQuad",
      },
    })
  }

  const handleProfileClick = (profileId: number) => {
    router.push(`/members/${profileId}`)
  }

  const handleClosePopup = () => {
    setClickedNode(null)
    if (!networkRef.current) return

    const nodes = networkRef.current.body.data.nodes
    const edges = networkRef.current.body.data.edges

    const nodeUpdates = graphData.nodes.map((n) => ({ id: n.id, opacity: 1 }))
    nodes.update(nodeUpdates)

    const allEdgeIds = edges.getIds()
    const edgeUpdates = allEdgeIds.map((edgeId: any) => ({
      id: edgeId,
      color: "#9ca3af80",
    }))
    edges.update(edgeUpdates)

    connectedNodesRef.current.clear()
  }

  const handleCloseEdgePopup = () => {
    setClickedEdge(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleClosePopup()
      }
      if (edgePopupRef.current && !edgePopupRef.current.contains(event.target as Node)) {
        handleCloseEdgePopup()
      }
    }

    if (clickedNode || clickedEdge) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [clickedNode, clickedEdge])

  useEffect(() => {
    console.log("[v0] clickedEdge state changed:", clickedEdge)
  }, [clickedEdge])

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return

    const loadVisNetwork = async () => {
      const { Network } = await import("vis-network")
      const { DataSet } = await import("vis-data")

      const nodes = new DataSet(
        graphData.nodes.map((node) => ({
          id: node.id,
          label: `${node.name}\n${node.profile.ypo_chapter || ""}`,
          title: node.name,
          shape: node.avatar ? "circularImage" : "circle",
          image: node.avatar || undefined,
          color: node.avatar
            ? undefined
            : {
                background: "#6366f1",
                border: "#ffffff",
                highlight: {
                  background: "#6366f1",
                  border: "#ffffff",
                },
              },
          font: {
            color: "#333333",
            size: 11,
            face: "Inter, system-ui, sans-serif",
            multi: true,
            bold: {
              color: "#000000",
              size: 12,
            },
          },
          size: 35,
          borderWidth: 3,
          borderWidthSelected: 4,
          shapeProperties: {
            useBorderWithImage: true,
          },
          opacity: 1,
          data: node,
        })),
      )

      const edges = new DataSet(
        graphData.links.map((link, idx) => {
          const similarity = link.similarity || 0.5
          const width = 1 + (similarity - 0.7) * 10

          return {
            id: idx,
            from: link.source,
            to: link.target,
            color: "#9ca3af80",
            width: Math.max(1, Math.min(width, 4)),
            arrows: {
              to: { enabled: false },
            },
            smooth: {
              type: "continuous",
            },
            title: `Similarity: ${(similarity * 100).toFixed(1)}%`,
          }
        }),
      )

      const nodeCount = graphData.nodes.length
      const spacingMultiplier = nodeCount >= 50 ? 1.8 : nodeCount >= 30 ? 1.4 : 1

      const options = {
        nodes: {
          borderWidth: 3,
          borderWidthSelected: 4,
          color: {
            border: "#ffffff",
            highlight: {
              border: "#2563eb",
            },
          },
        },
        edges: {
          smooth: {
            type: "continuous",
            roundness: 0.5,
          },
        },
        layout: {
          randomSeed: 42,
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 1000,
            updateInterval: 25,
            fit: true,
          },
          barnesHut: {
            gravitationalConstant: -120000 * spacingMultiplier,
            centralGravity: 0.03 / spacingMultiplier,
            springLength: 150 * spacingMultiplier,
            springConstant: 0.002 / spacingMultiplier,
            damping: 0.3,
            avoidOverlap: 0.8,
          },
        },
        interaction: {
          hover: true,
          dragNodes: true,
          dragView: true,
          zoomView: true,
          zoomSpeed: 0.5,
          selectable: true,
        },
        height: "600px",
        width: "100%",
      }

      if (networkRef.current) {
        networkRef.current.destroy()
      }

      const network = new Network(containerRef.current, { nodes, edges }, options)
      networkRef.current = network

      network.on("click", (params: any) => {
        handleCloseEdgePopup()

        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const node = graphData.nodes.find((n) => n.id === nodeId)
          if (node) {
            setClickedNode(node)
            const canvasPosition = network.getPositions([nodeId])[nodeId]
            const DOMPosition = network.canvasToDOM(canvasPosition)
            setPopupPosition({ x: DOMPosition.x, y: DOMPosition.y })

            const connectedNodes = network.getConnectedNodes(nodeId)
            const connectedNodeSet = new Set([nodeId, ...connectedNodes])
            connectedNodesRef.current = connectedNodeSet

            const connectedEdges = network.getConnectedEdges(nodeId)
            const connectedEdgeSet = new Set(connectedEdges)

            const nodeUpdates = graphData.nodes.map((n) => ({
              id: n.id,
              opacity: connectedNodeSet.has(n.id) ? 1 : 0.15,
            }))
            nodes.update(nodeUpdates)

            const allEdgeIds = edges.getIds()
            const edgeUpdates = allEdgeIds.map((edgeId) => {
              const isConnected = connectedEdgeSet.has(edgeId as string)
              return {
                id: edgeId,
                color: isConnected ? "#3b82f6cc" : "#9ca3af0d",
              }
            })
            edges.update(edgeUpdates)
          }
        } else {
          handleClosePopup()
        }
      })

      network.on("selectEdge", (params: any) => {
        console.log("[v0] Edge selected:", params)

        if (params.edges.length > 0 && params.nodes.length === 0) {
          handleClosePopup()
          const edgeId = params.edges[0]
          const edge = graphData.links[edgeId]

          console.log("[v0] Edge data:", edge)
          console.log("[v0] Edge ID:", edgeId, "Links array length:", graphData.links.length)

          if (edge) {
            const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
            const targetNode = graphData.nodes.find((n) => n.id === edge.target)

            console.log("[v0] Source node:", sourceNode?.profile.id, sourceNode?.name)
            console.log("[v0] Target node:", targetNode?.profile.id, targetNode?.name)

            if (sourceNode && targetNode) {
              const positions = network.getPositions([edge.source, edge.target])
              const sourcePos = positions[edge.source]
              const targetPos = positions[edge.target]
              const midPoint = {
                x: (sourcePos.x + targetPos.x) / 2,
                y: (sourcePos.y + targetPos.y) / 2,
              }
              const DOMPosition = network.canvasToDOM(midPoint)

              console.log("[v0] Setting clicked edge with IDs:", sourceNode.profile.id, targetNode.profile.id)
              console.log("[v0] Position:", DOMPosition)

              setTimeout(() => {
                setClickedEdge({
                  profileId1: sourceNode.profile.id,
                  profileId2: targetNode.profile.id,
                  position: { x: DOMPosition.x, y: DOMPosition.y },
                })
              }, 0)
            }
          } else {
            console.log("[v0] Edge not found for edgeId:", edgeId)
          }
        }
      })

      network.on("stabilizationIterationsDone", () => {
        network.setOptions({ physics: { enabled: false } })
      })

      network.on("dragEnd", (params: any) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const position = network.getPositions([nodeId])[nodeId]
          nodes.update({ id: nodeId, x: position.x, y: position.y, fixed: { x: true, y: true } })
        }
      })
    }

    loadVisNetwork()

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, [graphData])

  return (
    <div className="relative bg-white rounded-lg">
      <div className="absolute top-4 right-4 z-20">
        <Button onClick={focusOnCurrentUser} size="sm" variant="secondary" className="shadow-lg">
          <Focus className="h-4 w-4 mr-2" />
          Focus on Me
        </Button>
      </div>

      <div ref={containerRef} className="w-full" />

      {clickedNode && (
        <div
          ref={popupRef}
          className="absolute bg-popover border border-border rounded-lg shadow-xl p-4 z-10"
          style={{
            left: popupPosition.x,
            top: popupPosition.y - 100,
            transform: "translateX(-50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 min-w-[320px]">
            <Avatar className="h-14 w-14 border-2">
              <AvatarImage src={clickedNode.avatar || "/placeholder.svg"} alt={clickedNode.name} />
              <AvatarFallback>
                {clickedNode.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-1">{clickedNode.profile.name}</p>

              {clickedNode.profile.position && (
                <p className="text-xs text-muted-foreground truncate mb-0.5">{clickedNode.profile.position}</p>
              )}

              {clickedNode.profile.company && (
                <p className="text-xs text-muted-foreground truncate mb-0.5">{clickedNode.profile.company}</p>
              )}

              {clickedNode.profile.location && (
                <p className="text-xs text-muted-foreground truncate mb-0.5">📍 {clickedNode.profile.location}</p>
              )}

              <div className="flex gap-2 mt-2 mb-3">
                {clickedNode.profile.ypo_chapter && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    {clickedNode.profile.ypo_chapter}
                  </span>
                )}

                {clickedNode.profile.ypo_industry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                    {clickedNode.profile.ypo_industry}
                  </span>
                )}
              </div>

              <Button size="sm" className="w-full" onClick={() => handleProfileClick(clickedNode.profile.id)}>
                <ExternalLink className="h-3 w-3 mr-2" />
                Visit Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {clickedEdge && (
        <EdgeSimilarityPopup
          profileId1={clickedEdge.profileId1}
          profileId2={clickedEdge.profileId2}
          position={clickedEdge.position}
          popupRef={edgePopupRef}
        />
      )}
    </div>
  )
}

function EdgeSimilarityPopup({
  profileId1,
  profileId2,
  position,
  popupRef,
}: {
  profileId1: number
  profileId2: number
  position: { x: number; y: number }
  popupRef: React.RefObject<HTMLDivElement>
}) {
  const { data, isLoading, error } = useProfileSimilarity(profileId1, profileId2)

  console.log("[v0] EdgeSimilarityPopup rendering with:", {
    profileId1,
    profileId2,
    position,
    isLoading,
    hasData: !!data,
    error,
  })

  if (error) {
    console.log("[v0] EdgeSimilarityPopup error:", error)
    return null
  }

  const scorePercentage = data ? Math.round(data.similarity * 100) : 0
  console.log("[v0] EdgeSimilarityPopup rendering UI, score:", scorePercentage)

  return (
    <div
      ref={popupRef}
      className="absolute bg-popover border border-border rounded-lg shadow-xl p-4 z-10 max-w-md"
      style={{
        left: position.x,
        top: position.y - 120,
        transform: "translateX(-50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 min-w-[280px] py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading similarity...</span>
        </div>
      ) : data ? (
        <div className="min-w-[320px] max-w-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Connection Strength</span>
            </div>
            <Badge variant="default" className="text-lg font-bold">
              {scorePercentage}%
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{data.similarity_reasons.title}</p>

          {data.similarity_reasons.what_you_have_in_common && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground mb-2">What they have in common:</p>
              <ul className="space-y-1.5">
                {data.similarity_reasons.what_you_have_in_common
                  .split("\n")
                  .filter((line) => line.trim().startsWith("-"))
                  .slice(0, 3)
                  .map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground leading-tight">
                        {line.trim().substring(1).trim()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
