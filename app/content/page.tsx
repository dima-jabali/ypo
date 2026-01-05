"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore, useContent, useMembers } from "@/lib/store";
import { Search, BookOpen, Video, Mic, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContentPage() {
  const content = useStore(useContent);
  const members = useStore(useMembers);
  const [localSearch, setLocalSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      !localSearch ||
      item.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase())) ||
      item.author.toLowerCase().includes(localSearch.toLowerCase());

    const matchesType = !typeFilter || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const contentTypes = ["Talk", "Article", "Podcast", "Video"];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Talk":
        return <Video className="h-4 w-4" />;
      case "Article":
        return <FileText className="h-4 w-4" />;
      case "Podcast":
        return <Mic className="h-4 w-4" />;
      case "Video":
        return <Video className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Library</h1>
          <p className="text-muted-foreground">
            Discover talks, articles, podcasts, and videos from YPO thought leaders
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content by title, author, or topic..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <BookOpen className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {contentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter("");
                    setLocalSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{filteredContent.length}</strong> content items
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => {
            const author = members.find((m) => m.id === item.authorId);
            return (
              <Link key={item.id} href={`/content/${item.id}`}>
                <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="gap-1">
                        {getTypeIcon(item.type)}
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>

                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={author?.avatar || "/placeholder.svg"} alt={item.author} />
                        <AvatarFallback>
                          {item.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.author}</p>
                        {author && (
                          <p className="text-xs text-muted-foreground truncate">{author.company}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {item.duration && <span>{item.duration}</span>}
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{item.views.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {filteredContent.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No content found matching your criteria.</p>
              <Button
                variant="link"
                onClick={() => {
                  setTypeFilter("");
                  setLocalSearch("");
                }}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
