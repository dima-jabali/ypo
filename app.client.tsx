import { lazy, memo } from "react";

import { Sidebar } from "#/components/layout/Sidebar";
import { AllContexts } from "#/contexts/all-contexts";
import { ChatOrNotebook } from "#/views/chat-or-notebook";
import { Authenticated } from "./components/authenticated";
import { WithOrganizationIdAndListBoundary } from "./components/with-organization-id-and-list-boundary";
import { authStore } from "./contexts/auth/auth";
import {
	generalContextStore,
	MainPage,
} from "./contexts/general-ctx/general-context";
import { MakeQueryClientProvider } from "./contexts/query-client-provider";
import {
	RerenderTreeProvider,
	useRerenderTreeStore,
} from "./contexts/use-rerender-tree";
import { HandleIfUserHasChanged } from "./features/auth/handle-if-user-has-changed";
import { isDev } from "./helpers/utils";

const Sapien = lazy(async () => ({
	default: (await import("./views/sapien")).Sapien,
}));

const DataManager = lazy(async () => ({
	default: (await import("./features/data-manager/data-manager")).DataManager,
}));

const ChatUsageDashboard = lazy(async () => ({
	default: (
		await import("./features/chat-usage-dashboard/chat-usage-dashboard")
	).ChatUsageDashboard,
}));

export function App() {
		return <MakeQueryClientProvider>
			<Authenticated>
				<HandleIfUserHasChanged>
					<AllContexts>
						<RerenderTreeProvider>
							<Main />
						</RerenderTreeProvider>
					</AllContexts>
				</HandleIfUserHasChanged>
			</Authenticated>
		</MakeQueryClientProvider>
}

const Main = memo(function Main() {
	const renderTreeKey = useRerenderTreeStore().use.key();
	const mainPage = generalContextStore.use.mainPage();

	if (isDev) {
		console.log({
			generalContextState: generalContextStore.getState(),
			generalContextStore,
			authState: authStore.getState(),
			authStore,
		});
	}

	return (
		<div
			className="relative grid [grid-template-rows:1fr] [grid-template-columns:0.01fr_1fr] [grid-template-areas:'aside_main'] h-screen w-screen overflow-hidden bg-notebook"
			id="app"
		>
			<Sidebar />

			<main className="max-w-full relative overflow-hidden [grid-area:main] bg-notebook">
				<WithOrganizationIdAndListBoundary
					failedText="Something went wrong at the main page!"
					key={renderTreeKey}
				>
					{(() => {
						switch (mainPage) {
							case MainPage.Notebook:
							case MainPage.Chats:
								return <ChatOrNotebook />;

							case MainPage.DataManager:
								return <DataManager />;

							case MainPage.ChatUsageDashboard:
								return <ChatUsageDashboard />;

							case MainPage.Sapien:
								return <Sapien />;

							default:
								console.log("Sidebar: Unknown main page:", mainPage);

								return null;
						}
					})()}
				</WithOrganizationIdAndListBoundary>
			</main>
		</div>
	);
});
