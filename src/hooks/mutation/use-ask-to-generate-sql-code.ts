import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { type NotebookBlockUuid } from "#/types/notebook";
import {
  PostBlockActionType,
  type WriteSqlAction,
  type WriteSqlResponse,
} from "#/types/post-block-update-types";
import { queryKeyFactory } from "../query-keys";

const mutationKey = queryKeyFactory.post["ask-to-generate-sql-code"].queryKey;

type WriteSqlArgs = {
  action_info: WriteSqlAction["action_info"];
  blockUuid: NotebookBlockUuid;
};

export function useAskToGenerateSqlCode() {
  return useMutation({
    mutationKey,

    meta: {
      errorTitle: "Error generating Python code with AI!",
    },

    mutationFn: async (args: WriteSqlArgs) => {
      const body: WriteSqlAction = {
        action_type: PostBlockActionType.WriteSql,
        action_info: args.action_info,
      };

      const res = await clientAPI_V1.post<WriteSqlResponse>(
        `/blocks/${args.blockUuid}/action`,
        body,
      );

      const error = res.data.action_output?.error;
      if (error) {
        throw new Error(error);
      }

      return res.data;
    },
  });
}
