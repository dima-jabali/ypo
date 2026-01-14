import {
	useMutation,
	useQueryClient,
	type MutationObserverOptions,
} from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	createBatchTableCellUuid,
	createBatchTableColumnUuid,
	isValidNumber,
} from "#/helpers/utils";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";
import { queryKeyFactory } from "#/hooks/query-keys";
import {
	BatchTableMetadataColumnType,
	BatchTableMode,
	BatchTableToolSettingsInheritanceType,
	type BatchTableColumnId,
	type BatchTableColumnIndex,
	type BatchTableMetadata,
	type BatchTableRowIndex,
	type BatchTableToolSettingsId,
} from "#/types/batch-table";
import type { PostBatchTableMetadataRequest } from "../get/use-fetch-batch-table-metadatas-page";
import {
	BatchTablePatchType,
	usePatchBatchTableById,
} from "../patch/use-patch-batch-table-by-id";
import { usePutBatchTableMetadata } from "../put/use-put-batch-table-metadata";

type PostBatchTableMetadataResponse = BatchTableMetadata;

const mutationKey = queryKeyFactory.post["batch-table-metadata"].queryKey;

export function usePostBatchTableMetadata() {
	const organizationId = generalContextStore.use.organizationId();
	const putBatchTableMetadata = usePutBatchTableMetadata();
	const betterbrainUser = useFetchBetterbrainUser();
	const patchBatchTable = usePatchBatchTableById();
	const queryClient = useQueryClient();

	queryClient.setMutationDefaults(mutationKey, {
		mutationFn: async (body) => {
			const res = await clientAPI_V1.post<
				PostBatchTableMetadataRequest,
				AxiosResponse<PostBatchTableMetadataResponse>
			>(`/organizations/${organizationId}/batch-tables`, body);

			return res.data;
		},

		onSuccess: async (newBatchTableMetadataFromResponse, args) => {
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
						cachedAllBatchTableMetadataListInfiniteQueryResponse,
						newBatchTableMetadataFromResponse,
						args,
					},
				);

				return;
			}

			const newBatchTableMetadataIdFromResponse =
				newBatchTableMetadataFromResponse.id;

			const pathOnPages = { pagesIndex: -1, resultIndex: -1 };

			let pagesIndex = -1;
			for (const page of cachedAllBatchTableMetadataListInfiniteQueryResponse.pages) {
				++pagesIndex;

				const index = page.results.findIndex(
					({ id }) => id === newBatchTableMetadataIdFromResponse,
				);

				if (index === -1) continue;

				pathOnPages.pagesIndex = pagesIndex;
				pathOnPages.resultIndex = index;

				break;
			}

			if (pathOnPages.pagesIndex !== -1 || pathOnPages.resultIndex !== -1) {
				console.log(
					"[onSuccess] batch table metadata already in batch table metadata infinite list. Not inserting it.",
				);

				return;
			} else {
				const oldResults =
					cachedAllBatchTableMetadataListInfiniteQueryResponse.pages[0]
						?.results;

				if (!oldResults) {
					console.error(
						"[onSuccess] oldResults is undefined inside infinite list! This should never happen!",
						{
							cachedAllBatchTableMetadataListInfiniteQueryResponse,
							newBatchTableMetadataFromResponse,
							pathOnPages,
						},
					);

					return cachedAllBatchTableMetadataListInfiniteQueryResponse;
				}

				const newResults = [newBatchTableMetadataFromResponse, ...oldResults];

				const newPage: (typeof cachedAllBatchTableMetadataListInfiniteQueryResponse.pages)[number] =
					{
						...cachedAllBatchTableMetadataListInfiniteQueryResponse.pages[
							pathOnPages.pagesIndex
						]!,
						results: newResults,
					};

				const newPages: typeof cachedAllBatchTableMetadataListInfiniteQueryResponse.pages =
					cachedAllBatchTableMetadataListInfiniteQueryResponse.pages.with(
						pathOnPages.pagesIndex,
						newPage,
					);

				const newCachedAllBatchTableMetadataListInfiniteQueryResponse: typeof cachedAllBatchTableMetadataListInfiniteQueryResponse =
					{
						...cachedAllBatchTableMetadataListInfiniteQueryResponse,
						pages: newPages,
					};

				console.log(
					"[onSuccess] replaced optimist project metadata in projects infinite list",
					{
						newCachedAllBatchTableMetadataListInfiniteQueryResponse,
						newBatchTableMetadataFromResponse,
					},
				);

				setBatchTableMetadataListPages(
					newCachedAllBatchTableMetadataListInfiniteQueryResponse,
				);
			}

			if (
				newBatchTableMetadataFromResponse.batch_table_mode ===
				BatchTableMode.Table
			) {
				const patchResponse = await patchBatchTable.mutateAsync({
					batchTableId: newBatchTableMetadataFromResponse.id,
					ignoreUpdates: true,
					organizationId,
					updates: [
						{
							type: BatchTablePatchType.AddColumn,
							data: {
								tool_settings: {
									inheritance_type:
										BatchTableToolSettingsInheritanceType.INHERIT,
									id: NaN as BatchTableToolSettingsId,
									tool_configurations: [],
									use_all_columns: false,
									source_columns: [],
								},
								column_type: BatchTableMetadataColumnType.SINGLE_LINE_TEXT,
								column_index: 0 as BatchTableColumnIndex,
								uuid: createBatchTableColumnUuid(),
								last_modified_by: betterbrainUser,
								id: NaN as BatchTableColumnId,
								column_type_specific_info: {},
								created_by: betterbrainUser,
								default_value: null,
								name: "New column",
								updated_at: null,
								created_at: null,
								description: "",
								use_ai: true,
								prompt: "",
							},
						},
						{
							type: BatchTablePatchType.UpdateCell,
							data: {
								column_index: 0 as BatchTableColumnIndex,
								row_index: 0 as BatchTableRowIndex,
								uuid: createBatchTableCellUuid(),
								formula: null,
								format: null,
								value: null,
							},
						},
					],
				});

				if ("error" in patchResponse) {
					throw new Error(
						patchResponse.error ||
							"Failed to add default column to new batch table!",
					);
				}

				const createdColumnId = patchResponse.updates.find(
					(update) => update.type === BatchTablePatchType.AddColumn,
				)?.data.id;

				if (isValidNumber(createdColumnId)) {
					await putBatchTableMetadata.mutateAsync({
						pathParams: {
							batch_table_id: newBatchTableMetadataFromResponse.id,
						},
						body: {
							entity_column_id: createdColumnId,
						},
					});
				}
			}

			return;
		},

		meta: {
			errorTitle: "Failed to create batch table!",
			successTitle: "Batch table created!",
		},
	} satisfies MutationObserverOptions<
		PostBatchTableMetadataResponse,
		Error,
		PostBatchTableMetadataRequest
	>);

	return useMutation<
		PostBatchTableMetadataResponse,
		Error,
		PostBatchTableMetadataRequest
	>({
		mutationKey,
	});
}
