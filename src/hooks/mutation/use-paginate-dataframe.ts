import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import type { BlockFilterAndSort, NotebookBlockUuid } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";

type PaginateDataFrameActionInfo = {
  filters: BlockFilterAndSort;
  offset: number;
  limit: number;
};

type PaginateDataFrameAction = {
  action_type: PostBlockActionType.PaginateDataframe;
  action_info: PaginateDataFrameActionInfo;
  timestamp: ISODateString;
};

type PaginateDataframeRequest = {
  action_info: PaginateDataFrameAction["action_info"];
  blockUuid: NotebookBlockUuid;
};

export type PaginateDataframeOutput<T = unknown> = {
  num_rows: number;
  data: T[];
};

type PaginateDataframeResponse<T = unknown> = PostBlockResponse<PaginateDataframeOutput<T>>;

const mutationKey = queryKeyFactory.post["block-request"]._ctx["paginate-dataframe"].queryKey;

export function usePaginateDataframe() {
  return useMutation<PaginateDataframeResponse, Error, PaginateDataframeRequest>({
    mutationKey,

    mutationFn: async (args) => {
      const path = `/blocks/${args.blockUuid}/action`;

      const paginateAction: PaginateDataFrameAction = {
        action_type: PostBlockActionType.PaginateDataframe,
        action_info: args.action_info,
        timestamp: createISODate(),
      };

      const res = await clientAPI_V1.post<PaginateDataframeResponse>(path, paginateAction);

      return res.data;
    },

    meta: {
      errorTitle: "Error paginating dataframe!",
    },
  });
}
