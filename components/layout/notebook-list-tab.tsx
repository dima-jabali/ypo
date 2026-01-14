import { Plus } from "lucide-react";
import { memo, useEffect, useRef } from "react";

import { NotebookListColumnForAside } from "#/components/layout/notebook-list-column-for-aside";
import {
	generalContextStore,
	SIDEBAR_TABS,
	SidebarTab,
} from "#/contexts/general-ctx/general-context";
import { NotebookDataSources } from "#/features/notebook-data-sources/notebook-data-sources";
import { NotebookOutline } from "#/features/notebook-outline/notebook-outline";
import { handleGoToChat } from "#/helpers/handle-go-to-chat";
import {
	createNotebookUuid,
	isMacOS,
	isValidNumber,
	noop,
	OPTIMISTIC_NEW_NOTEBOOK_ID,
} from "#/helpers/utils";
import { selectHasAnyBotConversationMessage } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import {
	type NewCreateProjectRequestBody,
	useCreateNotebook,
} from "#/hooks/mutation/use-create-notebook";
import { useIsCreatingNotebook } from "#/hooks/mutation/use-is-creating-notebook";
import type { BotConversationId } from "#/types/general";
import { NotebookImportance, NotebookStatus } from "#/types/notebook";
import { DefaultSuspenseAndErrorBoundary } from "../fallback-loader";
import { Loader } from "../Loader";
import { toast } from "../Toast/useToast";
import { WithNotebookIdAndList } from "../with-notebook-id-and-list";
import { WithOrganizationIdAndList } from "../with-organization-id-and-list";

function isGoingToFirstNotebookIfItIsEmpty(): boolean {
	const {
		getBotConversationMessageListPages,
		getNotebookListPages,
		organizationId,
	} = generalContextStore.getState();

	const notebookList = getNotebookListPages(organizationId);

	if (!notebookList) {
		return false;
	}

	const firstNotebookMetadata = notebookList.pages[0]?.results[0];

	if (!firstNotebookMetadata) {
		return false;
	}

	const botConversationId = firstNotebookMetadata.bot_conversation?.id;

	if (!isValidNumber(botConversationId)) {
		return false;
	}

	const messageList = getBotConversationMessageListPages(botConversationId);

	if (!messageList) return false;

	console.log({ messageList });

	const isEmpty = !selectHasAnyBotConversationMessage(messageList);

	if (isEmpty) {
		console.log(
			"First notebook is empty. Goind to it instead of creating a new chat.",
		);

		handleGoToChat(
			firstNotebookMetadata.id,
			firstNotebookMetadata.bot_conversation?.id ?? null,
		);

		return true;
	}

	return false;
}

export const NotebookListTab = memo(function NotebookListTab() {
	const organizationId = generalContextStore.use.organizationId();
	const notebookId = generalContextStore.use.notebookId();
	const sidebarTab = generalContextStore.use.sidebarTab();
	const isCreatingNotebook = useIsCreatingNotebook();
	const createNotebook = useCreateNotebook();

	const key = `${organizationId}-${notebookId}`;

	async function handleCreateChat(createAnyway?: boolean) {
		if (isCreatingNotebook) return;

		if (isGoingToFirstNotebookIfItIsEmpty() && !createAnyway) {
			toast({
				title:
					"First notebook is empty. Goind to it instead of creating a new chat.",
			});

			return;
		}

		const newNotebookData: NewCreateProjectRequestBody = {
			blocks: [],
			organizationId,
			metadata: {
				bot_conversation: {
					id: OPTIMISTIC_NEW_NOTEBOOK_ID as unknown as BotConversationId,
				},
				status: NotebookStatus.NotStarted,
				priority: NotebookImportance.Low,
				id: OPTIMISTIC_NEW_NOTEBOOK_ID,
				uuid: createNotebookUuid(),
				title: "New chat",
				favorited: false,
				assigned_to: [],
				description: "",
				tags: [],
			},
		};

		createNotebook.mutate(newNotebookData);

		handleGoToChat(
			newNotebookData.metadata.id!,
			newNotebookData.metadata.bot_conversation!.id,
		);
	}

	const handleCreateChatRef = useRef(handleCreateChat);

	handleCreateChatRef.current = handleCreateChat;

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
				if (isGoingToFirstNotebookIfItIsEmpty() && !e.shiftKey) {
					toast({
						title:
							"First notebook is empty. Goind to it instead of creating a new chat.",
					});
				} else {
					handleCreateChatRef.current(true).catch(noop);
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<>
			<button
				className="flex gap-2 p-2 pl-3.5 items-center justify-between button-hover text-sm rounded-lg text-muted-foreground w-full"
				onClick={() => handleCreateChat()}
				title="Create a new chat"
				type="button"
			>
				<div className="flex items-center gap-2">
					{isCreatingNotebook ? (
						<Loader className="size-5 border-t-muted-foreground" />
					) : (
						<Plus className="size-5" />
					)}

					<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
						New Chat
					</span>
				</div>

				<span className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 text-[10px] font-semibold rounded bg-white/10 px-1.5 py-0.5">
					{isMacOS() ? "Cmd" : "Ctrl"} + I
				</span>
			</button>

			<div className="flex flex-col h-full max-h-full overflow-hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75 mt-1 gap-1">
				<div className="flex flex-row text-sm font-bold text-left text-body border-b border-border-smooth whitespace-nowrap">
					{SIDEBAR_TABS.map((tab) => (
						<button
							className="rounded-t-lg button-hover p-2 data-[active=false]:opacity-30 data-[active=true]:bg-button-hover"
							onClick={() => generalContextStore.setState({ sidebarTab: tab })}
							data-active={sidebarTab === tab}
							key={tab}
						>
							{tab}
						</button>
					))}
				</div>

				<WithOrganizationIdAndList key={key}>
					{SIDEBAR_TABS.map((tab) => {
						let children = null;

						switch (tab) {
							case SidebarTab.Chats: {
								children = (
									<DefaultSuspenseAndErrorBoundary
										fallbackClassName="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75"
										failedText="Failed to load notebooks"
										fallbackText="Loading notebooks..."
										fallbackTextClassName="text-xs"
										fallbackFor="notebook list"
									>
										<NotebookListColumnForAside />
									</DefaultSuspenseAndErrorBoundary>
								);

								break;
							}

							case SidebarTab.Outline: {
								children = (
									<DefaultSuspenseAndErrorBoundary
										fallbackClassName="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75"
										failedText="Failed to load notebook"
										fallbackText="Loading notebook..."
										fallbackTextClassName="text-xs"
										fallbackFor="notebook outline"
									>
										<WithNotebookIdAndList>
											<NotebookOutline />
										</WithNotebookIdAndList>
									</DefaultSuspenseAndErrorBoundary>
								);
								break;
							}

							case SidebarTab.Sources: {
								children = (
									<DefaultSuspenseAndErrorBoundary
										fallbackClassName="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75"
										failedText="Failed to load notebook data sources"
										fallbackText="Loading notebook data sources..."
										fallbackFor="notebook data sources"
										fallbackTextClassName="text-xs"
									>
										<WithNotebookIdAndList>
											<NotebookDataSources />
										</WithNotebookIdAndList>
									</DefaultSuspenseAndErrorBoundary>
								);
								break;
							}

							default:
								break;
						}

						return (
							<div
								className="flex flex-col max-w-full max-h-full h-full w-full overflow-hidden"
								hidden={sidebarTab !== tab}
								key={tab}
							>
								{children}
							</div>
						);
					})}
				</WithOrganizationIdAndList>
			</div>

			<div className="size-1 flex-none"></div>
		</>
	);
});

NotebookListTab.whyDidYouRender = true;
