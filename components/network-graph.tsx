"use client";

import type React from "react";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStore, useMembers, type Member } from "@/lib/store";
import { Search, Users, TrendingUp, MapPin, Briefcase, Filter } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkNode {
  id: string;
  member: Member;
  x: number;
  y: number;
  z: number;
  radius: number;
  connections: string[];
  cluster: string;
  color: string;
}

interface NetworkLink {
  source: string;
  target: string;
  strength: number;
  type: string;
}

const COLORS = {
  technology: "#3b82f6",
  finance: "#10b981",
  healthcare: "#8b5cf6",
  retail: "#f59e0b",
  manufacturing: "#ef4444",
  services: "#ec4899",
  default: "#6366f1",
};

export function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();

  const members = useStore(useMembers);

  // Build network graph
  useEffect(() => {
    if (members.length === 0) return;

    // Create nodes with clustering by industry
    const networkNodes: NetworkNode[] = members.map((member, index) => {
      const angle = (index / members.length) * Math.PI * 2;
      const radius = 250;
      const cluster = member.industry.toLowerCase();

      return {
        id: member.id,
        member,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 100,
        radius: 8 + (member.socialScore || 0) / 10,
        connections: [],
        cluster,
        color: COLORS[cluster as keyof typeof COLORS] || COLORS.default,
      };
    });

    // Build connections
    const networkLinks: NetworkLink[] = [];

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const m1 = members[i];
        const m2 = members[j];
        let strength = 0;
        const types: string[] = [];

        // Calculate connection strength
        if (m1.industry === m2.industry) {
          strength += 3;
          types.push("industry");
        }
        if (m1.location === m2.location) {
          strength += 2;
          types.push("location");
        }
        const sharedInterests = m1.interests.filter((i) => m2.interests.includes(i));
        if (sharedInterests.length > 0) {
          strength += sharedInterests.length;
          types.push("interests");
        }
        const sharedNetworks = m1.networkMemberships.filter((n) =>
          m2.networkMemberships.includes(n),
        );
        if (sharedNetworks.length > 0) {
          strength += sharedNetworks.length * 2;
          types.push("network");
        }

        // Only create link if connection strength is significant
        if (strength >= 3) {
          networkLinks.push({
            source: m1.id,
            target: m2.id,
            strength,
            type: types[0],
          });

          networkNodes[i].connections.push(m2.id);
          networkNodes[j].connections.push(m1.id);
        }
      }
    }

    setNodes(networkNodes);
    setLinks(networkLinks);
  }, [members]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Auto-rotate
      setRotation((r) => r + 0.003);

      // Apply 3D rotation
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      // Sort nodes by z-depth for proper rendering
      const sortedNodes = [...nodes].sort((a, b) => {
        const az = a.z * cos - a.x * sin;
        const bz = b.z * cos - b.x * sin;
        return az - bz;
      });

      // Draw links
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source);
        const target = nodes.find((n) => n.id === link.target);

        if (source && target) {
          // Apply 3D rotation
          const sx = source.x * cos - source.z * sin;
          const sy = source.y;
          const tx = target.x * cos - target.z * sin;
          const ty = target.y;

          ctx.beginPath();
          ctx.moveTo(centerX + sx, centerY + sy);
          ctx.lineTo(centerX + tx, centerY + ty);

          const alpha = Math.max(0.05, link.strength / 10);
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = Math.sqrt(link.strength) * 0.5;
          ctx.stroke();
        }
      });

      // Draw nodes
      sortedNodes.forEach((node) => {
        const x = node.x * cos - node.z * sin;
        const y = node.y;
        const z = node.z * cos + node.x * sin;

        // Scale based on depth
        const scale = 1 - z / 1000;
        const radius = node.radius * scale;

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isHighlighted =
          selectedNode &&
          (selectedNode.id === node.id || selectedNode.connections.includes(node.id));

        // Apply search filter
        const matchesSearch =
          searchQuery === "" ||
          node.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.member.company.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterType === "all" || node.cluster === filterType.toLowerCase();

        if (!matchesSearch || !matchesFilter) {
          ctx.globalAlpha = 0.1;
        } else {
          ctx.globalAlpha = 1;
        }

        // Glow effect for selected/hovered
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(centerX + x, centerY + y, radius + 8, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            centerX + x,
            centerY + y,
            radius,
            centerX + x,
            centerY + y,
            radius + 8,
          );
          gradient.addColorStop(0, `${node.color}60`);
          gradient.addColorStop(1, `${node.color}00`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(centerX + x, centerY + y, radius, 0, Math.PI * 2);

        // Gradient fill
        const nodeGradient = ctx.createRadialGradient(
          centerX + x - radius / 3,
          centerY + y - radius / 3,
          0,
          centerX + x,
          centerY + y,
          radius,
        );
        nodeGradient.addColorStop(0, `${node.color}ff`);
        nodeGradient.addColorStop(1, `${node.color}cc`);
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected || isHovered ? "#ffffff" : `${node.color}ff`;
        ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1;

        // Draw name for selected/hovered
        if ((isSelected || isHovered) && matchesSearch && matchesFilter) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px system-ui";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 4;
          ctx.fillText(node.member.name, centerX + x, centerY + y - radius - 10);
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, links, rotation, selectedNode, hoveredNode, searchQuery, filterType]);

  // Mouse interaction
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - canvas.width / 2;
      const mouseY = e.clientY - rect.top - canvas.height / 2;

      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      // Find clicked node
      const clickedNode = nodes.find((node) => {
        const x = node.x * cos - node.z * sin;
        const y = node.y;
        const z = node.z * cos + node.x * sin;
        const scale = 1 - z / 1000;
        const radius = node.radius * scale;

        const dx = x - mouseX;
        const dy = y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < radius;
      });

      setSelectedNode(clickedNode || null);
    },
    [nodes, rotation],
  );

  const handleCanvasHover = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - canvas.width / 2;
      const mouseY = e.clientY - rect.top - canvas.height / 2;

      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const hoveredNode = nodes.find((node) => {
        const x = node.x * cos - node.z * sin;
        const y = node.y;
        const z = node.z * cos + node.x * sin;
        const scale = 1 - z / 1000;
        const radius = node.radius * scale;

        const dx = x - mouseX;
        const dy = y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) < radius;
      });

      setHoveredNode(hoveredNode || null);
    },
    [nodes, rotation],
  );

  // Get unique industries
  const industries = Array.from(new Set(members.map((m) => m.industry)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Member Network Graph</h1>
          <p className="text-muted-foreground mt-1">
            Explore connections across the YPO global network
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Graph */}
        <Card className="lg:col-span-3 border-2">
          <CardContent className="p-6">
            <canvas
              ref={canvasRef}
              width={900}
              height={600}
              className="w-full h-[600px] rounded-lg bg-gradient-to-br from-slate-950 to-slate-900 cursor-pointer"
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasHover}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Network Stats */}
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
                <Badge variant="secondary">{nodes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connections</span>
                <Badge variant="secondary">{links.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Connections</span>
                <Badge variant="secondary">
                  {nodes.length > 0 ? ((links.length * 2) / nodes.length).toFixed(1) : 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Industries</span>
                <Badge variant="secondary">{industries.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Industry Clusters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(COLORS)
                .filter(([key]) => key !== "default")
                .map(([industry, color]) => (
                  <div key={industry} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs capitalize">{industry}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Selected Member */}
          {selectedNode && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Selected Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage
                      src={selectedNode.member.avatar || "/placeholder.svg"}
                      alt={selectedNode.member.name}
                    />
                    <AvatarFallback className="bg-primary/10">
                      {selectedNode.member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{selectedNode.member.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedNode.member.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedNode.member.company}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span>{selectedNode.member.industry}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{selectedNode.member.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{selectedNode.connections.length} connections</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedNode.member.interests.slice(0, 3).map((interest) => (
                    <Badge key={interest} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>

                <Link href={`/members/${selectedNode.member.id}`}>
                  <Button size="sm" className="w-full">
                    View Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to Navigate</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Click on any node to view member details</li>
                <li>• Use search to find specific members</li>
                <li>• Filter by industry to focus on sectors</li>
                <li>• Node size indicates social influence</li>
                <li>• Lines show connection strength</li>
                <li>• Graph rotates automatically for 3D effect</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
