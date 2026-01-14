import {
	useMutation,
	useQueryClient,
	type MutationObserverOptions,
} from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { clientAPI_V1 } from "#/api";
import type { EmptyObject } from "type-fest";
import { queryKeyFactory } from "#/hooks/query-keys";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";
import type { ColumnFromCsv } from "../../features/AddYourDataDialog/FillSpreadsheetWithDataFromCsv/fillSheetContext";

type UploadCsvToSapienRequest = {
	columns: Array<ColumnFromCsv>;
	file: File;
};

type UploadCsvToSapienResponse = EmptyObject;

const mutationKey = [queryKeyFactory.post["upload-csv-to-sapien"].queryKey];

export const useUploadCsvToSapien = () => {
	const organizationId = generalContextStore.use.organizationId();
	const batchTableId = generalContextStore.use.batchTableId();
	const queryClient = useQueryClient();

	queryClient.setMutationDefaults(mutationKey, {
		mutationFn: async (body) => {
			if (!isValidNumber(organizationId)) {
				throw new Error("No organization selected!", {
					cause: `Expected a valid number for "organizationId" but got: "${organizationId}"`,
				});
			}

			if (!isValidNumber(batchTableId)) {
				throw new Error("No Sapien table selected!", {
					cause: `Expected a valid number for "batchTableId" but got: "${batchTableId}"`,
				});
			}

			const path = `/organizations/${organizationId}/batch-tables/${batchTableId}/csv-upload`;

			const formData = new FormData();
			formData.append("columns", JSON.stringify(body.columns));
			formData.append("data_file", body.file, body.file.name);

			const res = await clientAPI_V1.post<
				UploadCsvToSapienRequest,
				AxiosResponse<UploadCsvToSapienResponse>
			>(path, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			return res.data;
		},
	} satisfies MutationObserverOptions<
		UploadCsvToSapienResponse,
		Error,
		UploadCsvToSapienRequest
	>);

	return useMutation<
		UploadCsvToSapienResponse,
		Error,
		UploadCsvToSapienRequest
	>({
		mutationKey,
	});
};
