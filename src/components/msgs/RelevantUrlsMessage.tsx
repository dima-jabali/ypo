import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import { BotConversationMessageStatus, type BotConversationMessage } from "#/types/chat";
import { ReasoningPopover } from "./InfoPopover";
import { MessageWrapper } from "./MessageWrapper";
import { closeDetails } from "./common";
import { ANIMATED_DOTS, CHEVRON_RIGHT, DOUBLE_CHECK } from "./icons";
import { getMatchingReasoningText } from "./messageHelpers";

type Props = {
  msg: BotConversationMessage;
};

const getJsonInfoOfToolSelectionResponseJson = (message: BotConversationMessage) => {
  if (!message.json) return "";

  if (Array.isArray(message.json)) {
    return message.json.map((item) => {
      if (typeof item === "string") {
        const isLink = item.startsWith("http");

        if (isLink) {
          return (
            <a
              className="hover:text-link cursor-pointer visited:text-link-visited hover:underline block break-all"
              key={Math.random()}
              target="_blank"
              href={item}
            >
              • {item}
            </a>
          );
        } else return item;
      } else return item;
    });
  }

  return "";
};

export const RelevantUrlsMessage = memo(function RelevantUrlsMessage({ msg }: Props) {
  const isMessageComplete = msg.message_status === BotConversationMessageStatus.Complete;
  const reasoning =
    msg.json && "reasoning" in msg.json && typeof msg.json.reasoning === "string"
      ? msg.json.reasoning
      : "";

  const detailsInitialProps = useState(isMessageComplete ? undefined : { open: true })[0];

  const detailsRef = useRef<HTMLDetailsElement>(null);

  const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

  useEffect(() => {
    if (isMessageComplete && !!detailsRef.current) {
      closeDetails(detailsRef.current);
    }
  }, [isMessageComplete]);

  const isParallelMessage = isValidNumber(msg.parallel_conversation_id);
  const extraInfo = getJsonInfoOfToolSelectionResponseJson(msg);

  return (
    <MessageWrapper
      className="text-muted-foreground text-xs"
      title="Relevant URLs Message"
      data-relevant-urls
      data-id={msg.id}
    >
      {isParallelMessage ? (
        <p className="whitespace-nowrap text-primary font-semibold text-2xl text-center mb-6 w-full">
          External Search
        </p>
      ) : null}

      <details className="w-full group" {...detailsInitialProps} ref={detailsRef}>
        <summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer">
          <div
            className="z-10 bg-notebook px-3.5 w-fit text-nowrap flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg"
            data-is-parallel-msg={isParallelMessage}
          >
            <span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

            <i>{msg.toggle_text || getMatchingReasoningText(msg)}</i>

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

        <div className="relative -top-3 z-0 h-fit w-full rounded-xl border-2 border-border-smooth p-4 flex flex-col gap-3">
          {extraInfo}
        </div>
      </details>

      <SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
    </MessageWrapper>
  );
});

RelevantUrlsMessage.whyDidYouRender = true;
