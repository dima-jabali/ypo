import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
  BotConversationMessageStatus,
  type BotConversationMessage,
  type BotConversationMessageType,
} from "#/types/chat";
import { closeDetails } from "./common";
import { ANIMATED_DOTS, CHEVRON_RIGHT, DOUBLE_CHECK, THINKING_SPAN } from "./icons";
import { ReasoningPopover } from "./InfoPopover";
import { makeExtraInfoListItem } from "./messageTypesHelpers";
import { MessageWrapper } from "./MessageWrapper";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.Reflection_Message;
};

const getReflectionMessageExtraInfo = (message: Message) => {
  if (!message.json) {
    return null;
  }

  const isTaskComplete =
    message.json && "is_task_complete" in message.json && message.json.is_task_complete;

  const jsxs: React.ReactNode[] = Object.entries(message.json).map(([k, v]) =>
    makeExtraInfoListItem(k, v),
  );

  return (
    <ul className="flex list-inside flex-col gap-2">
      {typeof isTaskComplete === "boolean" ? (
        <span>Task {isTaskComplete ? "complete" : "in progress..."}</span>
      ) : null}

      {jsxs}
    </ul>
  );
};

export const ReflectionMessage = memo(function ReflectionMessage({ msg }: Props) {
  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  const detailsInitialProps = useState(isMessageComplete ? undefined : { open: true })[0];

  const detailsRef = useRef<HTMLDetailsElement>(null);

  const showIntermediateMessage = generalContextStore.use.showIntermediateMessages();
  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

  useEffect(() => {
    if (isMessageComplete && detailsRef.current && detailsRef.current.open) {
      closeDetails(detailsRef.current);
    }
  }, [isMessageComplete]);

  if (isMessageComplete && !showIntermediateMessage && (!msg.sources || msg.sources.length === 0)) {
    return null;
  }

  const reasoning = typeof msg.json?.reasoning === "string" ? msg.json.reasoning : "";
  const isParallelMessage = isValidNumber(msg.parallel_conversation_id);
  const extraInfo = getReflectionMessageExtraInfo(msg);

  return (
    <MessageWrapper
      className="text-muted-foreground"
      title="Reflection Message"
      data-reflection-message
      data-id={msg.id}
    >
      {showIntermediateMessage ? (
        <details className="w-full group" {...detailsInitialProps} ref={detailsRef}>
          <summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer">
            <div
              className="z-10 bg-notebook px-3.5 w-fit text-nowrap text-xs flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg group-even/chat-messages:bg-aside group-odd/chat-messages:bg-aside"
              data-is-parallel-msg={isParallelMessage}
            >
              <span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

              <i className="whitespace-nowrap">{msg.toggle_text}</i>

              {isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}

              {reasoning ? (
                <ReasoningPopover
                  defaultOpen={!isMessageComplete}
                  key={`${isMessageComplete}`}
                  reasoning={reasoning}
                />
              ) : null}
            </div>
          </summary>

          <div className="relative -top-3 text-xs z-0 h-fit w-full rounded-xl border-2 border-border-smooth p-4 flex flex-col gap-3">
            {extraInfo}
          </div>
        </details>
      ) : isMessageComplete ? null : (
        THINKING_SPAN
      )}

      <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
    </MessageWrapper>
  );
});

ReflectionMessage.whyDidYouRender = true;
