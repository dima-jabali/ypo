"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Users, Lightbulb, HandHelping, MessageCircle } from "lucide-react";
import { useProfileSimilarity } from "@/lib/hooks/use-profile-similarity";

interface ProfileSimilarityCardProps {
  viewerId: number;
  profileId: number;
}

function parseBulletPoints(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.substring(1).trim());
}

export function ProfileSimilarityCard({ viewerId, profileId }: ProfileSimilarityCardProps) {
  const { data, isLoading, error } = useProfileSimilarity(viewerId, profileId);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardContent className="pt-6 text-center">
            <Skeleton className="h-12 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto mb-1" />
            <Skeleton className="h-3 w-40 mx-auto mb-3" />
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const scorePercentage = Math.round(data.similarity * 100);
  const commonalities = parseBulletPoints(data.similarity_reasons.what_you_have_in_common);
  const differences = parseBulletPoints(data.similarity_reasons.where_you_differ);

  return (
    <div className="space-y-4">
      {/* Similarity Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="relative inline-block mb-2">
              <div className="text-5xl font-bold text-primary">{scorePercentage}%</div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium mb-1">{data.similarity_reasons.title}</p>
            <div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You Have in Common */}
      {commonalities.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">What You Have in Common</CardTitle>
            </div>
            <CardDescription>Shared attributes and connections</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {commonalities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Where You Differ */}
      {differences.length > 0 && (
        <Card className="border-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Where You Differ</CardTitle>
            </div>
            <CardDescription>Complementary perspectives and experiences</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {differences.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What You Might Learn */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">What You Might Learn from Each Other</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {data.similarity_reasons.what_you_might_learn_from_each_other}
          </p>
        </CardContent>
      </Card>

      {/* How You Can Help Each Other */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HandHelping className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">How You Might Be Helpful to Each Other</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {data.similarity_reasons.how_you_might_be_helpful_to_each_other}
          </p>
        </CardContent>
      </Card>

      {/* Closing Suggestion */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">Next Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground leading-relaxed">
            {data.similarity_reasons.closing}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
