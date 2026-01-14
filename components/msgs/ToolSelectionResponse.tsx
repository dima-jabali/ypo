import { memo, useEffect, useRef, useState } from "react";
import { titleCase } from "scule";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
	type BotConversationMessage,
	BotConversationMessageStatus,
	type BotConversationMessageType,
} from "#/types/chat";
import { closeDetails } from "./common";
import {
	ANIMATED_DOTS,
	CHEVRON_RIGHT,
	DOUBLE_CHECK,
	SELECTING_TOOL,
} from "./icons";
import { ReasoningPopover } from "./InfoPopover";
import { getMatchingReasoningText } from "./messageHelpers";
import { getJsonInfoOfToolResponseJson } from "./messageTypesHelpers";
import { MessageWrapper } from "./MessageWrapper";

type Props = {
	msg: ToolSelectionResponseMessage;
};

export type ToolSelectionResponseMessage = BotConversationMessage & {
	message_type: BotConversationMessageType.Tool_Selection_Response;
};

const getSelectedResponse = (message: ToolSelectionResponseMessage) => {
	const selectedResponse =
		message.json &&
		"tool" in message.json &&
		message.json.tool &&
		"name" in message.json.tool &&
		message.json.tool.name &&
		typeof message.json.tool.name === "string"
			? message.json.tool.name
			: "";

	return titleCase(selectedResponse.toLowerCase());
};

export const ToolSelectionResponse = memo(function ToolSelectionResponse({
	msg,
}: Props) {
	const isMessageComplete =
		msg.message_status === BotConversationMessageStatus.Complete;

	const detailsInitialProps = useState(
		isMessageComplete ? undefined : { open: true },
	)[0];

	const detailsRef = useRef<HTMLDetailsElement>(null);

	const showIntermediateMessage =
		generalContextStore.use.showIntermediateMessages();
	const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);

	useEffect(() => {
		if (isMessageComplete && detailsRef.current && detailsRef.current.open) {
			closeDetails(detailsRef.current);
		}
	}, [isMessageComplete]);

	const reasoning =
		typeof msg.json?.reasoning === "string" ? msg.json.reasoning : "";
	const isParallelMsg = isValidNumber(msg.parallel_conversation_id);
	const extraInfo = getJsonInfoOfToolResponseJson(msg);

	return (
		<MessageWrapper
			className="text-muted-foreground"
			title="Tool Selection Response"
			data-tool-selection-response
			data-id={msg.id}
		>
			{showIntermediateMessage ? (
				<details
					className="w-full group text-xs"
					{...detailsInitialProps}
					ref={detailsRef}
				>
					<summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer">
						<div
							className="z-10 bg-notebook px-3.5 w-fit text-nowrap flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg group-even/chat-messages:bg-aside group-odd/chat-messages:bg-aside"
							data-is-parallel-msg={isParallelMsg}
						>
							<span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

							<i className="whitespace-pre-wrap">
								{getMatchingReasoningText(msg)}:
								<strong> {getSelectedResponse(msg)}</strong>
							</i>

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
			) : isMessageComplete ? null : (
				SELECTING_TOOL
			)}

			<SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
		</MessageWrapper>
	);
});

ToolSelectionResponse.whyDidYouRender = true;
