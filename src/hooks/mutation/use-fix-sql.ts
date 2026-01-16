import { useIsMutating, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import {
  KernelResultsTypes,
  NotebookActionType,
  UpdateBlockActionKey,
  type NotebookBlockUuid,
} from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";
import { useDownloadedNotebookId } from "../fetch/use-fetch-notebook";
import { usePatchNotebookBlocks } from "./use-patch-notebook-blocks";
import { useBlockStore } from "#/contexts/block-context";
import { FIXED_SQL_KERNEL_MSG } from "#/helpers/blocks";
import {
  useWithBotConversationId,
  useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";

type FixSqlActionInfo = {
  error: string;
  sql: string;
};

type FixSqlAction = {
  action_type: PostBlockActionType.FixSql;
  action_info: FixSqlActionInfo;
};

type FixSqlResponse = SuccessResponse | ErrorResponse;
type SuccessResponse = PostBlockResponse<{
  variables_to_display: Array<string>;
  notes: Array<string>;
  fixed_sql: string;
}>;
type ErrorResponse = PostBlockResponse<{ error: string }>;

export function useFixSql(blockUuid: NotebookBlockUuid) {
  const patchNotebookBlocks = usePatchNotebookBlocks().mutateAsync;
  const botConversationId = useWithBotConversationId();
  const organizationId = useWithOrganizationId();
  const notebookId = useDownloadedNotebookId();
  const blockStore = useBlockStore();

  const [mutationKey] = useState(
    () => queryKeyFactory.post["block-request"]._ctx["fix-sql"](blockUuid).queryKey,
  );

  return useMutation({
    mutationKey,

    mutationFn: async () => {
      const { monacoEditor, kernelResults } = blockStore.getState();

      if (!monacoEditor) {
        throw new Error("No SQL editor found!");
      }

      const sql = monacoEditor.getValue();

      if (!sql) {
        throw new Error("No SQL code found or it is empty!");
      }

      const errorsAsString = kernelResults
        .filter((kernelResult) => kernelResult.type === KernelResultsTypes.ERROR)
        .map((kernelResult) => kernelResult.value)
        .join("\n\n")
        .trim();

      if (!errorsAsString) {
        throw new Error("No error found to fix!");
      }

      const path = `/blocks/${blockUuid}/action`;

      const action: FixSqlAction = {
        action_type: PostBlockActionType.FixSql,
        action_info: {
          error: errorsAsString,
          sql,
        },
      };

      const res = await clientAPI_V1.post<FixSqlResponse>(path, action);

      if (isError(res.data)) {
        throw new Error(res.data.action_output.error);
      }

      await patchNotebookBlocks({
        timestamp: createISODate(),
        botConversationId,
        organizationId,
        notebookId,
        updates: [
          {
            action_type: NotebookActionType.UpdateBlock,
            action_info: {
              value: res.data.action_output.fixed_sql,
              key: UpdateBlockActionKey.Code,
              block_uuid: blockUuid,
            },
          },
        ],
      });

      return res.data;
    },

    onSuccess(data) {
      blockStore.setState((prev) => {
        if (prev.monacoEditor) {
          prev.monacoEditor.setValue(data.action_output.fixed_sql);
        }

        return { kernelResults: [FIXED_SQL_KERNEL_MSG] };
      });
    },

    meta: {
      errorTitle: "Error fixing SQL code!",
    },
  });
}

export function useIsFixingSql(blockUuid: NotebookBlockUuid) {
  const queryOptions = useMemo(
    () => ({
      mutationKey: queryKeyFactory.post["block-request"]._ctx["fix-sql"](blockUuid).queryKey,
    }),
    [blockUuid],
  );

  return useIsMutating(queryOptions) > 0;
}

function isError(res: FixSqlResponse): res is ErrorResponse {
  return !!res.action_output.error;
}
