"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { YpoProfile } from "@/lib/types/ypo-profile"

interface GraphNode {
  id: string
  name: string
  profile: YpoProfile
  avatar?: string
}

interface GraphLink {
  source: string
  target: string
  bidirectional?: boolean
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
          label: `${node.name}\n${node.profile.ypo_chapter || ""}`,
          title: node.name,
          shape: node.avatar ? "circularImage" : "circle",
          image: node.avatar || undefined,
          color: node.avatar
            ? undefined
            : {
                background: "#6366f1", // Single default color for all nodes
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

      const edgeMap = new Map<string, { from: string; to: string; count: number }>()

      graphData.links.forEach((link) => {
        const key1 = `${link.source}-${link.target}`
        const key2 = `${link.target}-${link.source}`

        if (edgeMap.has(key2)) {
          const existing = edgeMap.get(key2)!
          existing.count = 2
        } else {
          edgeMap.set(key1, { from: link.source, to: link.target, count: 1 })
        }
      })

      const edges = new DataSet(
        Array.from(edgeMap.values()).map((edge, idx) => {
          if (edge.count === 2) {
            // Bidirectional: arrows meet in the middle
            return {
              id: idx,
              from: edge.from,
              to: edge.to,
              color: { color: "rgba(0, 0, 0, 0.3)", opacity: 1 },
              width: 2,
              arrows: {
                to: { enabled: true, scaleFactor: 0.5 },
                middle: { enabled: false },
                from: { enabled: false },
              },
              smooth: {
                type: "continuous",
              },
              opacity: 1,
            }
          } else {
            // Unidirectional: single arrow from source to target
            return {
              id: idx,
              from: edge.from,
              to: edge.to,
              color: { color: "rgba(0, 0, 0, 0.25)", opacity: 1 },
              width: 1.5,
              arrows: {
                to: { enabled: true, scaleFactor: 0.6 },
              },
              smooth: {
                type: "continuous",
              },
              opacity: 1,
            }
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
            iterations: 300,
            updateInterval: 25,
            fit: true,
          },
          barnesHut: {
            gravitationalConstant: -15000, // Much stronger repulsion to push nodes far apart
            centralGravity: 0.01, // Very low central gravity to allow maximum spread
            springLength: 350, // Much longer spring length for more distance between connected nodes
            springConstant: 0.01, // Very weak springs to allow nodes to spread out
            damping: 0.2, // Higher damping for smoother settling
            avoidOverlap: 1, // Maximum overlap prevention
          },
        },
        interaction: {
          hover: true,
          dragNodes: true,
          dragView: true, // Enable panning by dragging the canvas
          zoomView: true, // Enable zoom with scroll wheel
          zoomSpeed: 0.5, // Moderate zoom speed
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

          // Get connected nodes efficiently
          const connectedNodes = network.getConnectedNodes(nodeId)
          const connectedNodeSet = new Set([nodeId, ...connectedNodes])
          connectedNodesRef.current = connectedNodeSet

          // Get connected edges
          const connectedEdges = network.getConnectedEdges(nodeId)
          const connectedEdgeSet = new Set(connectedEdges)

          // Batch update nodes - only update opacity property
          const nodeUpdates = graphData.nodes.map((n) => ({
            id: n.id,
            opacity: connectedNodeSet.has(n.id) ? 1 : 0.15,
          }))
          nodes.update(nodeUpdates)

          // Batch update edges - only update opacity property
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
              <p className="text-xs text-muted-foreground truncate">{hoveredNode.profile.current_company_name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
