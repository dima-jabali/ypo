import { useLayoutEffect } from "react";

import {
	generalContextStore,
	OrganizationSelectorPlacement,
} from "#/contexts/general-ctx/general-context";

export function BrieflyKeepSidebarOpen({
	value,
	onlyIfOrgSelectorIsOnSidebar,
}: {
	value: boolean;
	onlyIfOrgSelectorIsOnSidebar?: boolean;
}) {
	useLayoutEffect(() => {
		if (onlyIfOrgSelectorIsOnSidebar) {
			if (
				generalContextStore.getState().organizationSelectorPlacement ===
				OrganizationSelectorPlacement.IN_SIDEBAR
			) {
				generalContextStore.setState({ brieflyKeepSidebarOpen: value });
			}
		} else {
			generalContextStore.setState({ brieflyKeepSidebarOpen: value });
		}
	}, [value, onlyIfOrgSelectorIsOnSidebar]);

	return null;
}
