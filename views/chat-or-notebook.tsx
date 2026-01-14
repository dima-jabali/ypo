import { PlateController } from "platejs/react";
import { memo } from "react";

import { EmptyFallbackSuspense } from "#/components/empty-fallback-suspense";
import { EmptyData } from "#/components/empty-states/empty-data";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { MessageInput } from "#/components/message-input";
import { PlanMessage } from "#/components/msgs/PlanMessage/PlanMessage";
import { OfflineBadge } from "#/components/offline-badge";
import { SetCurrentOrganizationPopover } from "#/components/set-current-organization-popover";
import { WithChatData } from "#/components/with-chat-data";
import { WithOrganizationIdAndList } from "#/components/with-organization-id-and-list";
import { ChatContextProvider, useChatStore } from "#/contexts/chat-context";
import {
	generalContextStore,
	MainPage,
	OrganizationSelectorPlacement,
} from "#/contexts/general-ctx/general-context";
import { SourceCitationContextProvider } from "#/contexts/source-citation-context";
import { AllSourcesInChatSidebar } from "#/features/all-sources-in-chat-sidebar";
import { CHAT_MESSAGE_LIST_HTML_ELEMENT_ID } from "#/helpers/utils";
import {
	useHasAnyMessage,
	useNormalizedMessages,
} from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { AutoScrollIfOnBottom } from "#/components/auto-scroll-if-on-bottom";
import { LoadMoreButton } from "#/components/load-more-button";
import { renderBotConversationMessage } from "#/components/msgs/render-bot-conversation-message";
import { ScrollToBottomButton } from "#/components/scroll-to-bottom-button";
import { ToggleNotebookMode } from "#/components/toggle-notebook-mode";
import { SlashProvider } from "#/features/notebook/components/slash-plugin/ctx";
import { Notebook } from "#/features/notebook/current-notebook";

export const ChatOrNotebook = memo(function ChatOrNotebook() {
	return (
		<SourceCitationContextProvider>
			<header className="@container flex items-center gap-4 justify-between w-full px-4 h-[38px] @3xl:h-[46px] bg-notebook print:hidden">
				<div className="flex items-center gap-4">
					<ToggleNotebookMode />

					<EmptyFallbackSuspense>
						<WithChatData>
							<AllSourcesInChatSidebar />
						</WithChatData>
					</EmptyFallbackSuspense>

					<OfflineBadge />
				</div>

				<MaybeOrgSelector />
			</header>

			<DefaultSuspenseAndErrorBoundary
				failedText="Something went wrong"
				fallbackFor="with-chat-data"
			>
				<WithChatData>
					<ChatContextProvider>
						<SlashProvider>
							<ChatOrNotebookSelector />
						</SlashProvider>
					</ChatContextProvider>
				</WithChatData>
			</DefaultSuspenseAndErrorBoundary>
		</SourceCitationContextProvider>
	);
});

function MaybeOrgSelector() {
	const organizationSelectorPlacement =
		generalContextStore.use.organizationSelectorPlacement();

	return organizationSelectorPlacement ===
		OrganizationSelectorPlacement.TOP_RIGHT ? (
		<EmptyFallbackSuspense>
			<WithOrganizationIdAndList>
				<SetCurrentOrganizationPopover />
			</WithOrganizationIdAndList>
		</EmptyFallbackSuspense>
	) : null;
}

function ChatOrNotebookSelector() {
	const mainPage = generalContextStore.use.mainPage();

	switch (mainPage) {
		case MainPage.Chats: {
			return <Chat />;
		}

		case MainPage.Notebook: {
			return <Notebook />;
		}

		default: {
			console.error("This should never be hit. ChatOrNotebookSelector");
			return null;
		}
	}
}

function Chat() {
	const hasAnyMessage = useHasAnyMessage();
	const chatStore = useChatStore();

	return (
		// `group/chat chat` are used to style text blocks:

		<div className="@container/chat relative flex h-[calc(100%-38px)] @3xl:h-[calc(100%-46px)] flex-col justify-between overflow-hidden group/chat">
			{hasAnyMessage ? (
				<ol
					className="chat-sm-grid @3xl:chat-md-grid max-h-full h-fit w-full max-w-full simple-scrollbar scrollbar-stable"
					ref={(ref) => chatStore.setState({ scrollContainer: ref })}
					id={CHAT_MESSAGE_LIST_HTML_ELEMENT_ID}
				>
					<LoadMoreButton />

					<Messages />

					<AutoScrollIfOnBottom />
				</ol>
			) : (
				<EmptyData title="No messages" description="Start a conversation" />
			)}

			<PlanMessage />

			<div className="chat-sm-grid @3xl:chat-md-grid w-full relative pr-(--simple-scrollbar-width)">
				{hasAnyMessage ? <ScrollToBottomButton /> : null}

				<PlateController>
					<DefaultSuspenseAndErrorBoundary
						failedText="Error in message input"
						fallbackFor="message-input"
					>
						<MessageInput />
					</DefaultSuspenseAndErrorBoundary>
				</PlateController>
			</div>
		</div>
	);
}

function Messages() {
	const normalizedMsgs = useNormalizedMessages(true);

	return normalizedMsgs.map(renderBotConversationMessage);
}
