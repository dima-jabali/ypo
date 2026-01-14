import { FileSearch } from "lucide-react";
import { memo, useState, useTransition } from "react";

import { Loader } from "#/components/Loader";
import { FilterRegexProvider } from "#/contexts/filter-regex";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useIsStreaming } from "#/hooks/fetch/use-fetch-bot-conversation";
import { useAllChatSourcesMainValues } from "#/hooks/fetch/use-fetch-bot-conversation-message-list-page";
import { SourcesDrawer } from "./sources-for-user/sources-drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";

export const AllSourcesInChatSidebar = memo(function AllSourcesInChatSidebar() {
	const shouldShowSidebar = generalContextStore.use.showSourcesSidebar();
	const isStreaming = useIsStreaming();

	return isStreaming || !shouldShowSidebar ? null : <WhenNotStreaming />;
});

function WhenNotStreaming() {
	const [isPending, startTransition] = useTransition();
	const [isOpen, setIsOpen_] = useState(false);

	const sourcesMainValues = useAllChatSourcesMainValues();

	function setIsOpenOrToggle(
		nextValue?: boolean | ((prev: boolean) => boolean),
	) {
		startTransition(() => setIsOpen_(nextValue ?? ((prev) => !prev)));
	}

	return (
		<FilterRegexProvider>
			<Tooltip>
				<TooltipTrigger
					className="flex bg-notebook items-center justify-center border border-border-smooth rounded-full button-hover size-6 @3xl:size-8"
					onClick={() => setIsOpenOrToggle()}
					title="All chat sources"
				>
					{isPending ? (
						<Loader className="size-3 @3xl:size-4 border-t-muted-foreground" />
					) : (
						<FileSearch className="size-3 @3xl:size-4 stroke-1 text-muted-foreground" />
					)}
				</TooltipTrigger>

				<TooltipContent
					className="w-fit max-h-28 simple-scrollbar text-primary text-xs"
					align="center"
				>
					All chat sources
				</TooltipContent>
			</Tooltip>

			<SourcesDrawer
				sourcesMainValues={sourcesMainValues}
				setIsOpen={setIsOpenOrToggle}
				isOpen={isOpen}
			/>
		</FilterRegexProvider>
	);
}
