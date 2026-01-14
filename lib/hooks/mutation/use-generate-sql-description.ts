import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import {
	PostBlockActionType,
	type PostBlockResponse,
} from "#/types/post-block-update-types";

export type GenerateDescriptionActionInfo = {
	return_original_prompt: boolean;
	query: string;
};

export type GenerateDescriptionAction = {
	action_type: PostBlockActionType.GenerateDescription;
	action_info: GenerateDescriptionActionInfo;
	timestamp: ISODateString;
};
type GenerateDescriptionRequest = {
	action_info: GenerateDescriptionAction["action_info"];
	blockUuid: string;
};

type GenerateSqlDescriptionResponse = PostBlockResponse<{
	description: string;
}>;

const mutationKey =
	queryKeyFactory.post["block-request"]._ctx["generate-sql-description"]
		.queryKey;

export function useGenerateSqlDescription() {
	return useMutation<
		GenerateSqlDescriptionResponse,
		Error,
		GenerateDescriptionRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const path = `/blocks/${args.blockUuid}/action`;

			const paginateAction: GenerateDescriptionAction = {
				action_type: PostBlockActionType.GenerateDescription,
				action_info: args.action_info,
				timestamp: createISODate(),
			};

			const res = await clientAPI_V1.post<GenerateSqlDescriptionResponse>(
				path,
				paginateAction,
			);

			return res.data;
		},

		meta: {
			errorTitle: "Error generating SQL description!",
		},
	});
}
