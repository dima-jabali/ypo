import { CheckCheck } from "lucide-react";
import { memo, useRef } from "react";

import { SourcesForUser } from "#/features/sources-for-user/sources-for-user";
import { messageDateFormatter } from "#/helpers/utils";
import { useShouldShowSources } from "#/hooks/use-should-show-sources";
import {
	BotConversationMessageSenderType,
	BotConversationMessageStatus,
	type BotConversationMessage,
} from "#/types/chat";
import { LOADER } from "../Button";
import { Markdown } from "../Markdown/Markdown";
import { MessageWrapper } from "./MessageWrapper";
import { BOT_IMG } from "./messageHelpers";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

type Props = {
	msg: BotConversationMessage;
};

export const DefaultMessageHandler = memo(function DefaultMessageHandler({
	msg,
}: Props) {
	const innerWrapperRef = useRef<HTMLDivElement>(null);

	const shouldShowSources = useShouldShowSources(msg.parallel_conversation_id);
	const botName = generalContextStore.use.chatBotAgentName();

	const userInfo = msg.sender.sender_info
		? `${msg.sender.sender_info.first_name} ${msg.sender.sender_info.last_name}\n${msg.sender.sender_info.email}`
		: undefined;
	const createdAt = messageDateFormatter.format(new Date(msg.created_at));

	const hasFailedToSendMessage =
		msg.message_status === BotConversationMessageStatus.Error;
	const isBot =
		msg.sender.sender_type !== BotConversationMessageSenderType.User;
	const isMessageSent =
		msg.message_status === BotConversationMessageStatus.Complete;
	const isSendingMessage = !isMessageSent && !hasFailedToSendMessage;

	return (
		<MessageWrapper
			title="Default Message Handler"
			data-default-message-handler
			data-id={msg.id}
		>
			<div className="flex w-full flex-col gap-1" ref={innerWrapperRef}>
				<section className="flex items-center gap-2">
					{BOT_IMG}

					<div className="h-fit flex gap-2 items-center">
						<p className="text-sm text-muted font-bold" title={userInfo}>
							{botName}
						</p>

						<p className="text-xs text-muted" title={createdAt}>
							{createdAt}
						</p>
					</div>
				</section>

				{msg.text ? (
					<div className="pl-10 text-base">
						<Markdown text={msg.text} />
					</div>
				) : null}

				{isBot ? null : (
					<footer className="flex w-full items-center justify-end gap-1 text-primary">
						<span
							className="flex items-center justify-center p-1"
							title={
								isMessageSent
									? "Message sent"
									: hasFailedToSendMessage
										? "Failed to send message"
										: "Sending message..."
							}
						>
							{isSendingMessage ? (
								LOADER
							) : (
								<CheckCheck
									className="size-4 fill-primary data-[has-failed-to-send=true]:fill-destructive data-[is-message-sent=true]:fill-green-600"
									data-has-failed-to-send={hasFailedToSendMessage}
									data-is-message-sent={isMessageSent}
								/>
							)}
						</span>
					</footer>
				)}
			</div>

			<SourcesForUser sources={msg.sources} shouldShow={shouldShowSources} />
		</MessageWrapper>
	);
});

DefaultMessageHandler.whyDidYouRender = true;
