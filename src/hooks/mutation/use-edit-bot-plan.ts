import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type { Plan, PlanStep } from "#/types/chat";
import type { PatchProjectResponseAction } from "#/types/post-block-update-types";
import { queryKeyFactory } from "../query-keys";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { BotConversationId, NotebookId, OrganizationId } from "#/types/general";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";
import { createISODate } from "#/helpers/utils";

export type EditBotPlanRequestProps = {
  bot_conversation_id: BotConversationId;
  organizationId: OrganizationId;
  notebookId: NotebookId;
  body: {
    /** Should be the whole plan */
    sub_tasks: {
      is_current_task?: boolean;
      sub_tasks?: PlanStep[];
      task?: string;
    }[];
    execute_plan: boolean;
    approved: boolean;
  };
};

type EditBotPlanResponse = {
  updates: PatchProjectResponseAction[] | null;
  plan: Plan | null;
  has_plan: boolean;
};

const mutationKey = queryKeyFactory.post["edit-bot-plan"].queryKey;

export function useEditBotPlan() {
  return useMutation({
    mutationKey,

    mutationFn: async (props: EditBotPlanRequestProps) => {
      const path = `/bot-conversations/${props.bot_conversation_id}/active-plan`;

      const res = await clientAPI_V1.put<EditBotPlanResponse>(path, props.body);

      return res.data;
    },

    onSuccess(response, variables) {
      generalContextStore
        .getState()
        .setBotPlan(
          variables.bot_conversation_id,
          variables.organizationId,
          variables.notebookId,
          response.plan || undefined,
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
      successTitle: "Bot's plan edited successfully!",
      errorTitle: "Failed to edit bot's plan!",
    },
  });
}
