import {
	useMutation,
	useQueryClient,
	type MutationObserverOptions,
} from "@tanstack/react-query";

import { clientAPI_V1 } from "#/api";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { matchGeneralFileTypeToMimeType } from "#/hooks/fetch/use-fetch-file-by-id";
import {
	useFetchAllOrganizationFilesQueryKey,
	type GetOrganizationFilesResponse,
} from "#/hooks/fetch/use-fetch-organization-files";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { GeneralFile, GeneralFileType } from "#/types/notebook";

type MutateGeneralFileResponse = { file: GeneralFile };

enum FilterValueType {
	Integer = "INTEGER",
	String = "STRING",
	Number = "NUMBER",
}

export type MutateGeneralFileRequest = {
	body: Partial<{
		/** These are fields you want to be able to filter. */
		filter_fields: Array<{
			check_language_and_translate: boolean;
			value_type: FilterValueType;
			value: string | number;
			is_html: boolean;
			key: string;
		}>;
		/** These are metadata fields you want used for ranking and search. Notice only lexical search will be used with these metadata fields (and not semantic search). */
		search_fields: Array<{
			/** How much you want to weight this metadata field in the search */
			weight: number;

			check_language_and_translate: boolean;
			value_type: FilterValueType;
			value: string | number;
			is_html: boolean;
			key: string;
		}>;
		/** If this is given, we will download the file from this URL and store it in the associated organization's S3 folder. */
		download_url: string;

		folder_hierarchy: Array<string>;
		upload_file_to_s3: boolean;
		file_size_bytes: number;
		description: string;
		file_name: string;
		index: boolean;
	}>;
	fileType: GeneralFileType;
	fileId: number;
};

const mutationKey = queryKeyFactory.post["update-file-metadata"].queryKey;

export function useMutateFile() {
	const { queryOptions } = useFetchAllOrganizationFilesQueryKey();
	const organizationId = generalContextStore.use.organizationId();
	const queryClient = useQueryClient();

	queryClient.setMutationDefaults(mutationKey, {
		mutationFn: async ({ body, fileId }) => {
			const res = await clientAPI_V1.post<MutateGeneralFileResponse>(
				`/files/${fileId}`,
				body,
			);

			return res.data;
		},

		onMutate: async ({ fileId, fileType }) =>
			await queryClient.invalidateQueries({
				queryKey: [
					...queryKeyFactory.get["file-by-presigned-url"].queryKey,
					{
						fileType: matchGeneralFileTypeToMimeType(fileType),
						organizationId,
						fileId,
					},
				],
			}),

		onSuccess: (updatedFileFromResponse) => {
			queryClient.setQueryData<GetOrganizationFilesResponse>(
				queryOptions.queryKey,
				(cachedOrganizationFilesPage) => {
					if (!(cachedOrganizationFilesPage && updatedFileFromResponse)) {
						console.log(
							"No cachedOrganizationFilesPage or updatedFileFromResponse! There is no optimistic item to replace!",
							{
								cachedOrganizationFilesPage,
								updatedFileFromResponse,
							},
						);

						return cachedOrganizationFilesPage;
					}

					const fileIdFromResponse = updatedFileFromResponse.file.id;

					const cachedFileIndex = cachedOrganizationFilesPage.results.findIndex(
						({ id }) => id === fileIdFromResponse,
					);

					if (cachedFileIndex === -1) {
						console.log(
							"The updated file is not in the list. No need to update it!",
							{
								cachedOrganizationFilesPage,
								updatedFileFromResponse,
							},
						);

						return cachedOrganizationFilesPage;
					} else {
						const newFilesPage: typeof cachedOrganizationFilesPage = {
							...cachedOrganizationFilesPage,
							results: cachedOrganizationFilesPage.results.with(
								cachedFileIndex,
								updatedFileFromResponse.file,
							),
						};

						return newFilesPage;
					}
				},
			);
		},
	} satisfies MutationObserverOptions<
		MutateGeneralFileResponse,
		Error,
		MutateGeneralFileRequest
	>);

	return useMutation<
		MutateGeneralFileResponse,
		Error,
		MutateGeneralFileRequest
	>({
		mutationKey,
	});
}
