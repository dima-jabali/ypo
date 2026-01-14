import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import type {
	BotConversationId,
	NotebookId,
	OrganizationId,
} from "#/types/general";
import type { PatchProjectResponseAction } from "#/types/post-block-update-types";
import { queryKeyFactory } from "../query-keys";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

export type DeleteBotPlanRequestProps = {
	bot_conversation_id: BotConversationId;
	organizationId: OrganizationId;
	notebookId: NotebookId;
};

type DeleteActivePlanResponse = {
	updates: PatchProjectResponseAction[] | null;
};

const mutationKey = queryKeyFactory.delete["bot-plan"].queryKey;

export function useDeleteBotPlan() {
	return useMutation({
		mutationKey,

		mutationFn: async (props: DeleteBotPlanRequestProps) => {
			const path = `/bot-conversations/${props.bot_conversation_id}/active-plan`;

			const res = await clientAPI_V1.delete<DeleteActivePlanResponse>(path);

			return res.data;
		},

		onSuccess(response, variables) {
			generalContextStore
				.getState()
				.setBotPlan(
					variables.bot_conversation_id,
					variables.organizationId,
					variables.notebookId,
					undefined,
				);

			if (response.updates && response.updates.length > 0) {
				applyNotebookResponseUpdates({
					organizationId: variables.organizationId,
					response: {
						bot_conversation_id: variables.bot_conversation_id,
						project_id: variables.notebookId,
						timestamp: createISODate(),
						updates: response.updates,
					},
				});
			}
		},

		meta: {
			successTitle: "Bot's plan deleted successfully!",
			errorTitle: "Failed to delete bot's plan!",
		},
	});
}
