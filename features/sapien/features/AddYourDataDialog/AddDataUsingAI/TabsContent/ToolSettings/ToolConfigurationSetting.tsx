import { X } from "lucide-react";

import { ToolMentionInput } from "./ToolMentionInput";
import { ColumnSearchExtraSettings } from "./ColumnSearchExtraSettings";
import {
	BatchTableToolSettingsInheritanceType,
	type BatchTableToolSettings,
	type ToolConfiguration,
} from "#/types/batch-table";
import { useForceRender } from "#/hooks/use-force-render";
import { isValidNumber } from "#/helpers/utils";
import { SmallSlider } from "#/components/Slider";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ToolConfigurationSetting {
	type Props = {
		changeableToolSettings: BatchTableToolSettings;
		toolConfig: ToolConfiguration;
		handleRemoveTool: (toolConfig: ToolConfiguration) => void;
	};

	export function Fieldset({
		changeableToolSettings,
		toolConfig,
		handleRemoveTool,
	}: Props) {
		const forceRender = useForceRender();

		function handleChangeToolPriority([newToolPriority]: Array<number>) {
			if (isValidNumber(newToolPriority)) {
				// eslint-disable-next-line react-hooks/immutability
				changeableToolSettings.inheritance_type =
					BatchTableToolSettingsInheritanceType.CUSTOM;
				// eslint-disable-next-line react-hooks/immutability
				toolConfig.tool_priority = newToolPriority;

				forceRender();
			}
		}

		const isColumnsSearchTool = toolConfig.tool.user_name === "Column Search";

		console.log({ toolConfig });

		return (
			<div className="rounded-md border-2 border-border-smooth flex flex-col gap-2 bg-white/10">
				<div className="flex flex-col gap-2">
					<h3
						className="font-semibold italic w-full text-center bg-button-hover py-1 relative"
						title="Tool's name"
					>
						{toolConfig.tool.user_name}

						<button
							className="absolute right-1 top-1 group flex items-center justify-center p-0.5 button-hover rounded-full"
							onClick={() => handleRemoveTool(toolConfig)}
							title="Remove tool"
							type="button"
						>
							<X className="size-3.5 group-hover:text-destructive" />
						</button>
					</h3>

					<p className="text-primary text-xs px-2" title="Tool's description">
						{toolConfig.tool.description}
					</p>
				</div>

				<hr className="border-border-smooth  px-2" />

				<fieldset
					title="Change tool's priority on results"
					className="flex items-center gap-2 px-2"
				>
					<label className="tabular-nums">
						Tool priority: ({toolConfig.tool_priority})
					</label>

					<SmallSlider
						className="w-[50%] disabled:pointer-events-none"
						onValueChange={handleChangeToolPriority}
						value={[toolConfig.tool_priority]}
						step={1}
						max={10}
						min={1}
					/>
				</fieldset>

				<hr className="border-border-smooth  px-2" />

				<section
					className="flex flex-col gap-2 px-2 pb-2 tabular-nums"
					title="Tool's inputs"
				>
					<h4 className="text-sm font-semibold">
						Inputs:{" "}
						<span className="text-primary">
							({toolConfig.tool.inputs.length})
						</span>
					</h4>

					<ul className="flex flex-col gap-10">
						{toolConfig.tool.inputs.map((input, index) => (
							<ToolMentionInput
								toolConfig={toolConfig}
								input={input}
								index={index}
								key={index}
							/>
						))}
					</ul>
				</section>

				{isColumnsSearchTool ? (
					<ColumnSearchExtraSettings
						changeableToolSettings={changeableToolSettings}
					/>
				) : null}
			</div>
		);
	}
}
