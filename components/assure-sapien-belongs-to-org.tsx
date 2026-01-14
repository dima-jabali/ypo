import { memo } from "react";

import { isValidNumber } from "#/helpers/utils";
import { useFetchAllOrganizations } from "#/hooks/fetch/use-fetch-all-organizations";
import { useDownloadedOrganizationId } from "#/hooks/use-current-organization";
import { useDownloadedSapienOrganizationId } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";

export const AssureSapienBelongsToOrg = memo(function AssureSapienBelongsToOrg({
	children,
}: React.PropsWithChildren) {
	const sapienOrganizationId = useDownloadedSapienOrganizationId();
	const orgId = useDownloadedOrganizationId();
	const orgs = useFetchAllOrganizations();

	if (!isValidNumber(sapienOrganizationId) || !isValidNumber(orgId)) {
		console.log("Sapien id or current organization is not defined.", {
			sapienOrganizationId,
			orgId,
		});

		return null;
	}

	if (sapienOrganizationId !== orgId) {
		let msg = "Sapien does not belong to the current organization.";

		const orgSapienBelongsTo = orgs.find(
			(org) => org.id === sapienOrganizationId,
		);

		if (orgSapienBelongsTo) {
			msg += `\nThis sapien belongs to the organization "${orgSapienBelongsTo.name} (${orgSapienBelongsTo.id})", to which you belong to.\nChange organization in the top right corner to access it.`;
		}

		console.log({
			sapienOrganizationId,
			orgId,
		});

		throw new Error(msg);
	}

	return children;
});
