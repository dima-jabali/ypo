import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
	BotConversationMessageStatus,
	type BotConversationMessage,
} from "#/types/chat";
import { MessageWrapper } from "./MessageWrapper";
import { closeDetails } from "./common";
import {
	ANIMATED_DOTS,
	CHEVRON_RIGHT,
	DOUBLE_CHECK,
	THINKING_SPAN,
} from "./icons";
import { getMatchingReasoningText } from "./messageHelpers";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
	msg: BotConversationMessage;
};

export const ReflectionSelectionFacilitatorMessage = memo(
	function ReflectionSelectionFacilitatorMessage({ msg }: Props) {
		const isMessageComplete =
			msg.message_status === BotConversationMessageStatus.Complete;

		const detailsInitialProps = useState(
			isMessageComplete ? undefined : { open: true },
		)[0];

		const detailsRef = useRef<HTMLDetailsElement>(null);

		const showIntermediateMessage =
			generalContextStore.use.showIntermediateMessages();
		const shouldShowSources = useShouldShowSources(
			msg.parallel_conversation_id,
		);

		useEffect(() => {
			if (isMessageComplete && detailsRef.current && detailsRef.current.open) {
				closeDetails(detailsRef.current);
			}
		}, [isMessageComplete]);

		if (
			isMessageComplete &&
			!showIntermediateMessage &&
			(!msg.sources || msg.sources.length === 0)
		) {
			return null;
		}

		const isParallelMessage = isValidNumber(msg.parallel_conversation_id);

		return (
			<MessageWrapper
				title="Reflection Selection Facilitator Message"
				data-reflection-selection-facilitator-message
				className="text-muted-foreground text-xs"
				data-id={msg.id}
			>
				{showIntermediateMessage ? (
					<details
						className="w-full group"
						{...detailsInitialProps}
						ref={detailsRef}
					>
						<summary className="z-10 @[450px]:ml-[25%] w-fit flex px-0 select-none cursor-pointer">
							<div
								className="z-10 bg-notebook px-3.5 w-fit text-nowrap text-xs flex items-center gap-1 data-[is-parallel-msg=true]:bg-parallel-msg"
								data-is-parallel-msg={isParallelMessage}
							>
								<span className="group-open:rotate-90">{CHEVRON_RIGHT}</span>

								<i className="whitespace-nowrap">
									{getMatchingReasoningText(msg)}
								</i>

								{isMessageComplete ? DOUBLE_CHECK : ANIMATED_DOTS}
							</div>
						</summary>
					</details>
				) : isMessageComplete ? null : (
					THINKING_SPAN
				)}

				<SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
			</MessageWrapper>
		);
	},
);

ReflectionSelectionFacilitatorMessage.whyDidYouRender = true;
