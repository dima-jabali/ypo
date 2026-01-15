"use client"

import { Sparkles } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { ChatContextProvider, useChatStore } from "@/contexts/chat-context"
import { SourceCitationContextProvider } from "@/contexts/source-citation-context"
import { SlashProvider } from "@/features/notebook/components/slash-plugin/ctx"
import { CHAT_MESSAGE_LIST_HTML_ELEMENT_ID } from "@/helpers/utils"
import { useHasAnyMessage, useNormalizedMessages } from "@/hooks/fetch/use-fetch-bot-conversation-message-list-page"
import type { Content, Event, Member } from "@/lib/store"
import { PlateController } from "platejs/react"
import { AutoScrollIfOnBottom } from "./auto-scroll-if-on-bottom"
import { EmptyData } from "./empty-states/empty-data"
import { DefaultSuspenseAndErrorBoundary } from "./fallback-loader"
import { MessageInput } from "./message-input"
import { renderBotConversationMessage } from "./msgs/render-bot-conversation-message"
import { ScrollToBottomButton } from "./scroll-to-bottom-button"
import { WithChatData } from "./with-chat-data"
import { ClientOnly } from "./client-only"
import { Suspense } from "react"
import { generalContextStore } from "@/contexts/general-ctx/general-context"
import { isValidNumber } from "@/helpers/utils"

// Intelligent search function with fuzzy matching
function searchMembers(
  query: string,
  members: Member[],
  filters?: {
    industries: string[]
    locations: string[]
    chapters: string[]
  },
): { results: Member[]; highlights: Map<string, string[]> } {
  const lowerQuery = query.toLowerCase()
  const results: Member[] = []
  const highlights = new Map<string, string[]>()

  // Parse natural language queries
  const tokens = lowerQuery.split(" ").filter((t) => t.length > 0)

  for (const member of members) {
    if (filters) {
      if (filters.industries.length > 0 && !filters.industries.includes(member.industry)) continue
      if (filters.locations.length > 0 && !filters.locations.some((loc) => member.location.includes(loc))) continue
      if (filters.chapters.length > 0 && !filters.chapters.includes(member.chapter)) continue
    }

    const matches: string[] = []
    let score = 0

    // Name matching (highest priority)
    if (member.name.toLowerCase().includes(lowerQuery)) {
      score += 100
      matches.push("name")
    } else {
      // Fuzzy name matching (first name, last name)
      const nameParts = member.name.toLowerCase().split(" ")
      for (const token of tokens) {
        if (nameParts.some((part) => part.startsWith(token) || part.includes(token))) {
          score += 50
          matches.push("name")
          break
        }
      }
    }

    // Location matching
    if (member.location.toLowerCase().includes(lowerQuery)) {
      score += 40
      matches.push("location")
    } else {
      for (const token of tokens) {
        if (member.location.toLowerCase().includes(token)) {
          score += 20
          matches.push("location")
        }
      }
    }

    // Industry matching
    if (member.industry.toLowerCase().includes(lowerQuery)) {
      score += 35
      matches.push("industry")
    }

    // Expertise matching
    for (const exp of member.expertise) {
      if (exp.toLowerCase().includes(lowerQuery)) {
        score += 30
        matches.push("expertise")
      }
    }

    // Interests matching
    for (const interest of member.interests) {
      if (interest.toLowerCase().includes(lowerQuery)) {
        score += 25
        matches.push("interests")
      }
    }

    // CEO DNA matching
    if (member.ceoDNA) {
      const allDNA = [
        ...(member.ceoDNA.health || []),
        ...(member.ceoDNA.wellness || []),
        ...(member.ceoDNA.sports || []),
        ...(member.ceoDNA.hobbies || []),
      ]
      for (const dna of allDNA) {
        if (dna.toLowerCase().includes(lowerQuery)) {
          score += 20
          matches.push("lifestyle")
        }
      }
    }

    // Multi-attribute queries (e.g., "Women CEOs in San Diego")
    if (tokens.length >= 2) {
      let multiMatchScore = 0
      if (
        tokens.some((t) => ["women", "woman", "female"].includes(t)) &&
        member.networkMemberships.some((n) => n.toLowerCase().includes("women"))
      ) {
        multiMatchScore += 15
        matches.push("network")
      }
      if (
        (tokens.some((t) => ["ceo", "founder", "president"].includes(t)) &&
          member.title.toLowerCase().includes("ceo")) ||
        member.title.toLowerCase().includes("founder")
      ) {
        multiMatchScore += 15
        matches.push("title")
      }
      score += multiMatchScore
    }

    // Chapter matching
    if (member.chapter.toLowerCase().includes(lowerQuery)) {
      score += 20
      matches.push("chapter")
    }

    if (score > 0) {
      results.push(member)
      highlights.set(member.id, [...new Set(matches)])
    }
  }

  // Sort by score
  results.sort((a, b) => {
    const scoreA = highlights.get(a.id)?.length || 0
    const scoreB = highlights.get(b.id)?.length || 0
    return scoreB - scoreA
  })

  return { results: results.slice(0, 8), highlights }
}

// AI-powered response generation
function generateResponse(
  query: string,
  results: { members?: Member[]; events?: Event[]; content?: Content[] },
): string {
  const lowerQuery = query.toLowerCase()

  // Natural language response patterns
  if (lowerQuery.includes("who") || lowerQuery.includes("meet") || lowerQuery.includes("connect")) {
    if (results.members && results.members.length > 0) {
      return `I found ${results.members.length} members who match your search. Here are the top results based on shared attributes and connection potential.`
    }
    return "I couldn't find any members matching your search. Try different keywords or filters."
  }

  if (lowerQuery.includes("event") || lowerQuery.includes("summit") || lowerQuery.includes("conference")) {
    if (results.events && results.events.length > 0) {
      return `Here are ${results.events.length} upcoming events that might interest you.`
    }
  }

  if (lowerQuery.includes("talk") || lowerQuery.includes("article") || lowerQuery.includes("content")) {
    if (results.content && results.content.length > 0) {
      return `I found ${results.content.length} pieces of content matching your search.`
    }
  }

  // Default response
  if (results.members && results.members.length > 0) {
    return `Found ${results.members.length} members matching "${query}". Showing top results with the strongest matches.`
  }

  return "Let me search for that. What specific attributes are you looking for?"
}

interface ChatInterfaceProps {
  filters?: {
    contentTypes: string[]
    eventCities: string[]
    industries: string[]
    eventTypes: string[]
    locations: string[]
    chapters: string[]
  }
}

export function ChatInterface({ filters }: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-w-5xl mx-auto simple-scrollbar">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Member Brain Search</h2>

            <p className="text-sm text-muted-foreground">Ask anything about members, events, or content</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-0 space-y-6">
          <ClientOnly>
            <Suspense fallback={null}>
              <WithChatData>
                <SourceCitationContextProvider>
                  <ChatContextProvider>
                    <SlashProvider>
                      <ChatWrapper />
                    </SlashProvider>
                  </ChatContextProvider>
                </SourceCitationContextProvider>
              </WithChatData>
            </Suspense>
          </ClientOnly>
        </CardContent>
      </Card>
    </div>
  )
}

function ChatWrapper() {
  // const botConversationId = generalContextStore.use.botConversationId() ?? '4517'
  const botConversationId = 4517


  // if (!isValidNumber(botConversationId)) {
  //   return <EmptyData />
  // }

  return <Chat botConversationId={botConversationId} />
}

function Chat({ botConversationId }: { botConversationId: number }) {
  const normalizedMsgs = useNormalizedMessages(botConversationId, true)
  const hasAnyMessage = useHasAnyMessage(botConversationId)
  const chatStore = useChatStore()

  console.log({ hasAnyMessage })

  return (
    // `group/chat chat` are used to style text blocks:

    <div className="@container/chat relative flex h-[calc(100%-38px)] @3xl:h-[calc(100%-46px)] flex-col justify-between overflow-hidden group/chat">
      {hasAnyMessage ? (
        <ol
          className="chat-sm-grid @3xl:chat-md-grid max-h-full h-fit w-full max-w-full simple-scrollbar scrollbar-stable"
          ref={(ref) => chatStore.setState({ scrollContainer: ref })}
          id={CHAT_MESSAGE_LIST_HTML_ELEMENT_ID}
        >
          <Messages normalizedMsgs={normalizedMsgs} />

          <AutoScrollIfOnBottom />
        </ol>
      ) : (
        <EmptyData />
      )}

      <div className="chat-sm-grid @3xl:chat-md-grid w-full relative pr-(--simple-scrollbar-width)">
        {hasAnyMessage ? <ScrollToBottomButton /> : null}

        <PlateController>
          <DefaultSuspenseAndErrorBoundary failedText="Error in message input" fallbackFor="message-input">
            <MessageInput />
          </DefaultSuspenseAndErrorBoundary>
        </PlateController>
      </div>
    </div>
  )
}

function Messages({ normalizedMsgs }: { normalizedMsgs: any }) {
  return normalizedMsgs.map(renderBotConversationMessage)
}
