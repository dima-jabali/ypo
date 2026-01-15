import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { KernelResult, NotebookBlockUuid } from "#/types/notebook";
import {
	PostBlockActionType,
	type PostBlockResponse,
} from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import type { PaginateDataframeOutput } from "./use-paginate-dataframe";

type RunPythonBlockActionInfo = {
	code: string;
};

type RunPythonBlockAction = {
	action_type: PostBlockActionType.RunPythonBlock;
	action_info: RunPythonBlockActionInfo;
};

type RunPythonRequest = {
	action_info: RunPythonBlockActionInfo;
};

type RunPythonResponse = PostBlockResponse<
	PaginateDataframeOutput<KernelResult>
>;

export function useRunPython(blockUuid: NotebookBlockUuid) {
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();

	return useMutation<RunPythonResponse, Error, RunPythonRequest>({
		mutationKey:
			queryKeyFactory.post["block-request"]._ctx["run-python"](blockUuid)
				.queryKey,

		meta: {
			errorTitle: "Error running Python code!",
		},

		mutationFn: async (args) => {
			const action: RunPythonBlockAction = {
				action_type: PostBlockActionType.RunPythonBlock,
				action_info: args.action_info,
			};

			const res = await clientAPI_V1.post<RunPythonResponse>(
				`/blocks/${blockUuid}/action`,
				action,
			);

			if (res.data.action_output?.error) {
				throw new Error(res.data.action_output.error);
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
