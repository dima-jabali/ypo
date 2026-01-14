import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type { OrganizationId } from "#/types/general";
import type {
	AwsBucket,
	AwsKey,
	Organization,
} from "../fetch/use-fetch-all-organizations";
import { queryKeyFactory } from "@/hooks/query-keys";
import type { ChatTools } from "#/types/notebook";

export type MutateOrganizationRequest = {
	pathParams: {
		organizationId: OrganizationId;
	};
	body: {
		whitelabel_s3_bucket?: AwsBucket | null;
		default_chat_tools?: Array<ChatTools>;
		whitelabel_s3_key?: AwsKey | null;
		logo_s3_bucket?: AwsBucket | null;
		use_whitelabel_image?: boolean;
		logo_s3_key?: AwsKey | null;
		whitelabel_name?: string;
		show_logo?: boolean;
		name?: string;
	};
};

export type MutateOrganizationResponse = Organization;

const mutationKey = queryKeyFactory.put["update-organization"].queryKey;

export function useMutateOrganization() {
	return useMutation({
		mutationKey,

		mutationFn: async (args: MutateOrganizationRequest) => {
			const path = `/organizations/${args.pathParams.organizationId}`;

			const res = await clientAPI_V1.put<MutateOrganizationResponse>(
				path,
				args.body,
			);

			return res.data;
		},

		meta: {
			invalidateQuery: queryKeyFactory.get["all-organizations"],
			errorTitle: "Failed to update organization!",
			successTitle: "Organization updated!",
		},
	});
}
