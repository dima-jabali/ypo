import { useFetchBotConversationMessageListPage } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";

export function WithBotConversationMessageList({
	children,
}: React.PropsWithChildren) {
	return (
		<WithBotConversationMessageList_>
			{children}
		</WithBotConversationMessageList_>
	);
}

function WithBotConversationMessageList_({
	children,
}: React.PropsWithChildren) {
	// Destructure to not trigger a re-render when the value changes:
	const { isEnabled: isFetchBotConversationMessageListPageEnabled } =
		useFetchBotConversationMessageListPage(); // This will trigger a Suspense.

	// Just so it doesn't get compiled away:
	if (!isFetchBotConversationMessageListPageEnabled) {
		console.log({
			isFetchBotConversationMessageListPageEnabled,
		});
	}

	return children;
}
