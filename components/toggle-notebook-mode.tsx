import { MessageSquareText, Notebook } from "lucide-react";

import { dataManagerStore } from "#/contexts/data-manager";
import {
	generalContextStore,
	MainPage,
} from "#/contexts/general-ctx/general-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

function handleGoToNotebookMode() {
	generalContextStore.setState({
		mainPage: MainPage.Notebook,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}

function handleGoToChatMode() {
	generalContextStore.setState({
		mainPage: MainPage.Chats,
	});

	dataManagerStore.setState(dataManagerStore.getInitialState());
}

export function ToggleNotebookMode() {
	const isChatMode = generalContextStore.use.mainPage() === MainPage.Chats;

	const title = `Go to ${isChatMode ? "Notebook" : "Chat"} mode`;
	const Icon = isChatMode ? Notebook : MessageSquareText;

	return (
		<Tooltip>
			<TooltipTrigger
				className="flex bg-notebook items-center justify-center border border-border-smooth rounded-full button-hover size-6 @3xl:size-8"
				onClick={isChatMode ? handleGoToNotebookMode : handleGoToChatMode}
				title={title}
			>
				<Icon className="size-3 @3xl:size-4 stroke-1 text-muted-foreground" />
			</TooltipTrigger>

			<TooltipContent
				className="w-fit max-h-28 simple-scrollbar text-primary text-xs"
				align="center"
			>
				{title}
			</TooltipContent>
		</Tooltip>
	);
}
