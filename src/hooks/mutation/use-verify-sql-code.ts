import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import type { NotebookBlockUuid } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";

type VerifyQueryActionInfo = {
  description: string;
  query: string;
};

type VerifyQueryAction = {
  action_type: PostBlockActionType.VerifyQuery;
  action_info: VerifyQueryActionInfo;
  timestamp: ISODateString;
};
type VerifyQueryRequest = {
  action_info: VerifyQueryAction["action_info"];
  blockUuid: NotebookBlockUuid;
};

type VerifyQueryResponse = PostBlockResponse<{ code?: string; error?: string }>;

const mutationKey = queryKeyFactory.post["block-request"]._ctx["verify-sql-code"].queryKey;

export function useVerifySqlCode() {
  return useMutation<VerifyQueryResponse, Error, VerifyQueryRequest>({
    mutationKey,

    meta: {
      errorTitle: "Error verifying SQL code!",
    },

    mutationFn: async (args) => {
      const path = `/blocks/${args.blockUuid}/action`;

      const action: VerifyQueryAction = {
        action_type: PostBlockActionType.VerifyQuery,
        action_info: args.action_info,
        timestamp: createISODate(),
      };

      const res = await clientAPI_V1.post<VerifyQueryResponse>(path, action);

      return res.data;
    },
  });
}
