import type { BatchTableId, OrganizationId } from "#/types/general";

export enum CustomWindowEvents {
	RefreshBatchTableCanvas = "refresh-batch-table-canvas",
}

export type RefreshBatchTableCanvasEventDetail = {
	organizationId: OrganizationId;
	batchTableId: BatchTableId;
};

export function sendRefreshTableCanvasEvent(
	batchTableId: BatchTableId,
	organizationId: OrganizationId,
) {
	window.dispatchEvent(
		new CustomEvent<RefreshBatchTableCanvasEventDetail>(
			CustomWindowEvents.RefreshBatchTableCanvas,
			{
				detail: {
					organizationId,
					batchTableId,
				},
			},
		),
	);
}
