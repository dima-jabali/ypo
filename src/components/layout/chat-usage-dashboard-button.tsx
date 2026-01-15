import { AlignEndHorizontal } from "lucide-react";

import { dataManagerStore } from "#/contexts/data-manager";
import {
	generalContextStore,
	MainPage,
} from "#/contexts/general-ctx/general-context";
import { useUserRoleInCurrOrg } from "#/hooks/fetch/use-fetch-all-organizations";
import { OrganizationMemberRole } from "#/types/notebook";

function handleGoToChatUsageDashboard() {
	generalContextStore.setState({
		mainPage: MainPage.ChatUsageDashboard,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}

export function ChatUsageDashboardButton() {
	const userRoleInOrg = useUserRoleInCurrOrg();

	return userRoleInOrg === OrganizationMemberRole.Admin ? (
		<button
			className="flex items-center justify-start button-hover rounded w-full py-2 px-3 gap-3 text-sm text-muted-foreground"
			onClick={handleGoToChatUsageDashboard}
			title="Chat Usage dashboard"
		>
			<AlignEndHorizontal className="w-5 stroke-1 stroke-muted-foreground" />

			<span>Go to Chat Usage Dashboard</span>
		</button>
	) : null;
}
