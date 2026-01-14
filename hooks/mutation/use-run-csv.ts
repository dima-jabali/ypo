import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import { clientAPI_V1 } from "#/api";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BlockFilterAndSort, NotebookBlockUuid } from "#/types/notebook";
import {
	PostBlockActionType,
	type PostBlockResponse,
} from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import type { PaginateDataframeOutput } from "./use-paginate-dataframe";

type RunCsvBlockActionInfo = {
	filters: BlockFilterAndSort;
	offset: number;
	limit: number;
};

type RunCsvBlockAction = {
	action_type: PostBlockActionType.RunCsvBlock;
	action_info: RunCsvBlockActionInfo;
};

type RunCsvRequest = {
	action_info: RunCsvBlockActionInfo;
};

type RunCsvBlockResponse<T = unknown> = PostBlockResponse<
	PaginateDataframeOutput<T>
>;

export function useRunCsv(blockUuid: NotebookBlockUuid) {
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();

	const mutationKey = useMemo(
		() =>
			queryKeyFactory.post["block-request"]._ctx["run-csv"](blockUuid).queryKey,
		[blockUuid],
	);

	return useMutation<RunCsvBlockResponse, Error, RunCsvRequest>({
		mutationKey,

		meta: {
			errorTitle: "Error running CSV block!",
		},

		mutationFn: async (args) => {
			const action: RunCsvBlockAction = {
				action_type: PostBlockActionType.RunCsvBlock,
				action_info: args.action_info,
			};

			const res = await clientAPI_V1.post<RunCsvBlockResponse>(
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
