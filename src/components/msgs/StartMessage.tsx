import { memo } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import type { BotConversationMessage, BotConversationMessageType } from "#/types/chat";
import { MessageWrapper } from "./MessageWrapper";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Sources_Message;
};

export const StartMessage = memo(function StartMessage({ msg }: Props) {
  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

  if (!msg.sources || msg.sources.length === 0) {
    return null;
  }

  return (
    <MessageWrapper
      title="Sources (Start group of messages)"
      className="p-0 empty:hidden"
      data-start-message
      data-id={msg.id}
    >
      <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
    </MessageWrapper>
  );
});

StartMessage.whyDidYouRender = true;
