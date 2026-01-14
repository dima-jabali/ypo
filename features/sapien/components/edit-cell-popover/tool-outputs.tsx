import {
	githubDarkTheme,
	githubLightTheme,
	JsonEditor,
	type JsonData,
} from "json-edit-react";
import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { JSON_ICONS } from "./utils";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { ColorScheme } from "#/types/general";

export function ToolOutputs({ outputs }: { outputs: Record<string, unknown> }) {
	const colorScheme = generalContextStore.use.colorScheme();

	const [toolOutputsJson] = useState(() => {
		if (typeof outputs === "string") {
			try {
				return JSON.parse(outputs) as JsonData;
			} catch (error) {
				toast({
					title: "Error in JSON string of cell tool outputs",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				return outputs;
			}
		}

		return outputs;
	});

	return (
		<Dialog>
			<DialogTrigger className="rounded-2xl border border-border-smooth flex px-2 py-0.5 button-hover text-primary text-xs w-fit">
				View Tool Outputs
			</DialogTrigger>

			<DialogContent overlayClassName="z-110" className="gap-1 z-110">
				<DialogTitle>Tool outputs</DialogTitle>

				<DialogDescription className="mt-0 pt-0">
					Tool outputs JSON visualizer
				</DialogDescription>

				<JsonEditor
					theme={
						colorScheme === ColorScheme.dark
							? githubDarkTheme
							: githubLightTheme
					}
					className="json-editor text-primary"
					collapseAnimationTime={0}
					data={toolOutputsJson}
					icons={JSON_ICONS}
					restrictDelete
					restrictEdit
					restrictDrag
					restrictAdd
					indent={2}
				/>
			</DialogContent>
		</Dialog>
	);
}
