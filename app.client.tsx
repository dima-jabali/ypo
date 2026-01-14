import type { PostHogConfig } from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
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
import { HandleIframeCommunication } from "./features/iframe-comm/handle-iframe-comm";
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

const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

if (!POSTHOG_HOST || !POSTHOG_KEY) {
	throw new Error(
		"PostHog host or key is not defined. Please check your environment variables.",
	);
}

const isProduction = import.meta.env.MODE === "production";

const POSTHOG_OPTIONS: Partial<PostHogConfig> = {
	name: "Better Brain Chat App PostHog Client",
	session_idle_timeout_seconds: 60 * 60 * 2, // 2 hours
	enable_recording_console_log: true,
	capture_performance: true,
	capture_dead_clicks: true,
	capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
	capture_pageleave: true,
	api_host: POSTHOG_HOST,
	defaults: "2025-05-24",
	capture_heatmaps: true,
	capture_pageview: true,
	enable_heatmaps: true,
	autocapture: true,
	session_recording: {
		recordCrossOriginIframes: false,
		recordHeaders: true,
		recordBody: true,
		maskCapturedNetworkRequestFn(data) {
			return data;
		},
	},
};

export function App() {
	const appWithoutPosthog = (
		<MakeQueryClientProvider>
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
	);

	return (
		<>
			<HandleIframeCommunication />

			{isProduction ? (
				<PostHogProvider options={POSTHOG_OPTIONS} apiKey={POSTHOG_KEY!}>
					{appWithoutPosthog}
				</PostHogProvider>
			) : (
				appWithoutPosthog
			)}
		</>
	);
}

App.whyDidYouRender = true;

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

Main.whyDidYouRender = true;
