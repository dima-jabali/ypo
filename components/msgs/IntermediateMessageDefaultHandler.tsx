import { memo, useEffect, useRef, useState } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { isValidNumber } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
	BotConversationMessageStatus,
	type BotConversationMessage,
} from "#/types/chat";
import { closeDetails } from "./common";
import { ANIMATED_DOTS, CHEVRON_RIGHT, DOUBLE_CHECK } from "./icons";
import { ReasoningPopover } from "./InfoPopover";
import { getMatchingReasoningText, hasInputsInJson } from "./messageHelpers";
import { makeExtraInfoListItem } from "./messageTypesHelpers";
import { MessageWrapper } from "./MessageWrapper";

type Props = {
	msg: BotConversationMessage;
};

const getJsonInfoOfToolSelectionResponseJson = (
	message: BotConversationMessage,
) => {
	if (!hasInputsInJson(message.json)) {
		return "";
	}

	const { inputs } = message.json.tool;
	const jsxs: React.ReactNode[] = [];

	if (typeof inputs === "object") {
		for (const key in inputs) {
			const value = Reflect.get(inputs, key);

			jsxs.push(makeExtraInfoListItem(key, value));
		}
	}

	return jsxs;
};

export const IntermediateMessageDefaultHandler = memo(
	function IntermediateMessageDefaultHandler({ msg }: Props) {
		const isMessageComplete =
			msg.message_status === BotConversationMessageStatus.Complete;
		const reasoning =
			msg.json &&
			"reasoning" in msg.json &&
			typeof msg.json.reasoning === "string"
				? msg.json.reasoning
				: "";

		const detailsInitialProps = useState(
			isMessageComplete ? undefined : { open: true },
		)[0];

		const detailsRef = useRef<HTMLDetailsElement>(null);

		const shouldShowSources = useShouldShowSources(
			msg.parallel_conversation_id,
		);

		useEffect(() => {
			if (isMessageComplete && detailsRef.current?.open) {
				closeDetails(detailsRef.current);
			}
		}, [isMessageComplete]);

		const isParallelMessage = isValidNumber(msg.parallel_conversation_id);
		const extraInfo = getJsonInfoOfToolSelectionResponseJson(msg);

		return (
			<MessageWrapper
				title="Intermediate Message Default Handler"
				className="text-muted-foreground text-xs"
				data-intermediate-message-default-handler
				data-id={msg.id}
			>
				<details
					className="w-full group"
					{...detailsInitialProps}
					ref={detailsRef}
				>
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
	},
);

IntermediateMessageDefaultHandler.whyDidYouRender = true;
