"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Focus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfileSimilarity } from "@/lib/hooks/use-profile-similarity"

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
  onFocusChange?: (focusedElement: { type: "node" | "edge"; data: any } | null) => void
}

interface EdgeData {
  profileId1: number
  profileId2: number
  position: { x: number; y: number }
}

export function NetworkGraphClient({ graphData, currentUserId, onFocusChange }: NetworkGraphClientProps) {
  const [clickedNode, setClickedNode] = useState<GraphNode | null>(null)
  const [clickedEdge, setClickedEdge] = useState<EdgeData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const connectedNodesRef = useRef<Set<string>>(new Set())
  const router = useRouter()

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

  const handleClearSelection = () => {
    setClickedNode(null)
    setClickedEdge(null)
    onFocusChange?.(null)

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

  useEffect(() => {
    if (clickedNode) {
      onFocusChange?.({
        type: "node",
        data: clickedNode,
      })
    }
  }, [clickedNode, onFocusChange])

  useEffect(() => {
    if (clickedEdge) {
      onFocusChange?.({
        type: "edge",
        data: {
          profileId1: clickedEdge.profileId1,
          profileId2: clickedEdge.profileId2,
          isLoading: true,
        },
      })
    }
  }, [clickedEdge, onFocusChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedNode || clickedEdge) {
        handleClearSelection()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [clickedNode, clickedEdge])

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
        setClickedEdge(null)

        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const node = graphData.nodes.find((n) => n.id === nodeId)
          if (node) {
            setClickedNode(node)

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
          handleClearSelection()
        }
      })

      network.on("selectEdge", (params: any) => {
        if (params.edges.length > 0 && params.nodes.length === 0) {
          setClickedNode(null)
          const edgeId = params.edges[0]
          const edge = graphData.links[edgeId]

          if (edge) {
            const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
            const targetNode = graphData.nodes.find((n) => n.id === edge.target)

            if (sourceNode && targetNode) {
              const positions = network.getPositions([edge.source, edge.target])
              const sourcePos = positions[edge.source]
              const targetPos = positions[edge.target]
              const midPoint = {
                x: (sourcePos.x + targetPos.x) / 2,
                y: (sourcePos.y + targetPos.y) / 2,
              }

              setTimeout(() => {
                setClickedEdge({
                  profileId1: sourceNode.profile.id,
                  profileId2: targetNode.profile.id,
                  position: midPoint,
                })
              }, 0)
            }
          }
        }
      })

      network.on("hoverNode", (params: any) => {
        const nodeId = params.node
        const connectedNodes = network.getConnectedNodes(nodeId)
        const connectedEdges = network.getConnectedEdges(nodeId)
        const connectedNodeSet = new Set([nodeId, ...connectedNodes])
        const connectedEdgeSet = new Set(connectedEdges)

        const nodeUpdates = graphData.nodes.map((n) => ({
          id: n.id,
          opacity: connectedNodeSet.has(n.id) ? 1 : 0.5,
        }))
        nodes.update(nodeUpdates)

        const allEdgeIds = edges.getIds()
        const edgeUpdates = allEdgeIds.map((edgeId) => {
          const isConnected = connectedEdgeSet.has(edgeId as string)
          return {
            id: edgeId,
            color: isConnected ? "#3b82f6" : "#9ca3af80",
            width: isConnected ? 3 : undefined,
            opacity: isConnected ? 1 : 0.5,
          }
        })
        edges.update(edgeUpdates)
      })

      network.on("blurNode", () => {
        const nodeUpdates = graphData.nodes.map((n) => ({ id: n.id, opacity: 1 }))
        nodes.update(nodeUpdates)

        const allEdgeIds = edges.getIds()
        const edgeUpdates = allEdgeIds.map((edgeId) => {
          const originalEdge = graphData.links[edgeId as number]
          const similarity = originalEdge?.similarity || 0.5
          const width = 1 + (similarity - 0.7) * 10
          return {
            id: edgeId,
            color: "#9ca3af80",
            width: Math.max(1, Math.min(width, 4)),
            opacity: 1,
          }
        })
        edges.update(edgeUpdates)
      })

      network.on("hoverEdge", (params: any) => {
        const edgeId = params.edge
        const edge = graphData.links[edgeId]

        if (edge) {
          const connectedNodeSet = new Set([edge.source, edge.target])

          const nodeUpdates = graphData.nodes.map((n) => ({
            id: n.id,
            opacity: connectedNodeSet.has(n.id) ? 1 : 0.5,
          }))
          nodes.update(nodeUpdates)

          const allEdgeIds = edges.getIds()
          const edgeUpdates = allEdgeIds.map((id) => {
            const isHovered = id === edgeId
            return {
              id: id,
              color: isHovered ? "#3b82f6" : "#9ca3af80",
              width: isHovered ? 3 : undefined,
              opacity: isHovered ? 1 : 0.5,
            }
          })
          edges.update(edgeUpdates)
        }
      })

      network.on("blurEdge", () => {
        const nodeUpdates = graphData.nodes.map((n) => ({ id: n.id, opacity: 1 }))
        nodes.update(nodeUpdates)

        const allEdgeIds = edges.getIds()
        const edgeUpdates = allEdgeIds.map((edgeId) => {
          const originalEdge = graphData.links[edgeId as number]
          const similarity = originalEdge?.similarity || 0.5
          const width = 1 + (similarity - 0.7) * 10
          return {
            id: edgeId,
            color: "#9ca3af80",
            width: Math.max(1, Math.min(width, 4)),
            opacity: 1,
          }
        })
        edges.update(edgeUpdates)
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

      {clickedEdge && (
        <EdgeSimilarityFetcher
          profileId1={clickedEdge.profileId1}
          profileId2={clickedEdge.profileId2}
          onDataLoaded={(data) => {
            onFocusChange?.({
              type: "edge",
              data: {
                profileId1: clickedEdge.profileId1,
                profileId2: clickedEdge.profileId2,
                similarityScore: Math.round(data.similarity * 100),
                title: data.similarity_reasons.title,
                commonalities:
                  data.similarity_reasons.what_you_have_in_common
                    ?.split("\n")
                    .filter((line: string) => line.trim().startsWith("-"))
                    .slice(0, 3)
                    .map((line: string) => line.trim().substring(1).trim()) || [],
                isLoading: false,
              },
            })
          }}
        />
      )}
    </div>
  )
}

function EdgeSimilarityFetcher({
  profileId1,
  profileId2,
  onDataLoaded,
}: {
  profileId1: number
  profileId2: number
  onDataLoaded: (data: any) => void
}) {
  const { data, isLoading, error } = useProfileSimilarity(profileId1, profileId2)

  useEffect(() => {
    if (data && !isLoading && !error) {
      onDataLoaded(data)
    }
  }, [data, isLoading, error, onDataLoaded])

  return null
}
