import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import { clientAPI_V1 } from "#/api";
import {
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BlockFilterAndSort, NotebookBlockUuid } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

type RunSqlActionInfo = {
  filters: BlockFilterAndSort;
  offset: number;
  limit: number;
  sql: string;
};

type RunSqlAction = {
  action_type: PostBlockActionType.RunSqlBlock;
  action_info: RunSqlActionInfo;
};

type RunSqlRequestRequest = {
  action_info: RunSqlActionInfo;
};

type RunSqlResponse<T = unknown> = PostBlockResponse<{
  file_name: string;
  num_rows: number;
  data: T[];
}>;

export function useRunSql(blockUuid: NotebookBlockUuid) {
  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId();

  const mutationKey = useMemo(
    () => queryKeyFactory.post["block-request"]._ctx["run-sql"](blockUuid).queryKey,
    [blockUuid],
  );

  return useMutation({
    mutationKey,

    meta: {
      errorTitle: "Error running SQL code!",
    },

    mutationFn: async (args: RunSqlRequestRequest) => {
      const path = `/blocks/${blockUuid}/action`;

      const action: RunSqlAction = {
        action_type: PostBlockActionType.RunSqlBlock,
        action_info: args.action_info,
      };

      const res = await clientAPI_V1.post<RunSqlResponse>(path, action);

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
