import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { Tagged } from "type-fest";

import {
	useWithOrganizationId,
	type PageLimit,
	type PageOffset,
} from "#/contexts/general-ctx/general-context";
import { createISODate, identity } from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { OrganizationId } from "#/types/general";
import {
	OrganizationMemberRole,
	type BetterbrainUser,
	type BetterbrainUserId,
	type ChatTools,
	type OrgMemberWithRole,
} from "#/types/notebook";

export type OrganizationUuid = Tagged<string, "OrganizationUuid">;
export type AwsBucket = Tagged<string, "AwsBucket">;
export type AwsKey = Tagged<string, "AwsKey">;

export type Organization = {
	whitelabel_s3_bucket: AwsBucket | null;
	show_whitelabel_text_or_image: boolean;
	default_chat_tools?: Array<ChatTools>;
	all_tool_options?: Array<ChatTools>;
	whitelabel_s3_key: AwsKey | null;
	logo_s3_bucket: AwsBucket | null;
	use_whitelabel_image: boolean;
	logo_s3_key: AwsKey | null;
	whitelabel_name: string;
	owner: BetterbrainUser;
	uuid: OrganizationUuid;
	show_logo: boolean;
	id: OrganizationId;
	name: string;
	members: {
		users: Array<OrgMemberWithRole>;
		offset: PageOffset;
		limit: PageLimit;
		total: number;
	};
};

export type GetOrganizationsResponse = { results: Array<Organization> };

const fetchAllOrgsQueryOptions = queryKeyFactory.get["all-organizations"];

export function useFetchAllOrganizations<
	SelectedData = GetOrganizationsResponse["results"],
>(
	select: (
		data: GetOrganizationsResponse["results"],
	) => SelectedData = identity<
		GetOrganizationsResponse["results"],
		SelectedData
	>,
) {
	useFetchBetterbrainUser();

	return useSuspenseQuery({
		staleTime: Infinity,
		gcTime: Infinity, // Maintain on cache
		select,
		...fetchAllOrgsQueryOptions,
	}).data;
}

export function useOrgMember(enabled: boolean) {
	const organizationId = useWithOrganizationId();
	const user = useFetchBetterbrainUser();

	const queryOptions = useMemo(
		() => queryKeyFactory.get["org-member"](organizationId, user.id),
		[organizationId, user],
	);

	return useQuery({
		placeholderData: {
			organization: { id: organizationId },
			role: OrganizationMemberRole.User,
			created_at: createISODate(),
			updated_at: createISODate(),
			user,
		},
		staleTime: Infinity,
		gcTime: Infinity, // Maintain on cache
		enabled,
		...queryOptions,
	}).data;
}

export function useUserRoleInCurrOrg() {
	const organizationId = useWithOrganizationId();
	const userId = useFetchBetterbrainUser().id;

	const selectUserRoleInOrg = useCallback(
		(data: GetOrganizationsResponse["results"]) => {
			const currOrg = data.find((org) => org.id === organizationId);

			return currOrg ? userRoleInOrg(currOrg, userId) : undefined;
		},
		[organizationId, userId],
	);

	const userRoleInAlreadyDowloadedOrgMembers =
		useFetchAllOrganizations(selectUserRoleInOrg);

	const orgMember = useOrgMember(
		userRoleInAlreadyDowloadedOrgMembers === undefined,
	)!;

	return userRoleInAlreadyDowloadedOrgMembers ?? orgMember.role;
}

export function userRoleInOrg(org: Organization, userId: BetterbrainUserId) {
	const member = org.members.users.find((u) => u.id === userId);

	return member?.role;
}
