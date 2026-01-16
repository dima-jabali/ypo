"use client";

import { ChevronRight } from "lucide-react";
import { memo } from "react";

import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import type { NormalizedBotConversationMessage } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { type BotConversationMessage, BotConversationMessageType } from "#/types/chat";
import { DefaultSuspenseAndErrorBoundary } from "../fallback-loader";
import { AIGeneratedSearchQuery } from "./AIGeneratedSearchQuery";
import { AIResponse } from "./AIResponse";
import { DefaultMessageHandler } from "./DefaultMessageHandler";
import { EndMessage } from "./EndMessage";
import { FirstSystemMessage } from "./FirstSystemMessage";
import { GeneralIntermediateMessage } from "./GeneralIntermediateMessage";
import { IntermediateMessageDefaultHandler } from "./IntermediateMessageDefaultHandler";
import { NotebookBlockMessage } from "./NotebookBlockMessage";
import { PlanNextStepResponse } from "./PlanNextStepResponse";
import { RefiningPlanMessage } from "./RefiningPlanMessage";
import { ReflectionMessage } from "./ReflectionMessage";
import { ReflectionSelectionFacilitatorMessage } from "./ReflectionSelectionFacilitatorMessage";
import { RelevantUrlsMessage } from "./RelevantUrlsMessage";
import { SourcesMessage } from "./SourcesMessage";
import { StartMessage } from "./StartMessage";
import { ToolResponse } from "./ToolResponse";
import { ToolSelectionResponse } from "./ToolSelectionResponse";
import { UserMessage } from "./UserMessage";
import { getMapFirstValue } from "#/helpers/utils";
import { ClientOnly } from "@/components/client-only";

type NormalizedBotConversationMessageWithParallelMessages = NormalizedBotConversationMessage & {
  parallelMessages: NonNullable<NormalizedBotConversationMessage["parallelMessages"]>;
};

export function renderBotConversationMessage(
  normalizedBotConversationMessage: NormalizedBotConversationMessage,
) {
  if (normalizedBotConversationMessage.parallelMessages) {
    // Show parallel messages side by side:
    return handleParallelMessages(
      normalizedBotConversationMessage as NormalizedBotConversationMessageWithParallelMessages,
    );
  } else if (normalizedBotConversationMessage.message) {
    return handleNormalMessages(
      normalizedBotConversationMessage.message,
      normalizedBotConversationMessage.withNotebookBlocks,
    );
  }

  return null;
}

function handleParallelMessages(
  normalizedBotConversationMessage: NormalizedBotConversationMessageWithParallelMessages,
) {
  const mapFn = (message: BotConversationMessage) =>
    handleNormalMessages(message, normalizedBotConversationMessage.withNotebookBlocks);
  const msgNodes = Array.from({
    length: normalizedBotConversationMessage.parallelMessages.size,
  }) as Array<React.ReactNode>;
  const key =
    getMapFirstValue(normalizedBotConversationMessage.parallelMessages)?.[0]?.id ?? Math.random();

  for (const [
    parallelConversationId,
    messages,
  ] of normalizedBotConversationMessage.parallelMessages.entries()) {
    msgNodes.push(
      <div
        className="rounded-xl bg-parallel-msg p-4 border border-border-smooth/40"
        data-parallel-conversation-id={parallelConversationId}
        key={parallelConversationId}
      >
        {messages.map(mapFn)}
      </div>,
    );
  }

  const wrapperNode = (
    <section
      className="grid grid-cols-1 @3xl:grid-cols-2 gap-4 my-4 chat-parallel-msgs"
      data-side-by-side
      key={key}
    >
      {msgNodes}
    </section>
  );

  return normalizedBotConversationMessage.toggleHideParallelAnswers ? (
    <ParallelMsgDetails children={wrapperNode} key={key} />
  ) : (
    wrapperNode
  );
}

// eslint-disable-next-line react-refresh/only-export-components
const ParallelMsgDetails = memo(function ParallelMsgDetails({ children }: React.PropsWithChildren) {
  if (typeof window === "undefined") {
    return null;
  }

  const isStreaming = useIsStreaming();

  return (
    <details
      className="chat-parallel-msgs my-6 group/toggle-hide-parallel-answers"
      open={isStreaming}
    >
      <summary className="list-none [&::-webkit-details-marker]:hidden text-xs text-muted gap-2 select-none">
        <div className="chat-grid w-full">
          <div className="chat-content flex items-center gap-2 bg-parallel-msg shadow-lg shadow-black/20 rounded-lg button-hover px-4 py-2 border border-border-smooth/20">
            <ChevronRight className="size-4 group-open/toggle-hide-parallel-answers:rotate-90" />

            <span>Internal/External Search</span>
          </div>
        </div>
      </summary>

      {children}
    </details>
  );
});

function handleNormalMessages(
  message: NonNullable<NormalizedBotConversationMessage["message"]>,
  withNotebookBlocks: boolean,
) {
  let msgNode = null;

  switch (message.message_type) {
    case BotConversationMessageType.Reflection_Selection_Facilitator_Message:
    case BotConversationMessageType.Tool_Selection_Facilitator_Message: {
      msgNode = <ReflectionSelectionFacilitatorMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.AI_Generated_Search_Query: {
      msgNode = <AIGeneratedSearchQuery msg={message} />;
      break;
    }

    case BotConversationMessageType.Tool_Selection_Response: {
      msgNode = <ToolSelectionResponse msg={message} />;
      break;
    }

    case BotConversationMessageType.Plan_Next_Step_Response: {
      msgNode = <PlanNextStepResponse msg={message} />;
      break;
    }

    case BotConversationMessageType.Notebook_Block_User_Image_Message: {
      msgNode = <NotebookBlockMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Notebook_Block_Message: {
      msgNode = withNotebookBlocks ? <NotebookBlockMessage msg={message} /> : null;
      break;
    }

    case BotConversationMessageType.First_System_Message: {
      msgNode = <FirstSystemMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Refining_Plan_Message: {
      // @ts-expect-error => Ignore
      msgNode = <RefiningPlanMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Reflection_Message: {
      msgNode = <ReflectionMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Sources_Message: {
      // @ts-expect-error => Ignore
      msgNode = <SourcesMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Tool_Response: {
      msgNode = <ToolResponse msg={message} />;
      break;
    }

    case BotConversationMessageType.User_Message: {
      // @ts-expect-error => Ignore
      msgNode = <UserMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.AI_Response: {
      // @ts-expect-error => Ignore
      msgNode = <AIResponse msg={message} />;
      break;
    }

    case BotConversationMessageType.Start_Model_Response:
    case BotConversationMessageType.Start_Tool_Message: {
      // @ts-expect-error => Ignore
      msgNode = <StartMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Complete_Model_Response:
    case BotConversationMessageType.Complete_Tool_Message: {
      // @ts-expect-error => Ignore
      msgNode = <EndMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.General_Intermediate_Message: {
      msgNode = <GeneralIntermediateMessage msg={message} />;
      break;
    }

    case BotConversationMessageType.Relevant_Urls_Message: {
      msgNode = <RelevantUrlsMessage msg={message} />;
      break;
    }

    default: {
      // assertUnreachable(message.message_type);

      if ((message as BotConversationMessage).show_as_intermediate_step) {
        msgNode = (
          <IntermediateMessageDefaultHandler
            key={(message as BotConversationMessage).id}
            msg={message as BotConversationMessage}
          />
        );

        break;
      }

      msgNode = (
        <DefaultMessageHandler
          key={(message as BotConversationMessage).id}
          msg={message as BotConversationMessage}
        />
      );

      break;
    }
  }

  return (
    <DefaultSuspenseAndErrorBoundary
      fallbackFor="RenderBotConversationMessage"
      failedText="Failed to render message!"
      failedClassName="chat-content"
      key={message.id}
    >
      <ClientOnly>{msgNode}</ClientOnly>
    </DefaultSuspenseAndErrorBoundary>
  );
}
