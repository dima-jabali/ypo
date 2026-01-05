"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, useContent, useMembers } from "@/lib/store";
import { Eye, Clock, Share2, Bookmark, Video, FileText, Mic, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const content = useStore(useContent);
  const members = useStore(useMembers);
  const item = content.find((c) => c.id === id);
  const author = item ? members.find((m) => m.id === item.authorId) : undefined;

  if (!item) {
    return (
      <main className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Content not found</p>
            <Link href="/content">
              <Button variant="link" className="mt-2">
                Back to Content
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const relatedContent = content
    .filter((c) => c.id !== item.id && c.tags.some((tag) => item.tags.includes(tag)))
    .slice(0, 3);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Talk":
        return <Video className="h-5 w-5" />;
      case "Article":
        return <FileText className="h-5 w-5" />;
      case "Podcast":
        return <Mic className="h-5 w-5" />;
      case "Video":
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <Link href="/content">
        <Button variant="ghost" size="sm">
          ← Back to Content
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="gap-1.5">
                  {getTypeIcon(item.type)}
                  {item.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <CardTitle className="text-3xl mb-4">{item.title}</CardTitle>

              {author && (
                <Link href={`/members/${item.authorId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={author.avatar || "/placeholder.svg"} alt={item.author} />
                      <AvatarFallback>
                        {item.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{item.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {author.title} at {author.company}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {item.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{item.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{item.views.toLocaleString()} views</span>
                </div>
              </div>

              <Separator />

              {/* Placeholder for video/audio player */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-3">
                  {getTypeIcon(item.type)}
                  <p className="text-sm text-muted-foreground">
                    {item.type} content would be displayed here
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Like
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Save
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">About this {item.type.toLowerCase()}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {author && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About the Author</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/members/${item.authorId}`}>
                  <div className="space-y-3">
                    <Avatar className="h-20 w-20 mx-auto">
                      <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.name} />
                      <AvatarFallback className="text-2xl">
                        {author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-semibold">{author.name}</p>
                      <p className="text-sm text-muted-foreground">{author.title}</p>
                      <p className="text-sm font-medium text-primary">{author.company}</p>
                    </div>
                    <p className="text-sm text-muted-foreground text-center">{author.bio}</p>
                  </div>
                </Link>
                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {relatedContent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedContent.map((related) => {
                  const relatedAuthor = members.find((m) => m.id === related.authorId);
                  return (
                    <Link key={related.id} href={`/content/${related.id}`}>
                      <div className="p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {related.type}
                        </Badge>
                        <h4 className="font-semibold text-sm mb-2 line-clamp-2">{related.title}</h4>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={relatedAuthor?.avatar || "/placeholder.svg"}
                              alt={related.author}
                            />
                            <AvatarFallback className="text-xs">
                              {related.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{related.author}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <Button variant="link" className="w-full">
                  View More
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-accent/50">
            <CardHeader>
              <CardTitle className="text-base">Personalized Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get content recommendations based on your interests and connections
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Explore Your Feed
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
