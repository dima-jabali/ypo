import { UserButton } from "@clerk/clerk-react";
import {
	Database,
	EllipsisVertical,
	MessageSquareText,
	PanelLeft,
	Table,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { memo, useState } from "react";

import { NotebookListTab } from "#/components/layout/notebook-list-tab";
import { authStore } from "#/contexts/auth/auth";
import { dataManagerStore } from "#/contexts/data-manager";
import {
	generalContextStore,
	MainPage,
	OrganizationSelectorPlacement,
	SidebarTab,
} from "#/contexts/general-ctx/general-context";
import { GeneralSettingsModal } from "#/features/general-settings-modal/general-settings-modal";
import { isValidNumber } from "#/helpers/utils";
import { EmptyFallbackSuspense } from "../empty-fallback-suspense";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { SetCurrentOrganizationPopover } from "../set-current-organization-popover";
import { ToggleDarkModeButton } from "../toggle-dark-mode-button";
import { WithChatData } from "../with-chat-data";
import { WithOrganizationIdAndList } from "../with-organization-id-and-list";
import { ChatUsageDashboardButton } from "./chat-usage-dashboard-button";
import { ShareProjectModal } from "./share-project-modal";
import { handleGoToSapien } from "./utils";

function handleToggleTabsOpened() {
	generalContextStore.setState((prev) => ({
		keepSidebarOpen: !prev.keepSidebarOpen,
	}));
}

function handleGoToDataManager() {
	generalContextStore.setState({
		mainPage: MainPage.DataManager,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}

function handleGoToChats() {
	generalContextStore.setState({
		sidebarTab: SidebarTab.Chats,
		mainPage: MainPage.Chats,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}

export const Sidebar = memo(function Sidebar() {
	const organizationSelectorPlacement =
		generalContextStore.use.organizationSelectorPlacement();
	const brieflyKeepSidebarOpen =
		generalContextStore.use.brieflyKeepSidebarOpen();
	const keepSidebarOpen = generalContextStore.use.keepSidebarOpen();
	const organizationId = generalContextStore.use.organizationId();
	const batchTableId = generalContextStore.use.batchTableId();
	const notebookId = generalContextStore.use.notebookId();
	const isUsingClerk = authStore.use.isUsingLocalClerk();
	const mainPage = generalContextStore.use.mainPage();

	return (
		<>
			<div
				className="w-14 h-screen data-[is-open=true]:w-(--open-sidebar-width) pointer-events-none [grid-area:aside] z-0"
				data-is-open={keepSidebarOpen}
				data-placeholder-for-aside
				data-no-print
			></div>

			{(() => {
				switch (mainPage) {
					case MainPage.Notebook:
					case MainPage.Chats: {
						return (
							<aside
								className="group fixed z-20 h-screen max-h-screen @container bg-aside w-14 hover:w-(--open-sidebar-width) transition-[width,opacity] duration-150 ease-out data-[is-open=true]:w-(--open-sidebar-width) flex flex-col gap-4 p-1 [box-shadow:0_0_10px_5px_#20202030]"
								data-is-open={keepSidebarOpen || brieflyKeepSidebarOpen}
								data-no-print
							>
								<div className="flex gap-4 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)] items-center justify-between">
									<button
										className="flex items-center justify-center button-hover rounded-lg w-12 p-2 flex-none"
										onClick={handleToggleTabsOpened}
										title="Keep menu opened"
									>
										<PanelLeft className="size-5 text-muted-foreground" />
									</button>

									{organizationSelectorPlacement ===
									OrganizationSelectorPlacement.IN_SIDEBAR ? (
										<div className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
											<EmptyFallbackSuspense>
												<WithOrganizationIdAndList>
													<SetCurrentOrganizationPopover />
												</WithOrganizationIdAndList>
											</EmptyFallbackSuspense>
										</div>
									) : null}
								</div>

								<div className="flex flex-col w-full h-full overflow-hidden">
									<EmptyFallbackSuspense key={organizationId}>
										<WithOrganizationIdAndList>
											<NotebookListTab />
										</WithOrganizationIdAndList>
									</EmptyFallbackSuspense>
								</div>

								<ul className="flex w-full flex-col gap-2">
									<div className="flex w-12 gap-1 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)]">
										<div className="w-12 h-9 flex-none">
											{isValidNumber(notebookId) ? (
												<EmptyFallbackSuspense key={notebookId}>
													<WithChatData fallback={null}>
														<GeneralSettingsModal />
													</WithChatData>
												</EmptyFallbackSuspense>
											) : null}
										</div>

										<div className="flex items-center justify-center rounded-lg w-12 h-9 flex-none @max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
											<EmptyFallbackSuspense key={notebookId}>
												<WithChatData fallback={null}>
													<ShareProjectModal />
												</WithChatData>
											</EmptyFallbackSuspense>
										</div>

										<div className="flex items-center justify-center rounded-lg w-12 h-9 flex-none @max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
											<EmptyFallbackSuspense>
												<ToggleDarkModeButton />
											</EmptyFallbackSuspense>
										</div>

										<MoreOptionsPopover />
									</div>

									<li className="flex aspect-square w-12 items-center justify-center">
										{isUsingClerk ? <UserButton /> : null}
									</li>
								</ul>
							</aside>
						);
					}

					case MainPage.DataManager: {
						return (
							<aside
								className="group fixed z-10 h-screen max-h-screen @container bg-aside w-14 hover:w-(--open-sidebar-width) transition-[width,opacity] duration-150 ease-out data-[is-open=true]:w-(--open-sidebar-width) flex flex-col gap-4 py-3 px-1 [box-shadow:0_0_10px_5px_#20202030]"
								data-is-open={keepSidebarOpen || brieflyKeepSidebarOpen}
							>
								<div className="flex gap-4 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)] items-center justify-between">
									<div className="h-9"></div>

									<div className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
										<EmptyFallbackSuspense>
											<WithOrganizationIdAndList>
												<SetCurrentOrganizationPopover />
											</WithOrganizationIdAndList>
										</EmptyFallbackSuspense>
									</div>
								</div>

								<div className="h-full"></div>

								<ul className="flex w-full flex-col gap-2">
									<button
										className="flex items-center justify-center button-hover rounded-lg @max-[14rem]:w-12 w-fit gap-1 p-2"
										onClick={handleGoToChats}
										title="Go to chats"
									>
										<div className="flex items-center justify-center w-[calc(3rem-1rem)] flex-none">
											<MessageSquareText className="size-5 stroke-1 flex-none text-muted-foreground" />
										</div>

										<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 text-sm text-muted flex-none">
											Go to Chats
										</span>
									</button>

									<li className="flex aspect-square w-12 items-center justify-center">
										{isUsingClerk ? <UserButton /> : null}
									</li>
								</ul>
							</aside>
						);
					}

					case MainPage.ChatUsageDashboard: {
						return (
							<aside
								className="group fixed z-10 h-screen max-h-screen @container bg-aside w-14 hover:w-(--open-sidebar-width) transition-[width,opacity] duration-150 ease-out data-[is-open=true]:w-(--open-sidebar-width) flex flex-col gap-4 py-3 px-1 [box-shadow:0_0_10px_5px_#20202030]"
								data-is-open={keepSidebarOpen || brieflyKeepSidebarOpen}
							>
								<div className="flex gap-4 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)] items-center justify-between">
									<div className="h-9"></div>

									<div className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
										<EmptyFallbackSuspense>
											<WithOrganizationIdAndList>
												<SetCurrentOrganizationPopover />
											</WithOrganizationIdAndList>
										</EmptyFallbackSuspense>
									</div>
								</div>

								<div className="h-full"></div>

								<ul className="flex w-full flex-col gap-2">
									<button
										className="flex items-center justify-center button-hover rounded-lg @max-[14rem]:w-12 w-fit gap-1 p-2"
										onClick={handleGoToChats}
										title="Go to chats"
									>
										<div className="flex items-center justify-center w-[calc(3rem-1rem)] flex-none">
											<MessageSquareText className="size-5 stroke-1 flex-none text-muted-foreground" />
										</div>

										<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 text-sm text-muted flex-none">
											Go to Chats
										</span>
									</button>

									<li className="flex aspect-square w-12 items-center justify-center">
										{isUsingClerk ? <UserButton /> : null}
									</li>
								</ul>
							</aside>
						);
					}

					case MainPage.Sapien: {
						return (
							<aside
								className="group fixed z-10 h-screen max-h-screen @container bg-aside w-14 hover:w-(--open-sidebar-width) transition-[width,opacity] duration-150 ease-out data-[is-open=true]:w-(--open-sidebar-width) flex flex-col gap-4 py-3 px-1 [box-shadow:0_0_10px_5px_#20202030]"
								data-is-open={keepSidebarOpen}
							>
								<div className="flex gap-4 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)] items-center justify-between">
									<div className="h-9"></div>

									<div className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
										<EmptyFallbackSuspense>
											<WithOrganizationIdAndList>
												<SetCurrentOrganizationPopover />
											</WithOrganizationIdAndList>
										</EmptyFallbackSuspense>
									</div>
								</div>

								<div className="h-full"></div>

								<ul className="flex w-full flex-col gap-2">
									{isValidNumber(batchTableId) ? (
										<button
											className="flex items-center justify-center button-hover rounded-lg @max-[14rem]:w-12 w-fit gap-1 p-2"
											onClick={handleGoToSapien}
											title="Go to Sapien"
										>
											<div className="flex items-center justify-center w-[calc(3rem-1rem)] flex-none">
												<Table className="size-5 stroke-1 flex-none text-muted-foreground" />
											</div>

											<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 text-sm text-muted flex-none">
												Go to Sapien
											</span>
										</button>
									) : null}

									<div className="w-12 h-9 flex-none">
										<EmptyFallbackSuspense>
											<ToggleDarkModeButton />
										</EmptyFallbackSuspense>
									</div>

									<button
										className="flex items-center justify-center button-hover rounded-lg @max-[14rem]:w-12 w-fit gap-1 p-2"
										onClick={handleGoToChats}
										title="Go to chats"
									>
										<div className="flex items-center justify-center w-[calc(3rem-1rem)] flex-none">
											<MessageSquareText className="size-5 stroke-1 flex-none text-muted-foreground" />
										</div>

										<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 text-sm text-muted flex-none">
											Go to Chats
										</span>
									</button>

									<li className="flex aspect-square w-12 items-center justify-center">
										{isUsingClerk ? <UserButton /> : null}
									</li>
								</ul>
							</aside>
						);
					}

					default: {
						console.error("Sidebar: Unknown main page:", mainPage);

						return null;
					}
				}
			})()}
		</>
	);
});

function MoreOptionsPopover() {
	const [isOpen, setIsOpen] = useState(false);

	const notebookId = generalContextStore.use.notebookId();

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Anchor className="fixed bottom-[68px] left-[193px] size-3.5" />
			</PopoverPrimitive.Portal>

			<PopoverTrigger className="flex items-center justify-center button-hover rounded-lg w-12 p-2 h-9 flex-none @max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 data-[state=open]:bg-button-active">
				<EllipsisVertical className="w-5 stroke-muted-foreground/70" />
			</PopoverTrigger>

			{isOpen ? (
				<PopoverContent side="right" align="end">
					<button
						className="flex items-center justify-start button-hover rounded w-full py-2 px-3 gap-3 text-sm text-muted-foreground"
						onClick={handleGoToDataManager}
						title="Data manager"
					>
						<Database className="w-5 stroke-1 stroke-muted-foreground" />

						<span>Go to Data Manager</span>
					</button>

					<button
						className="flex items-center justify-start button-hover rounded w-full py-2 px-3 gap-3 text-sm text-muted-foreground"
						onClick={handleGoToSapien}
						title="Sapien"
					>
						<Table className="w-5 stroke-1 stroke-muted-foreground" />

						<span>Go to Sapien</span>
					</button>

					<EmptyFallbackSuspense key={notebookId}>
						<WithOrganizationIdAndList>
							<ChatUsageDashboardButton />
						</WithOrganizationIdAndList>
					</EmptyFallbackSuspense>
				</PopoverContent>
			) : null}
		</Popover>
	);
}
