import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import type { Website } from "#/types/bot-source";
import { queryKeyFactory } from "@/hooks/query-keys";

type IndexWebsiteRequest = {
	website_url: string;
};

type IndexWebsiteResponse = Website;

const mutationKey = queryKeyFactory.post["index-web-source"].queryKey;

export const useIndexWebSource = () => {
	const organizationId = generalContextStore.use.organizationId();

	return useMutation<IndexWebsiteResponse, Error, IndexWebsiteRequest>({
		mutationKey,

		mutationFn: async (body: IndexWebsiteRequest) => {
			const path = `/organizations/${organizationId}/websites`;

			Reflect.set(body, "index_refresh", false);
			Reflect.set(body, "index", true);

			const res = await clientAPI_V1.post<IndexWebsiteResponse>(path, body);

			return res.data;
		},

		meta: {
			invalidateQuery: queryKeyFactory.get["bots-page"](organizationId),
			cancelQuery: queryKeyFactory.get["bots-page"](organizationId),
		},
	});
};
