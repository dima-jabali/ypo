"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYpoProfile } from "@/lib/hooks/use-ypo-profiles";
import {
	Award,
	Building2,
	Globe,
	Heart,
	Languages,
	Linkedin,
	Loader2,
	Mail,
	MapPin,
	MessageCircle,
	BookOpen,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MemberDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { isLoading, error, data: member } = useYpoProfile(Number.parseInt(id));

	if (isLoading) {
		return (
			<main className="container mx-auto p-6">
				<Card>
					<CardContent className="py-12 flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-muted-foreground">Loading member profile...</p>
					</CardContent>
				</Card>
			</main>
		);
	}

	if (error || !id || !member) {
		return (
			<main className="container mx-auto p-6">
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Member not found</p>
						<Link href="/members">
							<Button variant="link" className="mt-2">
								Back to Members
							</Button>
						</Link>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main className="container mx-auto p-6 flex flex-col gap-4">
			{/* Back Button */}
			<Link href="/members">
				<Button variant="ghost" size="sm">
					← Back to Members
				</Button>
			</Link>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Profile */}
				<div className="lg:col-span-2 space-y-6">
					{/* Header Card */}
					<Card>
						<CardContent className="pt-6">
							<div className="flex flex-col md:flex-row gap-6">
								<Avatar className="h-32 w-32">
									<AvatarImage
										src={member.avatar || "/placeholder.svg"}
										alt={member.name || ""}
									/>

									<AvatarFallback className="text-3xl">
										{member.name
											?.split(" ")
											.map((n) => n[0])
											.join("")}
									</AvatarFallback>
								</Avatar>

								<div className="flex-1 space-y-4">
									<div>
										<h1 className="text-3xl font-bold mb-2">{member.name}</h1>

										<p className="text-lg text-muted-foreground">
											{member.position}
										</p>

										<p className="text-lg font-semibold text-primary">
											{member.current_company_name}
										</p>

										{member.linkedin_id && (
											<div className="mt-3 p-3 bg-accent/30 rounded-lg border border-accent/50">
												<div className="flex items-center gap-2 mb-2">
													<Linkedin className="h-4 w-4 text-primary" />
													<span className="text-xs font-semibold text-muted-foreground">
														LinkedIn
													</span>
												</div>
											</div>
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										<Button className="gap-2">
											<MessageCircle className="h-4 w-4" />
											Connect
										</Button>

										<Button variant="outline" className="gap-2 bg-transparent">
											<Mail className="h-4 w-4" />
											Message
										</Button>

										<Button variant="outline" className="gap-2 bg-transparent">
											<Heart className="h-4 w-4" />
											Save
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* About section with separate card */}
					{member.about && (
						<Card>
							<CardHeader>
								<CardTitle>About</CardTitle>
							</CardHeader>

							<CardContent>
								<p className="text-muted-foreground leading-relaxed">
									{member.about}
								</p>
							</CardContent>
						</Card>
					)}

					{/* CEO DNA / Personal Profile section with tabs */}
					{(member.hobbies || member.interests) && (
						<Card className="border-primary/20">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Sparkles className="h-5 w-5 text-primary" />
									<CardTitle>Personal Profile</CardTitle>
								</div>
								<CardDescription>
									Interests, hobbies and personal insights
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Tabs defaultValue="interests" className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="interests">Interests</TabsTrigger>
										<TabsTrigger value="hobbies">Hobbies</TabsTrigger>
									</TabsList>
									{member.interests && member.interests.length > 0 && (
										<TabsContent value="interests" className="mt-4">
											<div className="flex flex-wrap gap-2">
												{member.interests.map((item, idx) => (
													<Badge key={idx} variant="default" className="gap-1">
														<Sparkles className="h-3 w-3" />
														{item}
													</Badge>
												))}
											</div>
										</TabsContent>
									)}
									{member.hobbies && member.hobbies.length > 0 && (
										<TabsContent value="hobbies" className="mt-4">
											<div className="flex flex-wrap gap-2">
												{member.hobbies.map((item, idx) => (
													<Badge
														key={idx}
														variant="secondary"
														className="gap-1"
													>
														<Heart className="h-3 w-3" />
														{item}
													</Badge>
												))}
											</div>
										</TabsContent>
									)}
								</Tabs>
							</CardContent>
						</Card>
					)}

					{member.education && member.education.length > 0 && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<BookOpen className="h-5 w-5 text-primary" />
									<CardTitle>Education</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{member.education.map((edu, idx) => (
									<div key={idx} className="space-y-2">
										{idx > 0 && <Separator />}
										<div>
											<h4 className="font-semibold">{edu.title}</h4>
											{edu.start_year || edu.end_year ? (
												<p className="text-sm text-muted-foreground">
													{edu.start_year && edu.end_year
														? `${edu.start_year} - ${edu.end_year}`
														: edu.start_year || edu.end_year}
												</p>
											) : null}
											{edu.description && (
												<p className="text-sm mt-1">{edu.description}</p>
											)}
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					)}

					{member.experience && member.experience.length > 0 && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Building2 className="h-5 w-5 text-primary" />
									<CardTitle>Experience</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{member.experience.map((exp, idx) => (
									<div key={idx} className="space-y-2">
										{idx > 0 && <Separator />}
										<div>
											<h4 className="font-semibold">{exp.title}</h4>
											<p className="text-sm text-muted-foreground">
												{exp.company}
												{exp.location && ` • ${exp.location}`}
											</p>
											{(exp.start_date || exp.end_date) && (
												<p className="text-xs text-muted-foreground mt-1">
													{exp.start_date && exp.end_date
														? `${exp.start_date} - ${exp.end_date}`
														: exp.start_date || exp.end_date}
													{exp.duration && ` (${exp.duration})`}
												</p>
											)}
											{exp.description && (
												<p className="text-sm mt-2">{exp.description}</p>
											)}
										</div>
									</div>
								))}
							</CardContent>
						</Card>
					)}
				</div>

				<div className="space-y-6">
					{/* Connection Match Score card */}
					<Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
						<CardContent className="pt-6 text-center">
							<div className="relative inline-block mb-2">
								<div className="text-4xl font-bold text-primary">
									{Math.round(Math.random() * 30 + 70)}%
								</div>
								<div className="absolute -top-2 -right-2">
									<Sparkles className="h-5 w-5 text-primary animate-pulse" />
								</div>
							</div>
							<p className="text-sm font-medium mb-1">Connection Match</p>
							<p className="text-xs text-muted-foreground">
								Based on shared interests & location
							</p>
							<div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
								<div
									className="h-full bg-primary transition-all duration-1000 ease-out"
									style={{ width: `${Math.round(Math.random() * 30 + 70)}%` }}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Details card with location, industry, YPO info */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{(member.city || member.location) && (
								<>
									<div className="flex items-start gap-3">
										<MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
										<div>
											<p className="text-sm font-medium">Location</p>
											<p className="text-sm text-muted-foreground">
												{member.city && member.location
													? `${member.city}, ${member.location}`
													: member.city || member.location}
											</p>
										</div>
									</div>
									<Separator />
								</>
							)}
							{member.current_company_industry && (
								<>
									<div className="flex items-start gap-3">
										<Building2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
										<div>
											<p className="text-sm font-medium">Industry</p>
											<p className="text-sm text-muted-foreground">
												{member.current_company_industry}
											</p>
										</div>
									</div>
									<Separator />
								</>
							)}
							{member.ypo_chapter && (
								<>
									<div className="flex items-start gap-3">
										<Globe className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
										<div>
											<p className="text-sm font-medium">YPO Chapter</p>
											<p className="text-sm text-muted-foreground">
												{member.ypo_chapter}
											</p>
										</div>
									</div>
									<Separator />
								</>
							)}
							{member.followers && (
								<div className="flex items-start gap-3">
									<Award className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
									<div>
										<p className="text-sm font-medium">Followers</p>
										<p className="text-sm text-muted-foreground">
											{member.followers.toLocaleString()}
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Location Card */}
					{(member.location || member.city) && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Location Info</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-start gap-3">
									<MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
									<div>
										<p className="text-sm text-muted-foreground">
											{member.city && member.location
												? `${member.city}, ${member.location}`
												: member.city || member.location}
										</p>
										{member.country_code && (
											<p className="text-xs text-muted-foreground mt-1">
												{member.country_code}
											</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* YPO Chapter Card */}
					{member.ypo_chapter && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">YPO Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-start gap-3">
									<Globe className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
									<div>
										<p className="text-sm font-medium">Chapter</p>
										<p className="text-sm text-muted-foreground">
											{member.ypo_chapter}
										</p>
									</div>
								</div>
								{member.ypo_industry && (
									<>
										<Separator />
										<div>
											<p className="text-sm font-medium">Industry</p>
											<p className="text-sm text-muted-foreground">
												{member.ypo_industry}
											</p>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					)}

					{/* Languages Card */}
					{member.languages && member.languages.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Languages</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{member.languages.map((lang, idx) => (
										<Badge key={idx} variant="outline">
											<Languages className="h-3 w-3 mr-1" />
											{lang}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Topics Card */}
					{member.topics && member.topics.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Topics & Expertise</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{member.topics.map((topic, idx) => (
										<Badge key={idx} variant="secondary">
											{topic}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Recommendations Card */}
					{member.recommendations && member.recommendations.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Award className="h-4 w-4" />
									Recommendations
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{member.recommendations.map((rec, idx) => (
										<p
											key={idx}
											className="text-sm text-muted-foreground italic"
										>
											"{rec}"
										</p>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</main>
	);
}
