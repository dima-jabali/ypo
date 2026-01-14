import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { useIsAIThinking } from "#/features/sapien/hooks/get/use-fetch-batch-table-by-id";

export function AIIsThinkingWarning() {
	const isAIThinking = useIsAIThinking();

	if (!isAIThinking) return null;

	return (
		<Tooltip delayDuration={100}>
			<TooltipTrigger className="flex items-center justify-center cursor-default relative">
				<div className="loader-ai-thinking size-3.5">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
			</TooltipTrigger>

			<TooltipContent
				className="text-xs font-semibold"
				side="bottom"
				align="end"
			>
				AI is working...
			</TooltipContent>
		</Tooltip>
	);
}
