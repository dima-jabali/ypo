import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import { type NotebookBlockUuid } from "#/types/notebook";
import {
	PostBlockActionType,
	type WritePythonAction,
	type WritePythonResponse,
} from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import { queryKeyFactory } from "../query-keys";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

const mutationKey =
	queryKeyFactory.post["ask-to-generate-python-code"].queryKey;

type WritePythonArgs = {
	action_info: WritePythonAction["action_info"];
	blockUuid: NotebookBlockUuid;
};

export function useAskToGeneratePythonCode() {
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();

	return useMutation({
		mutationKey,

		meta: {
			errorTitle: "Error generating Python code with AI!",
		},

		mutationFn: async (args: WritePythonArgs) => {
			const body: WritePythonAction = {
				action_type: PostBlockActionType.WritePython,
				action_info: args.action_info,
			};

			const res = await clientAPI_V1.post<WritePythonResponse>(
				`/blocks/${args.blockUuid}/action`,
				body,
			);

			const error = res.data.action_output?.error;
			if (error) {
				throw new Error(error);
			}

			applyNotebookResponseUpdates({
				organizationId,
				response: {
					updates: res.data.action_output.notebook_updates ?? [],
					bot_conversation_id: botConversationId,
					timestamp: createISODate(),
					project_id: notebookId,
				},
			});

			return res.data;
		},
	});
}
