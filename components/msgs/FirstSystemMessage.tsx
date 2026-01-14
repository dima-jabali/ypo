import { memo, useRef } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { messageDateFormatter } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import type { BotConversationMessage } from "#/types/chat";
import { Markdown } from "../Markdown/Markdown";
import { MessageWrapper } from "./MessageWrapper";
import { BOT_IMG } from "./messageHelpers";

type Props = {
	msg: BotConversationMessage;
};

export const FirstSystemMessage = memo(function FirstSystemMessage({
	msg,
}: Props) {
	const innerWrapperRef = useRef<HTMLDivElement>(null);

	const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);
	const botName = generalContextStore.use.chatBotAgentName();

	const userInfo = msg.sender.sender_info
		? `${msg.sender.sender_info.first_name} ${msg.sender.sender_info.last_name}\n${msg.sender.sender_info.email}`
		: undefined;
	const createdAt = messageDateFormatter.format(new Date(msg.created_at));

	return (
		<MessageWrapper
			title="First System Message"
			data-first-system-message
			data-id={msg.id}
		>
			{/* Profile picture */}
			{BOT_IMG}

			<div className="flex w-full flex-col gap-1" ref={innerWrapperRef}>
				{/* Name and hour */}
				<section className="flex items-center gap-2">
					<p className="text-sm font-bold" title={userInfo}>
						{botName}
					</p>

					<p className="text-xs tabular-nums text-primary" title={createdAt}>
						{createdAt}
					</p>
				</section>

				{msg.text ? <Markdown text={msg.text} /> : null}
			</div>

			<SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
		</MessageWrapper>
	);
});

FirstSystemMessage.whyDidYouRender = true;
