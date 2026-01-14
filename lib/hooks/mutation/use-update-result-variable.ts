import { useMutation } from "@tanstack/react-query";
import type { EmptyObject } from "type-fest";
import { useMemo } from "react";

import { clientAPI_V1 } from "#/api";
import {
	useWithBotConversationId,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import type { NotebookBlockUuid } from "#/types/notebook";
import {
	PostBlockActionType,
	type EditResultVariableAction,
	type EditResultVariableActionInfo,
	type PostBlockResponse,
} from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import { queryKeyFactory } from "@/hooks/query-keys";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

export function useUpdateResultVariable(blockUuid: NotebookBlockUuid) {
	const botConversationId = useWithBotConversationId();
	const organizationId = useWithOrganizationId();
	const notebookId = useDownloadedNotebookId();

	const mutationKey = useMemo(
		() => queryKeyFactory.post["update-result-variable"](blockUuid).queryKey,
		[blockUuid],
	);

	return useMutation({
		mutationKey,

		meta: {
			errorTitle: "Error updating result variable!",
		},

		mutationFn: async (action_info: EditResultVariableActionInfo) => {
			const updateOutputVariableAction: EditResultVariableAction = {
				action_type: PostBlockActionType.EditResultVariable,
				action_info,
			};

			const res = await clientAPI_V1.post<PostBlockResponse<EmptyObject>>(
				`/blocks/${blockUuid}/action`,
				updateOutputVariableAction,
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
