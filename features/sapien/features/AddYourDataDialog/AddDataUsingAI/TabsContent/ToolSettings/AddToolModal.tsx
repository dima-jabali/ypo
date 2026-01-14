import { Check, Plus } from "lucide-react";
import { useState, type DispatchWithoutAction } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import {
	BatchTableToolSettingsInheritanceType,
	type BatchTableToolConfigurationId,
	type BatchTableToolSettings,
	type Tool,
} from "#/types/batch-table";
import { Tooltip, TooltipContent } from "#/components/Tooltip";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { useFetchAvailableTools } from "#/features/sapien/hooks/get/use-fetch-available-tools";

type Props = {
	changeableToolSettings: BatchTableToolSettings;
	forceRender: DispatchWithoutAction;
};

export function AddToolModal(props: Props) {
	const [isOpen, setIsOpen] = useState(false);

	const hasAnyToolSettings = Boolean(
		(props.changeableToolSettings.tool_configurations?.length ?? 0) > 0,
	);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<PopoverTrigger className="rounded-sm p-1 text-primary button-hover">
					<Plus
						className="size-4 data-[attention=true]:animate-bounce data-[attention=true]:text-attention-strong"
						data-attention={!hasAnyToolSettings}
					/>
				</PopoverTrigger>

				<TooltipContent className="text-primary" side="bottom">
					Add existing tool to this column
				</TooltipContent>
			</Tooltip>

			{isOpen ? (
				<PopoverContent className="max-h-[30vh] overflow-hidden min-h-32 p-2 flex flex-col gap-2">
					<h5 className="font-semibold px-1 text-sm">
						Add existing tool to this column
					</h5>

					<hr className="border-border-smooth " />

					<DefaultSuspenseAndErrorBoundary
						failedText="Error loading available tools!"
						fallbackFor="add-tool-modal"
					>
						<Content {...props} />
					</DefaultSuspenseAndErrorBoundary>
				</PopoverContent>
			) : null}
		</Popover>
	);
}

function Content({ changeableToolSettings, forceRender }: Props) {
	const availableTools = useFetchAvailableTools();

	if (availableTools.length === 0) {
		return (
			<div className="flex justify-center items-center w-full h-full flex-col gap-2">
				<p>No available tools!</p>

				<p>Create one!</p>
			</div>
		);
	}

	const handleToggleAddTool = (tool: Tool, index: number) => {
		changeableToolSettings.inheritance_type =
			BatchTableToolSettingsInheritanceType.CUSTOM;
		changeableToolSettings.tool_configurations ??= [];

		if (index === -1) {
			changeableToolSettings.tool_configurations.push({
				id: Math.random() as BatchTableToolConfigurationId,
				last_modified_at: null,
				tool_priority: 1,
				created_at: null,
				updated_at: null,
				inputs: {},
				tool,
			});
		} else {
			changeableToolSettings.tool_configurations.splice(index, 1);
		}

		forceRender();
	};

	return (
		<ul className="flex flex-col simple-scrollbar gap-0.5 list-none">
			{availableTools.map((tool) => {
				if (!tool.is_available_in_batch_table) {
					return null;
				}

				const indexIfAdded =
					changeableToolSettings.tool_configurations?.findIndex(
						(tc) => tc.tool.id === tool.id,
					) ?? -1;
				const isAdded = indexIfAdded !== -1;

				return (
					<li key={tool.id}>
						<button
							className="rounded-md flex items-center justify-start gap-2 px-2 py-0.5 data-[is-added=true]:bg-white-/30 active:bg-button-active hover:bg-button-hover w-full"
							onClick={() => handleToggleAddTool(tool, indexIfAdded)}
							data-is-added={isAdded}
							type="button"
						>
							{isAdded ? (
								<Check className="size-4 text-positive flex-none" />
							) : (
								<span className="size-4 flex-none"></span>
							)}

							<span className="text-xs text-primary text-left">
								{tool.user_name}
							</span>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
