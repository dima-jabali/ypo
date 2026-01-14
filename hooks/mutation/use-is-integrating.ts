import { useIsMutating } from "@tanstack/react-query";
import { queryKeyFactory } from "../query-keys";

const mutationKey = queryKeyFactory.post["create-integration"].queryKey;

export function useIsIntegrating() {
	return (
		useIsMutating({
			mutationKey,
		}) > 0
	);
}
