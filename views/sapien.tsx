import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { TableOfBatchTableMetadatas } from "#/features/sapien/views/batch-table-metadatas/table-of-batch-table-metadatas";
import { BatchTableWrapper } from "#/features/sapien/views/batch-table/batch-table-wrapper";
import { isValidNumber } from "#/helpers/utils";

export function Sapien() {
	const organizationId = generalContextStore.use.organizationId();
	const batchTableId = generalContextStore.use.batchTableId();

	const isValidOrganizationId = isValidNumber(organizationId);
	const isValidBatchTableId = isValidNumber(batchTableId);

	return isValidOrganizationId && isValidBatchTableId ? (
		<BatchTableWrapper key={`${batchTableId}-${organizationId}`} />
	) : isValidOrganizationId ? (
		<TableOfBatchTableMetadatas key={organizationId} />
	) : null;
}
