import { memo } from "react";

import { ChatOrNotebook } from "#/views/chat-or-notebook";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";

export const ChatWithBatchTable: React.FC = memo(function ChatWithBatchTable() {
	return (
		<DefaultSuspenseAndErrorBoundary
			fallbackFor="ChatWithBatchTable"
			failedText="Something went wrong"
		>
			<ChatOrNotebook />
		</DefaultSuspenseAndErrorBoundary>
	);
});
