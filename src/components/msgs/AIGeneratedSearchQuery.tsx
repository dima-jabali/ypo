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
import { getJsonInfoOfToolResponseJson } from "./messageTypesHelpers";
import { MessageWrapper } from "./MessageWrapper";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
  msg: Message;
};

type Message = BotConversationMessage & {
  message_type: BotConversationMessageType.AI_Generated_Search_Query;
};

export const AIGeneratedSearchQuery = memo(function AIGeneratedSearchQuery({ msg }: Props) {
  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;

  const detailsInitialProps = useState(isMessageComplete ? undefined : { open: true })[0];

  const showIntermediateMessage = generalContextStore.use.showIntermediateMessages();
  const shoudShowSources = useShouldShowSources(msg.parallel_conversation_id);

  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (isMessageComplete && detailsRef.current && detailsRef.current.open) {
      closeDetails(detailsRef.current);
    }
  }, [isMessageComplete]);

  const isParallelMsg = isValidNumber(msg.parallel_conversation_id);

  const extraInfo = getJsonInfoOfToolResponseJson(msg);

  return (
    <MessageWrapper
      className="text-muted-foreground"
      title="AI Generated Search Query"
      data-ai-generated-search-query
      data-id={msg.id}
    >
      {isParallelMsg ? (
        <p className="whitespace-nowrap text-primary font-semibold text-2xl text-center mb-6 w-full">
          Internal Search
        </p>
      ) : null}

      {showIntermediateMessage ? (
        <details className="w-full group text-xs" {...detailsInitialProps} ref={detailsRef}>
          <summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer">
            <div
              className="z-10 bg-notebook px-3.5 w-fit text-nowrap flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg group-even/chat-messages:bg-aside group-odd/chat-messages:bg-aside"
              data-is-parallel-msg={isParallelMsg}
            >
              <span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

              <i>{msg.toggle_text}</i>

              {isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}
            </div>
          </summary>

          <div className="relative -top-3 z-0 h-fit w-full rounded-xl border-2 border-border-smooth p-4 flex flex-col gap-3">
            {extraInfo}
          </div>
        </details>
      ) : isMessageComplete ? null : (
        THINKING_SPAN
      )}

      <SourcesForUser sources={msg.sources} shouldShow={shoudShowSources} />
    </MessageWrapper>
  );
});

AIGeneratedSearchQuery.whyDidYouRender = true;
