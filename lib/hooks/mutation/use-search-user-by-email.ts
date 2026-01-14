import { useMutation } from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import type { BetterbrainUser } from "#/types/notebook";
import { queryKeyFactory } from "../query-keys";

type SearchForUserByEmailRequest = {
	email: string;
};
type SearchForUserByEmailResponse = {
	results: BetterbrainUser[];
	result_count: number;
};

const mutationKey = queryKeyFactory.get["search-user-by-email"].queryKey;

export function useSearchUserByEmail() {
	return useMutation<
		SearchForUserByEmailResponse,
		Error,
		SearchForUserByEmailRequest
	>({
		mutationKey,

		mutationFn: async (arg: SearchForUserByEmailRequest) => {
			const path = `/users?user_email=${encodeURIComponent(arg.email.toLocaleLowerCase())}`;

			return (await clientAPI_V1.get<SearchForUserByEmailResponse>(path)).data;
		},
	});
}
