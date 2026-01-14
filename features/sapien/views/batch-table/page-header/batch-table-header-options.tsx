import { useRerenderTreeStore } from "#/contexts/use-rerender-tree";
import { useTableUIStore } from "#/features/sapien/contexts/table-ui";
import { BatchTablePatchType } from "#/features/sapien/hooks/patch/use-patch-batch-table-by-id";
import type {
	BatchTableColumnIndex,
	BatchTableRowIndex,
} from "#/types/batch-table";

export function BatchTableHeaderOptions() {
	const rerenderTree = useRerenderTreeStore().use.rerenderTree();
	const tableUIStore = useTableUIStore();

	function changeFirstCell() {
		tableUIStore.getState().pushToUndoStackAndRun({
			undos: [],
			redos: [
				{
					type: BatchTablePatchType.UpdateCell,
					data: {
						column_index: 0 as BatchTableColumnIndex,
						row_index: 0 as BatchTableRowIndex,
						value: Math.random(),
						uuid: undefined,
					},
				},
			],
		});
	}

	return (
		<div className="flex items-center gap-2">
			<button
				className="rounded button-hover flex items-center justify-center p-0.5 text-xs"
				onClick={() => changeFirstCell()}
			>
				changeFirstCell
			</button>

			<button
				className="rounded button-hover flex items-center justify-center p-0.5 text-xs"
				onClick={() => rerenderTree()}
			>
				Re-render wrapper
			</button>

			<button
				className="rounded button-hover flex items-center justify-center p-0.5 text-xs"
				// onClick={() => renderCells()}
			>
				Render cells
			</button>
		</div>
	);
}
