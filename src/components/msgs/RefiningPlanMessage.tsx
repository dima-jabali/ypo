import { memo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
  BotConversationMessageStatus,
  type BotConversationMessage,
  type BotConversationMessageType,
} from "#/types/chat";
import { ReasoningPopover } from "./InfoPopover";
import { MessageWrapper } from "./MessageWrapper";
import { ANIMATED_DOTS, DOUBLE_CHECK, THINKING_SPAN } from "./icons";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Plan_Next_Step_Response;
};

export const RefiningPlanMessage = memo(function RefiningPlanMessage({ msg }: Props) {
  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  const showIntermediateMessage = generalContextStore.use.showIntermediateMessages();
  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

  if (isMessageComplete && !showIntermediateMessage && (!msg.sources || msg.sources.length === 0)) {
    return null;
  }

  const reasoning = typeof msg.json?.reasoning === "string" ? msg.json.reasoning : "";
  const defaultOpen = msg.message_status !== BotConversationMessageStatus.Complete;

  return (
    <MessageWrapper
      className="text-muted-foreground"
      title="Refining Plan Message"
      data-refining-plan-message
      data-id={msg.id}
    >
      {showIntermediateMessage ? (
        <div className="flex w-full">
          <div className="z-10 @[450px]:ml-[25%] flex bg-notebook px-3.5 gap-1 group-even/chat-messages:bg-aside group-odd/chat-messages:bg-aside">
            <span className="size-3 flex-none"></span>

            <i className="whitespace-pre-wrap text-xs">{msg.toggle_text}</i>

            {isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}

            {reasoning ? (
              <ReasoningPopover
                key={`${isMessageComplete}`}
                defaultOpen={defaultOpen}
                reasoning={reasoning}
              />
            ) : null}
          </div>
        </div>
      ) : isMessageComplete ? null : (
        THINKING_SPAN
      )}

      <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
    </MessageWrapper>
  );
});

RefiningPlanMessage.whyDidYouRender = true;
