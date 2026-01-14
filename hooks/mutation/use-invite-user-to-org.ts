import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type { ISODateString, OrganizationId } from "#/types/general";
import type { BetterbrainUser, OrganizationMemberRole } from "#/types/notebook";
import { queryKeyFactory } from "../query-keys";

type SendInviteToEmailRequest = {
	orgId: OrganizationId;
	first_name: string;
	last_name: string;
	email: string;
};

export type OrganizationMember = {
	organization: { id: OrganizationId };
	role: OrganizationMemberRole;
	created_at: ISODateString;
	updated_at: ISODateString;
	user: BetterbrainUser;
};

type SendInviteToEmailResponse = {
	organization_member: OrganizationMember;
	user_notifications: Array<string>;
};

const mutationKey = queryKeyFactory.post["invite-user-to-org"].queryKey;

export function useInviteUserToOrganizationMutation() {
	return useMutation<
		SendInviteToEmailResponse,
		Error,
		SendInviteToEmailRequest
	>({
		mutationKey,

		mutationFn: async (arg: SendInviteToEmailRequest) => {
			const { orgId, ...body } = arg;

			const path = `/organizations/${orgId}/users`;

			return await clientAPI_V1.post<
				SendInviteToEmailRequest,
				SendInviteToEmailResponse
			>(path, body);
		},

		meta: {
			invalidateQuery: queryKeyFactory.get["all-organizations"],
			cancelQuery: queryKeyFactory.get["all-organizations"],
		},
	});
}
