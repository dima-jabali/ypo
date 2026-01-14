import { Trash } from "lucide-react";
import { memo } from "react";

import { useDownloadedNotebookId } from "#/hooks/fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "#/hooks/mutation/use-patch-notebook-blocks";
import { NotebookActionType, type NotebookBlockUuid } from "#/types/notebook";
import { createISODate } from "#/helpers/utils";
import {
	generalContextStore,
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";

type Props = {
	blockUuid: NotebookBlockUuid;
};

export const DeleteBlockFloatingButton = memo(
	function DeleteBlockFloatingButton(props: Props) {
		const isNotebookMode = generalContextStore.use.isNotebookMode();
		const isStreaming = useIsStreaming();

		return isNotebookMode && !isStreaming ? <DeleteBlock {...props} /> : null;
	},
);

function DeleteBlock({ blockUuid }: Props) {
	const botConversationId = useWithBotConversationId();
	const patchNotebookBlocks = usePatchNotebookBlocks();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();

	function handleDeleteBlock() {
		patchNotebookBlocks.mutate({
			timestamp: createISODate(),
			botConversationId,
			organizationId,
			notebookId,
			updates: [
				{
					action_type: NotebookActionType.DeleteBlock,
					action_info: {
						block_uuid: blockUuid,
					},
				},
			],
		});
	}

	return (
		<button
			className="absolute -right-8 top-0 size-6 button-hover rounded-md flex items-center justify-center invisible group-hover/block:visible hover:visible pointer-events-auto"
			onClick={handleDeleteBlock}
			title="Delete this block"
		>
			<Trash className="size-3 text-border-smooth" />
		</button>
	);
}
