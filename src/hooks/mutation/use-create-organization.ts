import { type QueryFilters, useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type {
	GetOrganizationsResponse,
	Organization,
} from "#/hooks/fetch/use-fetch-all-organizations";
import { queryKeyFactory } from "#/hooks/query-keys";

export type CreateOrganizationRequestBody = {
	name: string;
};

export type CreateOrganizationResponse = Organization;

const mutationKey = queryKeyFactory.post["organization"].queryKey;

const cancelQueriesParams: QueryFilters = {
	queryKey: queryKeyFactory.get["all-organizations"].queryKey,
};

export const useCreateOrganization = () => {
				if (typeof window === "undefined") {
		return null;
	}
	
	return useMutation<
		CreateOrganizationResponse | null,
		Error,
		CreateOrganizationRequestBody
	>({
		mutationKey,

		mutationFn: async (body: CreateOrganizationRequestBody) =>
			(
				await clientAPI_V1.post<CreateOrganizationResponse>(
					"/organizations",
					body,
				)
			).data,

		onSuccess: (newOrganizationFromResponse, _, __, ctx) => {
			ctx.client.setQueryData<GetOrganizationsResponse["results"]>(
				cancelQueriesParams.queryKey!,
				(cachedAllOrganizations) => {
					if (!(cachedAllOrganizations && newOrganizationFromResponse)) {
						console.log(
							"No cachedAllOrganizations or newOrganizationFromResponse!",
							{
								newOrganizationFromResponse,
								cachedAllOrganizations,
							},
						);

						return cachedAllOrganizations;
					}

					// Assure that the new project is not already in the list:
					if (
						cachedAllOrganizations.some(
							(org) => org.id === newOrganizationFromResponse.id,
						)
					) {
						console.log(
							"The new organization is already in the list. No need to add it again!",
							{
								newOrganizationFromResponse,
								cachedAllOrganizations,
							},
						);

						return cachedAllOrganizations;
					}

					const newAllOrganizationsCache: typeof cachedAllOrganizations = [
						...cachedAllOrganizations,
						newOrganizationFromResponse,
					];

					return newAllOrganizationsCache;
				},
			);
		},

		meta: {
			cancelQuery: queryKeyFactory.get["all-organizations"],
			errorTitle: "Error creating organization!",
		},
	});
};
