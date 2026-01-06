"use client";

import type React from "react";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useYpoProfiles } from "@/lib/hooks/use-ypo-profiles";
import { TrendingUp, Filter } from "lucide-react";
import type { YpoProfile } from "@/lib/types/ypo-profile";

interface NetworkNode {
	id: string;
	profile: YpoProfile;
	x: number;
	y: number;
	vx: number;
	vy: number;
	fx?: number | null; // Fixed position when dragged
	fy?: number | null;
	radius: number;
	color: string;
	image?: HTMLImageElement | null;
}

interface NetworkLink {
	source: string;
	target: string;
	isBidirectional: boolean;
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
	const containerRef = useRef<HTMLDivElement>(null);
	const [nodes, setNodes] = useState<NetworkNode[]>([]);
	const [links, setLinks] = useState<NetworkLink[]>([]);
	const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
	const [draggedNode, setDraggedNode] = useState<NetworkNode | null>(null);
	const animationRef = useRef<number>(undefined);
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

	const { data, isLoading } = useYpoProfiles();

	const profiles = data?.pages.flatMap((page) => page.results) ?? [];

	useEffect(() => {
		if (!profiles.length || !containerRef.current) return;

		const container = containerRef.current;
		const width = container.clientWidth;
		const height = 600;

		setCanvasSize({ width, height });

		const networkNodes: NetworkNode[] = profiles.map((profile, index) => {
			const angle = (index / profiles.length) * Math.PI * 2;
			const radius = Math.min(width, height) * 0.35;

			const img = new Image();
			img.crossOrigin = "anonymous";
			if (profile.avatar) {
				img.src = profile.avatar;
			}

			return {
				id: profile.id,
				profile,
				x: width / 2 + Math.cos(angle) * radius,
				y: height / 2 + Math.sin(angle) * radius,
				vx: 0,
				vy: 0,
				fx: null,
				fy: null,
				radius: 20,
				color:
					COLORS[
						profile.current_company_industry?.toLowerCase() as keyof typeof COLORS
					] || COLORS.default,
				image: profile.avatar ? img : null,
			};
		});

		const networkLinks: NetworkLink[] = [];
		const linkMap = new Map<string, NetworkLink>();

		for (let i = 0; i < networkNodes.length; i++) {
			for (let j = i + 1; j < networkNodes.length; j++) {
				const p1 = networkNodes[i].profile;
				const p2 = networkNodes[j].profile;

				let hasConnection = false;

				if (p1.ypo_chapter === p2.ypo_chapter && p1.ypo_chapter)
					hasConnection = true;
				if (
					p1.current_company_industry === p2.current_company_industry &&
					p1.current_company_industry
				)
					hasConnection = true;
				if (p1.location === p2.location && p1.location) hasConnection = true;

				if (hasConnection) {
					const key1 = `${p1.id}-${p2.id}`;
					const key2 = `${p2.id}-${p1.id}`;

					if (!linkMap.has(key1) && !linkMap.has(key2)) {
						networkLinks.push({
							source: p1.id,
							target: p2.id,
							isBidirectional: true,
						});
						linkMap.set(key1, networkLinks[networkLinks.length - 1]);
					}
				}
			}
		}

		setNodes(networkNodes);
		setLinks(networkLinks);
	}, [profiles]);

	useEffect(() => {
		if (nodes.length === 0) return;

		const simulate = () => {
			setNodes((prevNodes) => {
				const newNodes = prevNodes.map((node) => ({ ...node }));

				for (let i = 0; i < newNodes.length; i++) {
					const node = newNodes[i];

					if (node.fx !== null && node.fy !== null) {
						node.x = node.fx;
						node.y = node.fy;
						continue;
					}

					// biome-ignore lint/complexity/noForEach: <explanation>
					links.forEach((link) => {
						const other =
							link.source === node.id
								? newNodes.find((n) => n.id === link.target)
								: link.target === node.id
									? newNodes.find((n) => n.id === link.source)
									: null;

						if (other) {
							const dx = other.x - node.x;
							const dy = other.y - node.y;
							const distance = Math.sqrt(dx * dx + dy * dy) || 1;
							const force = (distance - 100) * 0.01;

							node.vx += (dx / distance) * force;
							node.vy += (dy / distance) * force;
						}
					});

					for (let j = 0; j < newNodes.length; j++) {
						if (i === j) continue;
						const other = newNodes[j];

						const dx = other.x - node.x;
						const dy = other.y - node.y;
						const distance = Math.sqrt(dx * dx + dy * dy) || 1;

						if (distance < 150) {
							const force = 50 / (distance * distance);
							node.vx -= (dx / distance) * force;
							node.vy -= (dy / distance) * force;
						}
					}

					const centerX = canvasSize.width / 2;
					const centerY = canvasSize.height / 2;
					node.vx += (centerX - node.x) * 0.001;
					node.vy += (centerY - node.y) * 0.001;

					node.vx *= 0.9;
					node.vy *= 0.9;
					node.x += node.vx;
					node.y += node.vy;

					node.x = Math.max(
						node.radius,
						Math.min(canvasSize.width - node.radius, node.x),
					);
					node.y = Math.max(
						node.radius,
						Math.min(canvasSize.height - node.radius, node.y),
					);
				}

				return newNodes;
			});

			animationRef.current = requestAnimationFrame(simulate);
		};

		animationRef.current = requestAnimationFrame(simulate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [nodes.length, links, canvasSize]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || nodes.length === 0) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// biome-ignore lint/complexity/noForEach: <explanation>
		links.forEach((link) => {
			const source = nodes.find((n) => n.id === link.source);
			const target = nodes.find((n) => n.id === link.target);

			if (source && target) {
				const dx = target.x - source.x;
				const dy = target.y - source.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < 1) return;

				const ux = dx / distance;
				const uy = dy / distance;

				if (link.isBidirectional) {
					const midX = (source.x + target.x) / 2;
					const midY = (source.y + target.y) / 2;

					ctx.beginPath();
					ctx.moveTo(source.x, source.y);
					ctx.lineTo(midX, midY);
					ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
					ctx.lineWidth = 1;
					ctx.stroke();

					const arrowSize = 8;
					ctx.beginPath();
					ctx.moveTo(midX, midY);
					ctx.lineTo(
						midX - ux * arrowSize - uy * arrowSize * 0.5,
						midY - uy * arrowSize + ux * arrowSize * 0.5,
					);
					ctx.lineTo(
						midX - ux * arrowSize + uy * arrowSize * 0.5,
						midY - uy * arrowSize - ux * arrowSize * 0.5,
					);
					ctx.closePath();
					ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
					ctx.fill();

					ctx.beginPath();
					ctx.moveTo(target.x, target.y);
					ctx.lineTo(midX, midY);
					ctx.stroke();

					ctx.beginPath();
					ctx.moveTo(midX, midY);
					ctx.lineTo(
						midX + ux * arrowSize - uy * arrowSize * 0.5,
						midY + uy * arrowSize + ux * arrowSize * 0.5,
					);
					ctx.lineTo(
						midX + ux * arrowSize + uy * arrowSize * 0.5,
						midY + uy * arrowSize - ux * arrowSize * 0.5,
					);
					ctx.closePath();
					ctx.fill();
				} else {
					const endX = target.x - ux * (target.radius + 2);
					const endY = target.y - uy * (target.radius + 2);

					ctx.beginPath();
					ctx.moveTo(source.x, source.y);
					ctx.lineTo(endX, endY);
					ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
					ctx.lineWidth = 1;
					ctx.stroke();

					const arrowSize = 8;
					ctx.beginPath();
					ctx.moveTo(endX, endY);
					ctx.lineTo(
						endX - ux * arrowSize - uy * arrowSize * 0.5,
						endY - uy * arrowSize + ux * arrowSize * 0.5,
					);
					ctx.lineTo(
						endX - ux * arrowSize + uy * arrowSize * 0.5,
						endY - uy * arrowSize - ux * arrowSize * 0.5,
					);
					ctx.closePath();
					ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
					ctx.fill();
				}
			}
		});

		// biome-ignore lint/complexity/noForEach: <explanation>
		nodes.forEach((node) => {
			const isHovered = hoveredNode?.id === node.id;

			ctx.save();

			ctx.beginPath();
			ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();

			if (node.image?.complete && node.image.naturalHeight !== 0) {
				ctx.drawImage(
					node.image,
					node.x - node.radius,
					node.y - node.radius,
					node.radius * 2,
					node.radius * 2,
				);
			} else {
				ctx.fillStyle = node.color;
				ctx.fill();

				ctx.fillStyle = "#ffffff";
				ctx.font = `${node.radius * 0.6}px sans-serif`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				const initials =
					node.profile.name
						?.split(" ")
						.map((n) => n[0])
						.join("")
						.toUpperCase()
						.slice(0, 2) || "?";
				ctx.fillText(initials, node.x, node.y);
			}

			ctx.restore();

			ctx.beginPath();
			ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
			ctx.strokeStyle = isHovered ? "#ffffff" : "#ffffff80";
			ctx.lineWidth = isHovered ? 3 : 2;
			ctx.stroke();

			if (isHovered) {
				ctx.beginPath();
				ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
				ctx.strokeStyle = `${node.color}80`;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		});
	}, [nodes, links, hoveredNode]);

	const getNodeAtPosition = useCallback(
		(x: number, y: number): NetworkNode | null => {
			return (
				nodes.find((node) => {
					const dx = x - node.x;
					const dy = y - node.y;
					return Math.sqrt(dx * dx + dy * dy) <= node.radius;
				}) || null
			);
		},
		[nodes],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const node = getNodeAtPosition(x, y);
			if (node) {
				setDraggedNode(node);
				setNodes((prev) =>
					prev.map((n) =>
						n.id === node.id ? { ...n, fx: x, fy: y, vx: 0, vy: 0 } : n,
					),
				);
			}
		},
		[getNodeAtPosition],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			if (draggedNode) {
				setNodes((prev) =>
					prev.map((n) =>
						n.id === draggedNode.id ? { ...n, fx: x, fy: y, x, y } : n,
					),
				);
			} else {
				const node = getNodeAtPosition(x, y);
				setHoveredNode(node);
			}
		},
		[draggedNode, getNodeAtPosition],
	);

	const handleMouseUp = useCallback(() => {
		setDraggedNode(null);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setDraggedNode(null);
		setHoveredNode(null);
	}, []);

	useEffect(() => {
		const handleResize = () => {
			if (containerRef.current) {
				setCanvasSize({
					width: containerRef.current.clientWidth,
					height: 600,
				});
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[600px]">
				<div className="text-muted-foreground">Loading network graph...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-balance">
						Member Network Graph
					</h1>
					<p className="text-muted-foreground mt-1">
						Explore connections across the YPO global network
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				<Card className="lg:col-span-3 border-2">
					<CardContent className="p-0" ref={containerRef}>
						<div className="relative">
							<canvas
								ref={canvasRef}
								width={canvasSize.width}
								height={canvasSize.height}
								className="w-full rounded-lg bg-white cursor-move"
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseLeave}
							/>

							{hoveredNode && (
								<div
									className="absolute bg-popover border border-border rounded-lg shadow-lg p-3 pointer-events-none z-10"
									style={{
										left: hoveredNode.x + 15,
										top: hoveredNode.y - 50,
									}}
								>
									<div className="flex items-start gap-3 min-w-[200px]">
										<Avatar className="h-10 w-10 border">
											<AvatarImage
												src={hoveredNode.profile.avatar || undefined}
												alt={hoveredNode.profile.name || "Member"}
											/>

											<AvatarFallback>
												{hoveredNode.profile.name
													?.split(" ")
													.map((n) => n[0])
													.join("") || "?"}
											</AvatarFallback>
										</Avatar>

										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm">
												{hoveredNode.profile.name}
											</p>

											<p className="text-xs text-muted-foreground truncate">
												{hoveredNode.profile.position}
											</p>

											<p className="text-xs text-muted-foreground truncate">
												{hoveredNode.profile.current_company_name}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
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
								<span className="text-sm text-muted-foreground">
									Total Members
								</span>
								<Badge variant="secondary">{nodes.length}</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Connections
								</span>
								<Badge variant="secondary">{links.length}</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Avg Connections
								</span>
								<Badge variant="secondary">
									{nodes.length > 0
										? ((links.length * 2) / nodes.length).toFixed(1)
										: 0}
								</Badge>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Industry Colors
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{Object.entries(COLORS)
								.filter(([key]) => key !== "default")
								.map(([industry, color]) => (
									<div key={industry} className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: color }}
										/>
										<span className="text-xs capitalize">{industry}</span>
									</div>
								))}
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
								<li>• Arrows show relationship direction</li>
								<li>• Two arrows = bidirectional relationship</li>
								<li>• Node colors represent industries</li>
								<li>• Graph automatically organizes connections</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
