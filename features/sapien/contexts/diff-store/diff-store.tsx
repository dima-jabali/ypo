import { useRef, useState, type PropsWithChildren } from "react";

import { diffBatchTable } from "./diff-batch-table";
import { DiffStoreCtx } from "./diff-ctx";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { usePatchBatchTableById } from "../../hooks/patch/use-patch-batch-table-by-id";
import { dbg, noop } from "#/helpers/utils";

export type DiffBatchTableContextData = {
	scheduleToDiffBatchTableAndUpdateBackend: () => void;
	calcDiffOnBatchTableAndUpdateBackend: () => void;
};

const TIMER_TO_LOOK_FOR_CHANGES = 1_500;

export function DiffStoreProvider({ children }: PropsWithChildren) {
	const organizationId = generalContextStore.use.organizationId();
	const batchTableId = generalContextStore.use.batchTableId()!;
	const patchBatchTableById = usePatchBatchTableById();

	const patchTimerRef = useRef<NodeJS.Timeout>(undefined);
	const hasAnotherUpdateScheduledRef = useRef(false);
	const hasPatchAwaitingRef = useRef(false);

	const [store] = useState(() => {
		function calcDiffOnBatchTableAndUpdateBackend() {
			{
				clearTimeout(patchTimerRef.current);

				if (hasPatchAwaitingRef.current) {
					hasAnotherUpdateScheduledRef.current = true;

					return;
				}
			}

			const { getBatchTable, lastServerBatchTables } =
				generalContextStore.getState();
			const currBatchTable = getBatchTable(organizationId, batchTableId);
			const lastServerBatchTable = lastServerBatchTables.get(
				`${batchTableId}-${organizationId}`,
			);

			dbg({
				lastServerBatchTable,
				currBatchTable,
			});

			if (!(lastServerBatchTable && currBatchTable)) return;

			const start = performance.now();

			const updates = diffBatchTable(lastServerBatchTable, currBatchTable);

			dbg("Batch table diff took", performance.now() - start);

			if (updates.length === 0) {
				dbg("Not updating batch table backend because there are no changes.");

				return;
			} else {
				dbg("Updating batch table backend...", { updates });
			}

			hasPatchAwaitingRef.current = true;

			patchBatchTableById
				.mutateAsync({
					ignoreUpdates: false,
					organizationId,
					batchTableId,
					updates,
				})
				.finally(() => {
					hasPatchAwaitingRef.current = false;

					if (hasAnotherUpdateScheduledRef.current) {
						hasAnotherUpdateScheduledRef.current = false;

						scheduleToDiffBatchTableAndUpdateBackend();
					}
				})
				.catch(noop);
		}

		function scheduleToDiffBatchTableAndUpdateBackend() {
			clearTimeout(patchTimerRef.current);

			patchTimerRef.current = setTimeout(() => {
				calcDiffOnBatchTableAndUpdateBackend();
			}, TIMER_TO_LOOK_FOR_CHANGES);
		}

		return {
			scheduleToDiffBatchTableAndUpdateBackend,
			calcDiffOnBatchTableAndUpdateBackend,
		};
	});

	return (
		<DiffStoreCtx.Provider value={store}>{children}</DiffStoreCtx.Provider>
	);
}
