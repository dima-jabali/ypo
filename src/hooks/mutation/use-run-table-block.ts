import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { clientAPI_V1 } from "#/api";
import { useBlockStore } from "#/contexts/block-context";
import {
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BlockFilterAndSort } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import type { PaginateDataframeOutput } from "./use-paginate-dataframe";
import { applyNotebookResponseUpdates } from "#/helpers/apply-notebook-response-updates";

type RunTableBlockActionInfo = {
  filters: BlockFilterAndSort;
  offset: number;
  limit: number;
};

type RunTableBlockAction = {
  action_type: PostBlockActionType.RunTableBlock;
  action_info: RunTableBlockActionInfo;
};

type RunSqlRequestRequest = {
  action_info: RunTableBlockActionInfo;
};

type RunTableBlockResponse = SuccessResponse | ErrorResponse;
type SuccessResponse<T = unknown> = PostBlockResponse<PaginateDataframeOutput<T>>;
type ErrorResponse = PostBlockResponse<{ error: string }>;

export function useRunTableBlock() {
  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId();
  const blockStore = useBlockStore();
  const blockUuid = blockStore.use.blockUuid();

  const [mutationKey] = useState(
    () => queryKeyFactory.post["block-request"]._ctx["run-table-block"](blockUuid).queryKey,
  );

  return useMutation({
    mutationKey,

    meta: {
      errorTitle: "Error running Table block!",
    },

    mutationFn: async (args: RunSqlRequestRequest) => {
      const path = `/blocks/${blockUuid}/action`;

      const action: RunTableBlockAction = {
        action_type: PostBlockActionType.RunTableBlock,
        action_info: args.action_info,
      };

      const res = await clientAPI_V1.post<RunTableBlockResponse>(path, action);

      if (isError(res.data)) {
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

function isError(res: RunTableBlockResponse): res is ErrorResponse {
  return !!res.action_output.error;
}
