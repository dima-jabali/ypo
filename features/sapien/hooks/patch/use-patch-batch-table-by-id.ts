import {
	type MutationObserverOptions,
	type QueryClient,
	useIsMutating,
	useMutation,
} from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import type { EmptyObject } from "type-fest";

import { clientAPI_V1 } from "#/api";
import type {
	BatchTable,
	BatchTableCell,
	BatchTableCellUuid,
	BatchTableColumn,
	BatchTableColumnId,
	BatchTableColumnIndex,
	BatchTableColumnUuid,
	BatchTableEntitySuggestion,
	BatchTableMetadataColumnType,
	BatchTableRow,
	BatchTableRowIndex,
	BatchTableRowUuid,
} from "#/types/batch-table";
import type {
	BatchTableId,
	ISODateString,
	OrganizationId,
} from "#/types/general";
import { queryKeyFactory } from "#/hooks/query-keys";
import { isValidNumber } from "#/helpers/utils";
import { toast } from "#/components/Toast/useToast";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { applyPatchUpdateResponsesToBatchTable } from "../../lib/apply-updates-to-batch-table";

export enum BatchTablePatchType {
	UpdateColumn = "UPDATE_COLUMN",
	DeleteColumn = "DELETE_COLUMN",
	AddColumn = "ADD_COLUMN",

	UpdateCell = "UPDATE_CELL",
	CreateCell = "CREATE_CELL",

	DeleteRow = "DELETE_ROW",
	UpdateRow = "UPDATE_ROW",
	AddRow = "ADD_ROW",

	UpdateTable = "UPDATE_TABLE",

	BulkAddRowsWithCellValues = "BULK_ADD_ROWS_WITH_CELL_VALUES",

	ApproveEntitySuggestions = "APPROVE_ENTITY_SUGGESTIONS",
	RunAgent = "RUN_AGENT",
}

export type PatchBatchTableRequest = {
	updates: Array<BatchTablePatchUpdateRequest>;
	organizationId: OrganizationId;
	batchTableId: BatchTableId;
	ignoreUpdates: boolean;
};

export type PatchBatchTableResponse =
	| {
			updates: Array<BatchTablePatchUpdateResponse>;
	  }
	| {
			error: string | null;
	  };

type DeleteColumn = { uuid: BatchTableColumnUuid };
type DeleteRow = { uuid: BatchTableRowUuid };

export const RunAgentDataType = {
	EntityColumn: "ENTITY_COLUMN",
	SelectCells: "SELECT_CELLS",
	AllCells: "ALL_CELLS",
	Column: "COLUMN",
	Row: "ROW",
} as const;

export const RunAgentEntityColumnType = {
	NumEntities: "NUM_ENTITIES",
} as const;

type RunAgentEntityColumnData = {
	type: typeof RunAgentEntityColumnType.NumEntities;
	num_entities: number;
};

type RunAgentColumnData = {
	column_index: BatchTableColumnIndex;
};

type RunAgentRowData = {
	row_index: BatchTableRowIndex;
};

type RunAgentSelectCellsData = {
	cell_coordinates: Array<{
		column_index: BatchTableColumnIndex;
		row_index: BatchTableRowIndex;
	}>;
};

type RunAgentAllCellsData = Record<string, unknown>;

type RunAgentData =
	| {
			type: typeof RunAgentDataType.EntityColumn;
			data: RunAgentEntityColumnData;
	  }
	| {
			type: typeof RunAgentDataType.Column;
			data: RunAgentColumnData;
	  }
	| {
			type: typeof RunAgentDataType.Row;
			data: RunAgentRowData;
	  }
	| {
			type: typeof RunAgentDataType.SelectCells;
			data: RunAgentSelectCellsData;
	  }
	| {
			type: typeof RunAgentDataType.AllCells;
			data: RunAgentAllCellsData;
	  };

type RunAgent = {
	only_try_errored_cells: boolean;
	only_try_failed_cells: boolean;
	data: Array<RunAgentData>;
	force: boolean;
};

type BulkAddRowsWithCellValuesData = {
	cell_values: Array<EmptyObject>;
	column_id: BatchTableColumnId;
};

export type BatchTablePatchUpdateRequest =
	| {
			type: typeof BatchTablePatchType.AddColumn;
			data: Partial<BatchTableColumn> & {
				column_type: BatchTableMetadataColumnType;
				column_index: BatchTableColumnIndex;
				uuid: BatchTableColumnUuid;
			};
	  }
	| {
			type: typeof BatchTablePatchType.UpdateColumn;
			data: Partial<BatchTableColumn> & {
				column_index: BatchTableColumnIndex;
				uuid: BatchTableColumnUuid;
			};
	  }
	| {
			type: typeof BatchTablePatchType.DeleteColumn;
			data: DeleteColumn;
	  }
	| {
			type: typeof BatchTablePatchType.AddRow;
			data: Partial<BatchTableRow> & {
				row_index: BatchTableRowIndex;
				uuid: BatchTableRowUuid;
			};
	  }
	| {
			type: typeof BatchTablePatchType.UpdateRow;
			data: Partial<BatchTableRow> & {
				uuid: BatchTableRowUuid;
				row_index: BatchTableRowIndex;
			};
	  }
	| {
			type: typeof BatchTablePatchType.DeleteRow;
			data: DeleteRow;
	  }
	| {
			data: Partial<Pick<BatchTableCell, "format" | "formula" | "value">> & {
				uuid: BatchTableCellUuid | undefined;
				column_index: BatchTableColumnIndex;
				row_index: BatchTableRowIndex;
			};
			type: typeof BatchTablePatchType.UpdateCell;
	  }
	| {
			type: typeof BatchTablePatchType.ApproveEntitySuggestions;
			data: Array<BatchTableEntitySuggestion>;
	  }
	| {
			type: typeof BatchTablePatchType.RunAgent;
			data: RunAgent;
	  }
	| {
			type: typeof BatchTablePatchType.BulkAddRowsWithCellValues;
			data: BulkAddRowsWithCellValuesData;
	  }
	| {
			type: typeof BatchTablePatchType.UpdateTable;
			data: BatchTable;
	  };

export type BatchTablePatchUpdateResponse =
	| {
			type: typeof BatchTablePatchType.AddColumn;
			data: BatchTableColumn;
	  }
	| {
			type: typeof BatchTablePatchType.UpdateColumn;
			data: BatchTableColumn;
	  }
	| {
			type: typeof BatchTablePatchType.DeleteColumn;
			data: DeleteColumn;
	  }
	| {
			type: typeof BatchTablePatchType.AddRow;
			data: BatchTableRow;
	  }
	| {
			type: typeof BatchTablePatchType.UpdateRow;
			data: BatchTableRow;
	  }
	| {
			type: typeof BatchTablePatchType.DeleteRow;
			data: DeleteRow;
	  }
	| {
			type: typeof BatchTablePatchType.UpdateCell;
			data: BatchTableCell;
	  }
	| {
			type: typeof BatchTablePatchType.CreateCell;
			data: BatchTableCell;
	  }
	| {
			type: typeof BatchTablePatchType.ApproveEntitySuggestions;
			data: Array<BatchTableEntitySuggestion>;
	  }
	| {
			type: typeof BatchTablePatchType.RunAgent;
			data: RunAgent;
	  }
	| {
			type: typeof BatchTablePatchType.BulkAddRowsWithCellValues;
			data: BulkAddRowsWithCellValuesData;
	  }
	| {
			type: typeof BatchTablePatchType.UpdateTable;
			data: BatchTable;
	  };

const mutationKey = queryKeyFactory.patch["batch-table-by-id"].queryKey;

type Ctx = {
	fakeTimestamp: ISODateString;
};

export function usePatchBatchTableById() {
	return useMutation<
		PatchBatchTableResponse,
		Error,
		PatchBatchTableRequest,
		Ctx
	>({
		mutationKey,
	});
}

export function useIsMutatingBatchTable() {
	return useIsMutating({ mutationKey }) > 0;
}

export function setMutationDefaults_patchBatchTableById(
	queryClient: QueryClient,
) {
	queryClient.setMutationDefaults(mutationKey, {
		mutationFn: async (args) => {
			if (!isValidNumber(args.organizationId)) {
				throw new Error("No batch table selected!", {
					cause: `Expected a valid number for "organizationId" but got: "${args.organizationId}"`,
				});
			}
			if (!isValidNumber(args.batchTableId)) {
				throw new Error("No batch table selected!", {
					cause: `Expected a valid number for "batchTableId" but got: "${args.batchTableId}"`,
				});
			}

			const path = `/organizations/${args.organizationId}/batch-tables/${args.batchTableId}`;

			const res = await clientAPI_V1.patch<
				{ updates: PatchBatchTableRequest["updates"] },
				AxiosResponse<PatchBatchTableResponse>
			>(path, { updates: args.updates });

			if ("error" in res.data && res.data.error) {
				throw new Error(res.data.error);
			}

			return res.data;
		},

		async onSuccess(updatesFromBackend, args) {
			if ("error" in updatesFromBackend || args.ignoreUpdates) return;

			applyPatchUpdateResponsesToBatchTable({
				updates: updatesFromBackend.updates,
				organizationId: args.organizationId,
				batchTableId: args.batchTableId,
			});

			console.log("Successfully mutated batch table!");
		},

		async onError(error, args, context) {
			console.error("Failed to mutate batch table!", {
				context,
				error,
				args,
			});

			const shouldNotShowErrorToUser = error.message.startsWith(
				"duplicate key value violates unique constraint",
			);

			if (shouldNotShowErrorToUser) {
				// This error means that the backend already has whatever data we were trying to
				// create, therefore, we should refetch the batch table to get the latest data.

				await queryClient.invalidateQueries(
					queryKeyFactory.get["batch-table"](
						args.organizationId,
						args.batchTableId,
					),
				);
			} else {
				toast({
					title: "Failed to mutate Sapien batch table! Refresh page!",
					variant: ToastVariant.Destructive,
					description: error.message,
				});
			}
		},
	} satisfies MutationObserverOptions<
		PatchBatchTableResponse,
		Error,
		PatchBatchTableRequest,
		Ctx
	>);
}
