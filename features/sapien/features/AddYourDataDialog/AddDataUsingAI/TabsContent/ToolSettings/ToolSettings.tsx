import { isEqual } from "es-toolkit";

import { AddToolModal } from "./AddToolModal";
import { ToolConfigurationSetting } from "./ToolConfigurationSetting";
import type {
	BatchTableToolSettings,
	ToolConfiguration,
} from "#/types/batch-table";

type Props = {
	changeableToolSettings: BatchTableToolSettings | null | undefined;
	isForBatchTable: boolean;
	parentForceRender: React.DispatchWithoutAction;
};

export function ToolSettings({
	changeableToolSettings,
	isForBatchTable,
	parentForceRender,
}: Props) {
	function handleRemoveTool(toolConfig: ToolConfiguration) {
		if (!changeableToolSettings?.tool_configurations) return;

		const index = changeableToolSettings.tool_configurations.findIndex((obj) =>
			isEqual(obj, toolConfig),
		);

		if (index !== -1) {
			changeableToolSettings.tool_configurations.splice(index, 1);

			parentForceRender();
		}
	}

	return (
		<section
			className="w-full h-full flex flex-col gap-2 tabular-nums overflow-hidden"
			title="Tool's configurations to use for this column"
		>
			<div className="flex gap-2 items-center justify-between">
				<h3 className="font-semibold text-primary px-1.5">
					Tool Configurations
				</h3>

				<div className="flex gap-0.5 items-center">
					{changeableToolSettings ? (
						<>
							<AddToolModal
								changeableToolSettings={changeableToolSettings}
								forceRender={parentForceRender}
							/>

							{/* <CreateToolModal
									changeableToolSettings={changeableToolSettings}
								/> */}
						</>
					) : null}
				</div>
			</div>

			<ul className="flex flex-col simple-scrollbar gap-8 mt-2">
				{changeableToolSettings?.tool_configurations?.map((toolConfig) => {
					if (isForBatchTable && !toolConfig.tool.is_available_in_batch_table) {
						return null;
					}

					return (
						<ToolConfigurationSetting.Fieldset
							changeableToolSettings={changeableToolSettings}
							handleRemoveTool={handleRemoveTool}
							toolConfig={toolConfig}
							key={toolConfig.id}
						/>
					);
				})}
			</ul>
		</section>
	);
}
