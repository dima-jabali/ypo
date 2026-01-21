"use client";

import { createBotConversationMessageUuid } from "#/helpers/utils";
import { useAddBotConversationMessage } from "#/hooks/mutation/use-add-bot-conversation-message";
import { ChatTools } from "#/types/notebook";
import { Button } from "@/components/ui/button";
import { Bot, Database, MessageCircle, Search } from "lucide-react";
import { convertMarkdownToMessages } from "../message-input";
import { useWithBotConversationId } from "#/contexts/general-ctx/general-context";

import "client-only";

type EmptyDataProps = {
  description: string;
  title: string;
};

const quickSearches = [
  "Women CEOs in San Diego who like wellness",
  "James New York",
  "Oil & gas founders",
  "Who did I meet at GLC Singapore?",
  "Tech leaders in AI",
];

export function EmptyData({
  description,
  children,
  title,
}: React.PropsWithChildren<EmptyDataProps>) {
  if (typeof window === "undefined") {
    return null;
  }

  const addBotConversationMessage = useAddBotConversationMessage()!;
  const botConversationId = useWithBotConversationId();

  function handleSearch(s: string) {
    const convertedMessages = convertMarkdownToMessages(s);

    addBotConversationMessage.mutate({
      tools_to_use: [ChatTools.ANSWER_QUESTION_BY_SEARCHING_ORGANIZATION_CONTEXT],
      uuid: createBotConversationMessageUuid(),
      messages: convertedMessages,
      botConversationId,
    });
  }

  return (
    <div className="h-[calc(100vh-65px)]  flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-4 bg-primary/5 rounded-full">
        <Search className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Magical Member Search</h3>

        <p className="text-muted-foreground max-w-md text-pretty">
          Search by name, location, industry, interests, or ask natural questions. Our AI
          understands what you're looking for.
        </p>
      </div>

      <div className="space-y-2 w-full max-w-md">
        <p className="text-sm font-medium text-muted-foreground">Try these searches:</p>

        <div className="flex flex-wrap gap-2">
          {quickSearches.map((search, i) => (
            <Button
              onClick={() => handleSearch(search)}
              className="text-xs"
              variant="outline"
              size="sm"
              key={i}
            >
              {search}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
