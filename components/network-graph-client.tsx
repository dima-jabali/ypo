"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Focus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProfileSimilarity } from "@/lib/hooks/use-profile-similarity"
import { Network } from "vis-network"
import { DataSet } from "vis-data"

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
  onFocusChange: (element: { type: "node" | "edge"; data: any } | null) => void
}

function NetworkGraphClient({ graphData, currentUserId, onFocusChange }: NetworkGraphClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
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
    if (!containerRef.current) return

    const loadVisNetwork = async () => {
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

      const clickedNodeRef = { current: null as GraphNode | null }
      const clickedEdgeRef = { current: null as any | null }

      network.on("selectNode", (params: any) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          const node = graphData.nodes.find((n) => n.id === nodeId)
          if (node) {
            clickedEdgeRef.current = null
            clickedNodeRef.current = node
            const focusData = { type: "node" as const, data: node }
            onFocusChange(focusData)

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
            const edgeUpdates = allEdgeIds.map((id) => {
              const isConnected = connectedEdgeSet.has(id)
              return {
                id: id,
                color: isConnected ? "#3b82f6" : "#9ca3af0d",
                width: isConnected ? 3 : 1,
              }
            })
            edges.update(edgeUpdates)
          }
        }
      })

      network.on("selectEdge", (params: any) => {
        // Only process edge selection if no nodes were selected
        if (params.nodes.length === 0 && params.edges.length > 0) {
          const edgeId = params.edges[0]
          const edge = graphData.links[edgeId]

          if (edge) {
            const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
            const targetNode = graphData.nodes.find((n) => n.id === edge.target)

            if (sourceNode && targetNode) {
              clickedNodeRef.current = null
              clickedEdgeRef.current = { edgeId, ...edge }

              const connectedNodeSet = new Set([edge.source, edge.target])
              const nodeUpdates = graphData.nodes.map((n) => ({
                id: n.id,
                opacity: connectedNodeSet.has(n.id) ? 1 : 0.15,
              }))
              nodes.update(nodeUpdates)

              const allEdgeIds = edges.getIds()
              const edgeUpdates = allEdgeIds.map((id) => {
                const isSelected = id === edgeId
                return {
                  id: id,
                  color: isSelected ? "#3b82f6" : "#9ca3af0d",
                  width: isSelected ? 3 : 1,
                }
              })
              edges.update(edgeUpdates)

              const focusData = {
                type: "edge" as const,
                data: {
                  source: edge.source,
                  target: edge.target,
                  similarity: edge.similarity,
                },
              }
              onFocusChange(focusData)
            }
          }
        }
      })

      network.on("click", (params: any) => {
        if (params.nodes.length === 0 && params.edges.length === 0) {
          // Clicked on empty canvas - do nothing, keep current selection
          return
        }
      })

      network.on("hoverNode", (params: any) => {
        // Don't apply hover effects if something is already clicked
        if (clickedNodeRef.current || clickedEdgeRef.current) return

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
        // Don't reset if something is clicked
        if (clickedNodeRef.current || clickedEdgeRef.current) return

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
        // Don't apply hover effects if something is already clicked
        if (clickedNodeRef.current || clickedEdgeRef.current) return

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
        // Don't reset if something is clicked
        if (clickedNodeRef.current || clickedEdgeRef.current) return

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
  }, [graphData]) // Removed clickedNode and clickedEdge from dependencies to prevent rebuild

  return (
    <div className="relative bg-white rounded-lg">
      <div className="absolute top-4 right-4 z-20">
        <Button onClick={focusOnCurrentUser} size="sm" variant="secondary" className="shadow-lg">
          <Focus className="h-4 w-4 mr-2" />
          Focus on Me
        </Button>
      </div>

      <div ref={containerRef} className="w-full" />
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

export { NetworkGraphClient, EdgeSimilarityFetcher }
