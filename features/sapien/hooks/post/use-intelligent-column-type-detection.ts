import {
	useMutation,
	useQueryClient,
	type MutationObserverOptions,
} from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { useWithOrganizationId } from "#/contexts/general-ctx/general-context";
import { queryKeyFactory } from "#/hooks/query-keys";
import type { BatchTableMetadataColumnType } from "#/types/batch-table";
import { useFillSheetStore } from "../../features/AddYourDataDialog/FillSpreadsheetWithDataFromCsv/fillSheetContext";
import { isValidNumber } from "#/helpers/utils";
import { clientAPI_V1 } from "#/api";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";

type IntelligentColumnTypeDetectionRequest = {
	file: File;
};

type IntelligentColumnTypeDetectionResponse = {
	inferred_types: Array<{
		column_type: BatchTableMetadataColumnType;
		column_index: number;
		column_name: string;
	}>;
};

type Ctx = {
	file: File;
};

const mutationKey = [
	queryKeyFactory.post["intelligent-column-type-detection"].queryKey,
];

export function useIntelligentColumnTypeDetection() {
	const organizationId = useWithOrganizationId();
	const fillSheetStore = useFillSheetStore();
	const queryClient = useQueryClient();

	queryClient.setMutationDefaults(mutationKey, {
		mutationFn: async (body) => {
			if (!isValidNumber(organizationId)) {
				throw new Error("No organization selected!", {
					cause: `Expected a valid number for "organizationId" but got: "${organizationId}"`,
				});
			}

			fillSheetStore
				.getState()
				.intelligentColumnTypeDetectionAbortController?.abort();

			const abortController = new AbortController();

			fillSheetStore.setState({
				intelligentColumnTypeDetectionAbortController: abortController,
			});

			const path = `/organizations/${organizationId}/intelligent-column-type-detection`;

			const formData = new FormData();
			formData.append("data_file", body.file, body.file.name);

			const res = await clientAPI_V1.post<
				IntelligentColumnTypeDetectionRequest,
				AxiosResponse<IntelligentColumnTypeDetectionResponse>
			>(path, formData, {
				signal: abortController.signal,
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			fillSheetStore.setState((prev) => {
				const isForTheSameFile =
					Reflect.get(body.file, "uuid") ===
					Reflect.get(prev.file || {}, "uuid");

				// Assure the suggestions are for the same file:
				const nextColumnTypeSuggestions: (typeof prev)["columnTypeSuggestions"] =
					isForTheSameFile
						? res.data.inferred_types.reduce(
								(acc, curr) => ({ ...acc, [curr.column_name]: curr }),
								{},
							)
						: null;

				// if (nextColumnTypeSuggestions) {
				// 	const csvColumns: (typeof prev)["columns"] = {
				// 		...prev.columns,
				// 	};
				// }

				return {
					intelligentColumnTypeDetectionAbortController: null,
					columnTypeSuggestions: nextColumnTypeSuggestions,
				};
			});

			return res.data;
		},

		onMutate(vars) {
			return {
				file: vars.file,
			};
		},

		onError(error) {
			fillSheetStore.setState({
				intelligentColumnTypeDetectionAbortController: null,
			});

			toast({
				title: "Failed to upload CSV file!",
				variant: ToastVariant.Destructive,
				description: error.message,
			});
		},
	} satisfies MutationObserverOptions<
		IntelligentColumnTypeDetectionResponse,
		Error,
		IntelligentColumnTypeDetectionRequest,
		Ctx
	>);

	return useMutation<
		IntelligentColumnTypeDetectionResponse,
		Error,
		IntelligentColumnTypeDetectionRequest,
		Ctx
	>({
		retry: false,
		mutationKey,
	});
}
