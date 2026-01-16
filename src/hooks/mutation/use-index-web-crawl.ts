import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { WebCrawl, WebCrawlId } from "#/types/bot-source";
import { queryKeyFactory } from "../query-keys";

type IndexWebCrawlRequest = WebCrawlId;
type IndexWebCrawlResponse = WebCrawl;

const mutationKey = queryKeyFactory.put["index-web-crawl"].queryKey;

export const useIndexWebCrawl = () => {
  const organizationId = generalContextStore.use.organizationId();

  return useMutation<IndexWebCrawlResponse, Error, IndexWebCrawlRequest>({
    mutationKey,

    mutationFn: async (webcrawlId: IndexWebCrawlRequest) => {
      const path = `/organizations/${organizationId}/web-crawls/${webcrawlId}`;

      const res = await clientAPI_V1.put<IndexWebCrawlResponse>(path, {
        run: true,
      });

      return res.data;
    },

    meta: {
      invalidateQuery: queryKeyFactory.get["web-crawls-page"](organizationId),
      cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
    },
  });
};
