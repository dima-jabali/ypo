import { WithBotConversationId } from "#/components/with-bot-conversation-id";
import { AssureBotConversationBelongsToNotebook } from "./assure-bot-conversation-belongs-to-notebook";
import { AssureNotebookBelongsToOrg } from "./assure-notebook-belongs-to-org";
import { WithBotConversationMessageList } from "./with-bot-conversation-message-list";
import { WithNotebook } from "./with-notebook";
import { WithNotebookIdAndList } from "./with-notebook-id-and-list";
import { WithSettings } from "./with-settings";

export function WithChatData({
	children,
	fallback,
}: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
	return children;
	
	return (
		<WithNotebookIdAndList>
			<WithNotebook>
				<WithSettings>
					<WithBotConversationId fallback={fallback}>
						<AssureNotebookBelongsToOrg>
							<WithBotConversationMessageList>
								<AssureBotConversationBelongsToNotebook>
									{children}
								</AssureBotConversationBelongsToNotebook>
							</WithBotConversationMessageList>
						</AssureNotebookBelongsToOrg>
					</WithBotConversationId>
				</WithSettings>
			</WithNotebook>
		</WithNotebookIdAndList>
	);
}
