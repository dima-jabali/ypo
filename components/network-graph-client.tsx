"use client"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Focus, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

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

export function NetworkGraphClient({ graphData, currentUserId }: NetworkGraphClientProps) {
  const [clickedNode, setClickedNode] = useState<GraphNode | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)
  const connectedNodesRef = useRef<Set<string>>(new Set())
  const router = useRouter()
  const popupRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleClosePopup()
      }
    }

    if (clickedNode) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [clickedNode])

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

      network.on("click", (params: any) => {
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
    </div>
  )
}
