"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OptimizedProfile {
  id: number
  name: string
  position: string | null
  company: string | null
  avatar: string | null
  chapter: string | null
  industry: string | null
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
}

export function NetworkGraphClient({ graphData }: NetworkGraphClientProps) {
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const connectedNodesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return

    const loadVisNetwork = async () => {
      const { Network } = await import("vis-network")
      const { DataSet } = await import("vis-data")

      const nodes = new DataSet(
        graphData.nodes.map((node) => ({
          id: node.id,
          label: `${node.name}\n${node.profile.chapter || ""}`,
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
          const opacity = 0.3 + (similarity - 0.7) * 1.67

          return {
            id: idx,
            from: link.source,
            to: link.target,
            color: {
              color: `rgba(99, 102, 241, ${Math.min(opacity, 0.8)})`,
              opacity: Math.min(opacity, 0.8),
            },
            width: Math.max(1, Math.min(width, 4)),
            arrows: {
              to: { enabled: false },
            },
            smooth: {
              type: "continuous",
            },
            opacity: Math.min(opacity, 0.8),
            title: `Similarity: ${(similarity * 100).toFixed(1)}%`,
          }
        }),
      )

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
            gravitationalConstant: -80000,
            centralGravity: 0.05,
            springLength: 800,
            springConstant: 0.004,
            damping: 0.3,
            avoidOverlap: 1,
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

      network.on("hoverNode", (params: any) => {
        const nodeId = params.node
        const node = graphData.nodes.find((n) => n.id === nodeId)
        if (node) {
          setHoveredNode(node)
          const canvasPosition = network.getPositions([nodeId])[nodeId]
          const DOMPosition = network.canvasToDOM(canvasPosition)
          setHoverPosition({ x: DOMPosition.x, y: DOMPosition.y })

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
          const edgeUpdates = allEdgeIds.map((edgeId) => ({
            id: edgeId,
            opacity: connectedEdgeSet.has(edgeId as string) ? 1 : 0.1,
          }))
          edges.update(edgeUpdates)
        }
      })

      network.on("blurNode", () => {
        setHoveredNode(null)
        connectedNodesRef.current.clear()

        const nodeUpdates = graphData.nodes.map((n) => ({ id: n.id, opacity: 1 }))
        nodes.update(nodeUpdates)

        const allEdgeIds = edges.getIds()
        const edgeUpdates = allEdgeIds.map((edgeId) => ({ id: edgeId, opacity: 1 }))
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
      <div ref={containerRef} className="w-full" />

      {hoveredNode && (
        <div
          className="absolute bg-popover border border-border rounded-lg shadow-xl p-3 pointer-events-none z-10"
          style={{
            left: hoverPosition.x,
            top: hoverPosition.y - 80,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-start gap-3 min-w-[240px]">
            <Avatar className="h-12 w-12 border-2">
              <AvatarImage src={hoveredNode.avatar || "/placeholder.svg"} alt={hoveredNode.name} />
              <AvatarFallback>
                {hoveredNode.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-0.5">{hoveredNode.profile.name}</p>
              <p className="text-xs text-muted-foreground truncate">{hoveredNode.profile.position}</p>
              <p className="text-xs text-muted-foreground truncate">{hoveredNode.profile.company}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
