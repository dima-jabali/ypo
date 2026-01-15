import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { createISODate } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { ISODateString } from "#/types/general";
import type { QueryUuid } from "#/types/notebook";
import {
	PostBlockActionType,
	type PostBlockResponse,
} from "#/types/post-block-update-types";

type UnverifyQueryActionInfo = {
	query_uuid: QueryUuid;
};

type UnverifyQueryAction = {
	action_type: PostBlockActionType.UnverifyQuery;
	action_info: UnverifyQueryActionInfo;
	timestamp: ISODateString;
};

type UnverifyQueryRequest = {
	action_info: UnverifyQueryActionInfo;
	blockUuid: string;
};

type UnverifyQueryResponse = PostBlockResponse<{
	code?: string;
	error?: string;
}>;

const mutationKey =
	queryKeyFactory.post["block-request"]._ctx["unverify-sql-code"].queryKey;

export function useUnverifySqlCode() {
	return useMutation<UnverifyQueryResponse, Error, UnverifyQueryRequest>({
		mutationKey,

		mutationFn: async (args) => {
			const path = `/blocks/${args.blockUuid}/action`;

			const action: UnverifyQueryAction = {
				action_type: PostBlockActionType.UnverifyQuery,
				action_info: args.action_info,
				timestamp: createISODate(),
			};

			const res = await clientAPI_V1.post<UnverifyQueryResponse>(path, action);

			return res.data;
		},

		meta: {
			errorTitle: "Error unverifying SQL code!",
		},
	});
}
