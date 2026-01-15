import { useMemo } from "react";

import { useCurrentOrganization } from "./use-current-organization";
import { collator } from "#/helpers/utils";

export function useAllUsersFromCurrentOrg() {
	const currentOrganization = useCurrentOrganization();

	const selectAllUsersFromCurrentOrgs = useMemo(() => {
		if (!currentOrganization) return [];

		const users = currentOrganization.members.users;

		return users.toSorted((a, b) =>
			collator.compare(a.first_name, b.first_name),
		);
	}, [currentOrganization]);

	return selectAllUsersFromCurrentOrgs;
}
