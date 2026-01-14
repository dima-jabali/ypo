import { ChevronsLeft } from "lucide-react";
import { memo } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { useTableUIStore } from "../../contexts/table-ui";

export const BatchTableRight: React.FC = memo(function BatchTableRight() {
	const tableUIStore = useTableUIStore();
	const isChatOpen = tableUIStore.use.isChatOpen();

	function handleToggleShowBatchTableChat() {
		tableUIStore.setState((prev) => ({
			isChatOpen: !prev.isChatOpen,
		}));
	}

	return (
		<aside className="flex flex-col items-center justify-between [grid-area:right] z-20">
			<div className="flex flex-col gap-2 items-center">
				<Tooltip delayDuration={50}>
					<TooltipTrigger
						className="aspect-square rounded-lg flex items-center justify-center button-hover size-6"
						onClick={handleToggleShowBatchTableChat}
						title="Toggle open Sapien chat"
					>
						<ChevronsLeft
							className="size-4 data-[is-open=true]:rotate-180 text-primary"
							data-is-open={isChatOpen}
						/>
					</TooltipTrigger>

					<TooltipContent
						className="bg-popover rounded-lg border border-border-smooth  px-2 py-1 text-xs text-primary"
						side="left"
					>
						Toggle open Sapien chat
					</TooltipContent>
				</Tooltip>
			</div>

			<div className="flex flex-col gap-2 items-center"></div>
		</aside>
	);
});
