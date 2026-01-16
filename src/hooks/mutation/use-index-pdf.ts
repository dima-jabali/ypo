import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import type { NotebookBlockUuid } from "#/types/notebook";
import { PostBlockActionType, type PostBlockResponse } from "#/types/post-block-update-types";

export type IndexPDFAction = {
  action_type: PostBlockActionType.IndexPDF;
  action_info: Record<never, never>;
  timestamp: ISODateString;
};

type IndexPdfRequest = {
  blockUuid: NotebookBlockUuid;
};

type IndexPdfResponse = PostBlockResponse<void>;

const mutationKey = queryKeyFactory.post["block-request"]._ctx["index-pdf"].queryKey;

export function useIndexPdf() {
  return useMutation<IndexPdfResponse, Error, IndexPdfRequest>({
    mutationKey,

    mutationFn: async (args) => {
      const path = `/blocks/${args.blockUuid}/action`;

      const indexPdfAction: IndexPDFAction = {
        action_type: PostBlockActionType.IndexPDF,
        timestamp: createISODate(),
        action_info: {},
      };

      const indexPdfResponse = await clientAPI_V1.post<IndexPdfResponse>(path, indexPdfAction);

      return indexPdfResponse.data;
    },

    meta: {
      errorTitle: "Error indexing PDF file!",
    },
  });
}
