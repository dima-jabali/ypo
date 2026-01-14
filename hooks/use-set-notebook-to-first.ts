import { useQuery, useQueryClient } from "@tanstack/react-query";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import {
	useFetchNotebookListPage,
	useHasNotebooksInList,
	type FetchNotebookListPageParams,
	type FetchNotebookListPageResponse,
} from "./fetch/use-fetch-notebook-list-page";
import { queryKeyFactory } from "./query-keys";

type HasSetNotebookToFirst = boolean;

export function useSetNotebookToFirst() {
	const organizationId = generalContextStore.use.organizationId();
	const notebookMetadataList = useFetchNotebookListPage().data;
	const notebookId = generalContextStore.use.notebookId();
	const hasNotebooks = useHasNotebooksInList();
	const queryClient = useQueryClient();

	const hasNotebookSelected = isValidNumber(notebookId);

	return useQuery({
		enabled:
			!hasNotebookSelected && hasNotebooks && isValidNumber(organizationId),
		queryKey: ["set-notebook-to-first", organizationId],
		refetchOnMount: true,
		throwOnError: false,
		staleTime: 0, // Important
		retry: true,
		gcTime: 0, // Important
		queryFn: async (): Promise<HasSetNotebookToFirst> => {
			let firstNotebookMetadata = notebookMetadataList.pages[0]?.results[0];

			if (!firstNotebookMetadata) {
				throw new Error("No first notebook!");
			}

			if (!isValidNumber(firstNotebookMetadata.id)) {
				console.log(
					"No first notebook id! Seems that this notebook is an optimistic one",
					{
						firstNotebookMetadataId: firstNotebookMetadata.id,
						firstNotebookMetadata,
					},
				);

				const initialPageParam: FetchNotebookListPageParams = {
					limit: 10,
					offset: 0,
				};

				const queryOptions =
					queryKeyFactory.get["notebook-list-page"](organizationId);

				const newNotebookList: FetchNotebookListPageResponse =
					await queryClient.fetchQuery({
						...queryOptions,
						// @ts-expect-error => This is fine
						initialPageParam,
					});

				firstNotebookMetadata = newNotebookList.results[0];
			}

			if (!firstNotebookMetadata) {
				throw new Error("No first notebook even after refetch!");
			}

			if (!isValidNumber(firstNotebookMetadata.id)) {
				throw new Error("No first notebook id even after refetch!");
			}

			console.log(
				"No notebook selected, setting first notebook",
				firstNotebookMetadata,
			);

			generalContextStore.setState({
				botConversationId: firstNotebookMetadata.bot_conversation?.id ?? null,
				notebookId: firstNotebookMetadata.id,
			});

			return true;
		},
	});
}
