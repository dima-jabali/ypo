import {
	useMutation,
	useQueryClient,
	type InvalidateQueryFilters,
	type MutationObserverOptions,
	type QueryFilters,
} from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import type { OrganizationId } from "#/types/general";
import type {
	BetterbrainUserId,
	OrganizationMemberRole,
} from "#/types/notebook";
import { queryKeyFactory } from "@/hooks/query-keys";
import type { OrganizationMember } from "./use-invite-user-to-org";

type UpdateOrgMemberRequest = {
	/** Use it if you want to update the role. Leave empty for adding a user to org */
	role?: OrganizationMemberRole;
	userId: BetterbrainUserId;
	orgId: OrganizationId;
};
type UpdateOrgMemberResponse = AxiosResponse<{
	organization_member: OrganizationMember;
}>;

const ALL_ORGANIZATIONS_QUERY_KEY =
	queryKeyFactory.get["all-organizations"].queryKey;
const mutationKey = queryKeyFactory.put["update-org-user"].queryKey;

const cancelOrInvalidateQueriesParams: QueryFilters | InvalidateQueryFilters = {
	queryKey: ALL_ORGANIZATIONS_QUERY_KEY,
};

export const useUpdateOrgMember = () => {
	const queryClient = useQueryClient();

	queryClient.setMutationDefaults(mutationKey, {
		onSuccess: async () =>
			await queryClient.invalidateQueries(cancelOrInvalidateQueriesParams),
		onMutate: async () =>
			await queryClient.cancelQueries(cancelOrInvalidateQueriesParams),
	} satisfies MutationObserverOptions<
		UpdateOrgMemberResponse,
		Error,
		UpdateOrgMemberRequest
	>);

	return useMutation<UpdateOrgMemberResponse, Error, UpdateOrgMemberRequest>({
		mutationKey,

		mutationFn: async (args: UpdateOrgMemberRequest) => {
			const path = `/organizations/${args.orgId}/users/${args.userId}`;

			return await clientAPI_V1.put<
				UpdateOrgMemberRequest,
				UpdateOrgMemberResponse
			>(path, args.role ? { role: args.role } : {});
		},

		meta: {
			invalidateQuery: queryKeyFactory.get["all-organizations"],
			cancelQuery: queryKeyFactory.get["all-organizations"],
		},
	});
};
