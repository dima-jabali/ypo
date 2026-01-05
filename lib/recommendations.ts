import type { Member, Event } from "./store";

export interface Recommendation {
  member: Member;
  score: number;
  reasons: ReasonMatch[];
  sharedAttributes: string[];
}

export interface ReasonMatch {
  type:
    | "interest"
    | "industry"
    | "location"
    | "expertise"
    | "leadership"
    | "event"
    | "network"
    | "ceoDNA"
    | "travel";
  value: string;
  weight: number;
}

export function generateRecommendations(
  currentMember: Partial<Member>,
  allMembers: Member[],
  limit = 10,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const member of allMembers) {
    const reasons: ReasonMatch[] = [];
    let score = 0;
    const sharedAttributes: string[] = [];

    // Skip if same member
    if (currentMember.id && member.id === currentMember.id) continue;

    // Shared interests (high weight)
    if (currentMember.interests) {
      const shared = currentMember.interests.filter((i) => member.interests.includes(i));
      if (shared.length > 0) {
        const weight = shared.length * 15;
        score += weight;
        reasons.push({ type: "interest", value: shared.join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Shared expertise (high weight)
    if (currentMember.expertise) {
      const shared = currentMember.expertise.filter((e) => member.expertise.includes(e));
      if (shared.length > 0) {
        const weight = shared.length * 12;
        score += weight;
        reasons.push({ type: "expertise", value: shared.join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Same industry (medium weight)
    if (currentMember.industry === member.industry) {
      const weight = 20;
      score += weight;
      reasons.push({ type: "industry", value: member.industry, weight });
      sharedAttributes.push(member.industry);
    }

    // Same location (medium weight)
    if (currentMember.location === member.location) {
      const weight = 18;
      score += weight;
      reasons.push({ type: "location", value: member.location, weight });
      sharedAttributes.push(member.location);
    }

    // Overlapping travel patterns (medium weight)
    if (currentMember.travelPattern && member.travelPattern) {
      const shared = currentMember.travelPattern.filter((t) => member.travelPattern.includes(t));
      if (shared.length > 0) {
        const weight = shared.length * 10;
        score += weight;
        reasons.push({ type: "travel", value: shared.join(", "), weight });
        sharedAttributes.push(...shared.map((t) => `Travels to ${t}`));
      }
    }

    // Shared leadership DNA (medium weight)
    if (currentMember.leadershipDNA) {
      const shared = currentMember.leadershipDNA.filter((l) => member.leadershipDNA.includes(l));
      if (shared.length > 0) {
        const weight = shared.length * 10;
        score += weight;
        reasons.push({ type: "leadership", value: shared.join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Shared network memberships (high weight)
    if (currentMember.networkMemberships) {
      const shared = currentMember.networkMemberships.filter((n) =>
        member.networkMemberships.includes(n),
      );
      if (shared.length > 0) {
        const weight = shared.length * 15;
        score += weight;
        reasons.push({ type: "network", value: shared.join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Shared CEO DNA (lifestyle compatibility)
    if (currentMember.ceoDNA && member.ceoDNA) {
      const allCurrentDNA = [
        ...(currentMember.ceoDNA.health || []),
        ...(currentMember.ceoDNA.wellness || []),
        ...(currentMember.ceoDNA.sports || []),
        ...(currentMember.ceoDNA.hobbies || []),
      ];
      const allMemberDNA = [
        ...(member.ceoDNA.health || []),
        ...(member.ceoDNA.wellness || []),
        ...(member.ceoDNA.sports || []),
        ...(member.ceoDNA.hobbies || []),
      ];
      const shared = allCurrentDNA.filter((d) => allMemberDNA.includes(d));
      if (shared.length > 0) {
        const weight = shared.length * 8;
        score += weight;
        reasons.push({ type: "ceoDNA", value: shared.slice(0, 3).join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Shared recent events (very high weight)
    if (currentMember.recentEvents) {
      const shared = currentMember.recentEvents.filter((e) => member.recentEvents.includes(e));
      if (shared.length > 0) {
        const weight = shared.length * 25;
        score += weight;
        reasons.push({ type: "event", value: shared.join(", "), weight });
        sharedAttributes.push(...shared);
      }
    }

    // Only include if there's some connection
    if (score > 0) {
      // Sort reasons by weight
      reasons.sort((a, b) => b.weight - a.weight);

      recommendations.push({
        member,
        score,
        reasons: reasons.slice(0, 3), // Top 3 reasons
        sharedAttributes: [...new Set(sharedAttributes)],
      });
    }
  }

  // Sort by score and return top results
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

export function getEventRecommendations(
  member: Member,
  event: Event,
  allMembers: Member[],
): Recommendation[] {
  // Find members who have attended similar events or are in same networks
  return generateRecommendations(member, allMembers, 8).filter((rec) => {
    // Prioritize members who attended this event or similar ones
    return rec.reasons.some((r) => r.type === "event" || r.type === "network");
  });
}

export function getTravelRecommendations(destination: string, allMembers: Member[]): Member[] {
  // Find members based in or frequently traveling to the destination
  return allMembers
    .filter(
      (member) =>
        member.location.toLowerCase().includes(destination.toLowerCase()) ||
        member.travelPattern.some((t) => t.toLowerCase().includes(destination.toLowerCase())),
    )
    .slice(0, 6);
}
