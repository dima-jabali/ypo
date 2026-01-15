import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { WebCrawl } from "#/types/bot-source";
import type { OrganizationId } from "#/types/general";

export type CreateWebCrawlsOptionsForRequest = Pick<
	WebCrawl,
	| "dynamic_content_wait_seconds"
	| "expand_clickable_elements"
	| "initial_concurrency"
	| "include_url_globs"
	| "exclude_url_globs"
	| "aggressive_prune"
	| "max_concurrency"
	| "max_crawl_depth"
	| "use_sitemaps"
	| "description"
	| "max_results"
	| "start_urls"
	| "max_pages"
	| "name"
>;

export type CreateWebCrawlRequest = {
	organizationId: OrganizationId;
} & Partial<CreateWebCrawlsOptionsForRequest> & {
		run: boolean;
		name: string;
		max_results: number;
	};

export type CreateWebCrawlResponse = WebCrawl;

const mutationKey = queryKeyFactory.post["create-web-crawl"].queryKey;

export function useCreateWebCrawl() {
	return useMutation<CreateWebCrawlResponse, Error, CreateWebCrawlRequest>({
		mutationKey,

		mutationFn: async (args) => {
			const { organizationId, ...body } = args;

			const path = `/organizations/${organizationId}/web-crawls`;

			const res = await clientAPI_V1.post<CreateWebCrawlResponse>(path, body);

			return res.data;
		},

		async onSuccess(_, vars, __, ctx) {
			await ctx.client.invalidateQueries(
				queryKeyFactory.get["web-crawls-page"](vars.organizationId),
			);
		},
	});
}
