import { memo } from "react";

import { isValidNumber } from "#/helpers/utils";
import { useFetchAllOrganizations } from "#/hooks/fetch/use-fetch-all-organizations";
import { useDownloadedNotebookOrganizationId } from "#/hooks/fetch/use-fetch-notebook";
import { useDownloadedOrganizationId } from "#/hooks/use-current-organization";

export const AssureNotebookBelongsToOrg = memo(
	function AssureNotebookBelongsToOrg({ children }: React.PropsWithChildren) {
		const notebookOrganizationId = useDownloadedNotebookOrganizationId();
		const orgId = useDownloadedOrganizationId();
		const orgs = useFetchAllOrganizations();

		if (!isValidNumber(notebookOrganizationId) || !isValidNumber(orgId)) {
			console.log("Notebook or current organization is not defined.", {
				notebookOrganizationId,
				orgId,
			});

			return null;
		}

		if (notebookOrganizationId !== orgId) {
			let msg = "Notebook does not belong to the current organization.";

			const orgNotebookBelongsTo = orgs.find(
				(org) => org.id === notebookOrganizationId,
			);

			if (orgNotebookBelongsTo) {
				msg += `\nThis notebook belongs to the organization "${orgNotebookBelongsTo.name} (${orgNotebookBelongsTo.id})", to which you belong to.\nChange organization in the top right corner to access it.`;
			}

			console.log({
				notebookOrganizationId,
				orgId,
			});

			throw new Error(msg);
		}

		return children;
	},
);
