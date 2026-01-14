import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	generalContextStore,
	useWithOrganizationId,
} from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import { queryKeyFactory } from "#/hooks/query-keys";
import type {
	BatchTableColumnId,
	BatchTableMetadata,
	BatchTableMode,
} from "#/types/batch-table";
import type { BatchTableId } from "#/types/general";

export type PutBatchTableMetadataRequest = {
	pathParams: {
		batch_table_id: BatchTableId;
	};
	body: Partial<{
		entity_column_id: BatchTableColumnId | null;
		batch_table_mode: BatchTableMode;
		description: string;
		archived: boolean;
		name: string;
	}>;
};

export type PutBatchTableMetadataResponse = BatchTableMetadata;

const mutationKey = queryKeyFactory.put["batch-table-metadata"].queryKey;

export function usePutBatchTableMetadata() {
	const organization_id = useWithOrganizationId();

	return useMutation<
		PutBatchTableMetadataResponse,
		Error,
		PutBatchTableMetadataRequest
	>({
		mutationKey,

		mutationFn: async (args) => {
			const {
				pathParams: { batch_table_id },
				body,
			} = args;

			if (!isValidNumber(batch_table_id)) {
				throw new Error("No batch table selected!", {
					cause: `Expected a valid number for "batch_table_id" but got: "${batch_table_id}"`,
				});
			}

			const path = `/organizations/${organization_id}/batch-tables/${batch_table_id}`;

			const res = await clientAPI_V1.put<
				PutBatchTableMetadataRequest,
				AxiosResponse<PutBatchTableMetadataResponse>
			>(path, body);

			return res.data;
		},

		onSuccess: (newBatchTableMetadataFromResponse, args, context) => {
			const { getBatchTableMetadataListPages, setBatchTableMetadataListPages } =
				generalContextStore.getState();

			const cachedAllBatchTableMetadataListInfiniteQueryResponse =
				getBatchTableMetadataListPages();

			if (
				!cachedAllBatchTableMetadataListInfiniteQueryResponse ||
				!newBatchTableMetadataFromResponse
			) {
				console.warn(
					"No cachedAllBatchTableMetadatas or newBatchTableMetadataFromResponse!",
					{
						newBatchTableMetadataFromResponse,
						cachedAllBatchTableMetadataListInfiniteQueryResponse,
						context,
						args,
					},
				);

				return;
			}

			const newBatchTableMetadataIdFromResponse =
				newBatchTableMetadataFromResponse.id;

			const path = { pagesIndex: -1, resultIndex: -1 };

			let pagesIndex = -1;
			for (const page of cachedAllBatchTableMetadataListInfiniteQueryResponse.pages) {
				++pagesIndex;

				const index = page.results.findIndex(
					({ id }) => id === newBatchTableMetadataIdFromResponse,
				);

				if (index === -1) continue;

				path.pagesIndex = pagesIndex;
				path.resultIndex = index;

				break;
			}

			if (path.pagesIndex === -1 || path.resultIndex === -1) {
				console.log(
					"[onSuccess] No optimistic batch table metadata found in batch table metadata infinite list. Not replacing it.",
				);

				return;
			}

			const newResults: (typeof cachedAllBatchTableMetadataListInfiniteQueryResponse.pages)[number]["results"] =
				[
					...(cachedAllBatchTableMetadataListInfiniteQueryResponse.pages[
						path.pagesIndex
					]?.results ?? []),
				];

			if (!newResults) {
				console.error(
					"[onSuccess] newResults is undefined inside infinite list! This should never happen!",
					{
						cachedAllBatchTableMetadataListInfiniteQueryResponse,
						newBatchTableMetadataFromResponse,
						path,
					},
				);

				return cachedAllBatchTableMetadataListInfiniteQueryResponse;
			}

			newResults[path.resultIndex] = newBatchTableMetadataFromResponse;

			const oldPage =
				cachedAllBatchTableMetadataListInfiniteQueryResponse.pages[
					path.pagesIndex
				];

			if (!oldPage) {
				console.error(
					"[onSuccess] oldPage is undefined inside infinite list! This should never happen!",
					{
						cachedAllBatchTableMetadataListInfiniteQueryResponse,
						newBatchTableMetadataFromResponse,
						path,
					},
				);

				return cachedAllBatchTableMetadataListInfiniteQueryResponse;
			}

			const newPage: (typeof cachedAllBatchTableMetadataListInfiniteQueryResponse.pages)[number] =
				{
					...oldPage,
					results: newResults,
				};

			const newPages: typeof cachedAllBatchTableMetadataListInfiniteQueryResponse.pages =
				cachedAllBatchTableMetadataListInfiniteQueryResponse.pages.with(
					path.pagesIndex,
					newPage,
				);

			const newcachedAllBatchTableMetadataListInfiniteQueryResponse: typeof cachedAllBatchTableMetadataListInfiniteQueryResponse =
				{
					...cachedAllBatchTableMetadataListInfiniteQueryResponse,
					pages: newPages,
				};

			console.log(
				"[onSuccess] replaced optimist project metadata in projects infinite list",
				{
					newcachedAllBatchTableMetadataListInfiniteQueryResponse,
					newBatchTableMetadataFromResponse,
				},
			);

			setBatchTableMetadataListPages(
				newcachedAllBatchTableMetadataListInfiniteQueryResponse,
			);

			return;
		},

		onError(error) {
			toast({
				title: "Failed to mutate Sapien batch table metadata! Refresh page!",
				variant: ToastVariant.Destructive,
				description: error.message,
			});
		},
	});
}
