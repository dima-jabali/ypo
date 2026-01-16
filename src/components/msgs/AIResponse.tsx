import { memo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { messageDateFormatter } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import type { BotConversationMessage, BotConversationMessageType } from "#/types/chat";
import { Markdown } from "../Markdown/Markdown";
import { BOT_IMG } from "./messageHelpers";
import { MessageWrapper } from "./MessageWrapper";
import { OptionsButtons } from "./OptionsButton";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.AI_Response;
};

export const AIResponse = memo(function AIResponse({ msg }: Props) {
  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);
  const botName = generalContextStore.use.chatBotAgentName();

  const userInfo = msg.sender.sender_info
    ? `${msg.sender.sender_info.first_name} ${msg.sender.sender_info.last_name}\n${msg.sender.sender_info.email}`
    : undefined;
  const createdAt = messageDateFormatter.format(new Date(msg.created_at));

  return (
    <MessageWrapper title="AI Response" data-ai-response data-id={msg.id}>
      <div className="flex w-full flex-col gap-1 max-w-full simple-scrollbar">
        <section className="flex items-center gap-2">
          {BOT_IMG}

          <div className="h-fit flex gap-2 items-center">
            <p className="text-sm text-muted font-bold" title={userInfo}>
              {botName}
            </p>

            <p className="text-xs text-muted" title={createdAt}>
              {createdAt}
            </p>
          </div>
        </section>

        <div className="pl-10 text-base">{msg.text ? <Markdown text={msg.text} /> : null}</div>

        <div className="pl-10 pt-1.5">
          <OptionsButtons message={msg} />
        </div>

        <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
      </div>
    </MessageWrapper>
  );
});

AIResponse.whyDidYouRender = true;
