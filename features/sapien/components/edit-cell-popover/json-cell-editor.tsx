import { type CustomCell, type GridCell } from "@glideapps/glide-data-grid";
import { DialogClose } from "@radix-ui/react-dialog";
import {
	githubDarkTheme,
	githubLightTheme,
	JsonEditor,
	type JsonData,
} from "json-edit-react";
import { Info } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/Dialog";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import {
	getErrorMessage,
	preventDefault,
	stopPropagation,
} from "#/helpers/utils";
import type { BatchTableCell } from "#/types/batch-table";
import { ColorScheme } from "#/types/general";
import { ToolOutputs } from "./tool-outputs";
import { JSON_ICONS } from "./utils";

export function JsonCellEditor({
	batchTableCell,
	gridCell,
	close,
}: {
	batchTableCell: BatchTableCell | undefined;
	gridCell: CustomCell;
	close: (newGridCell: GridCell) => void;
}) {
	const colorScheme = generalContextStore.use.colorScheme();

	const [initialValue] = useState(() => {
		const value = batchTableCell?.value as JsonData | undefined | null;

		if (!value) return null;

		if (typeof value === "string") {
			try {
				return JSON.parse(value) as JsonData;
			} catch (error) {
				toast({
					title: "Error in JSON string of cell value",
					description: getErrorMessage(error),
					variant: ToastVariant.Destructive,
				});

				return value;
			}
		}

		return value;
	});
	const [data, setData] = useState(initialValue);

	const hasData = data !== null && data !== undefined;

	function handleAddArrayAsRoot() {
		setData([]);
	}

	function handleAddObjectAsRoot() {
		setData({});
	}

	function handleClearCellValue() {
		setData(null);
	}

	function handleSave() {
		close({
			...gridCell,
			data: JSON.stringify(data),
		});
	}

	function closeWithoutSaving() {
		close(gridCell);
	}

	return (
		<Dialog open onOpenChange={closeWithoutSaving}>
			<DialogContent
				className="gap-1 z-110 max-h-[80vh] simple-scrollbar w-[50vw] max-w-[50vw] sm:max-w-[50vw]"
				onEscapeKeyDown={preventDefault}
				overlayClassName="z-110"
			>
				<DialogTitle>JSON Editor</DialogTitle>

				<DialogDescription className="mt-0 pt-0">
					{hasData ? (
						""
					) : (
						<p className="text-sm">
							No data to here. Choose what to add at root:
						</p>
					)}
				</DialogDescription>

				{hasData ? (
					<>
						<JsonEditor
							theme={
								colorScheme === ColorScheme.dark
									? githubDarkTheme
									: githubLightTheme
							}
							className="json-editor text-primary"
							collapseAnimationTime={0}
							icons={JSON_ICONS}
							setData={setData}
							restrictDrag
							data={data}
							indent={2}
						/>

						<footer className="flex gap-2 items-center justify-between w-full mt-6">
							<div className="flex gap-2 items-center">
								<TipsPopover />

								{(batchTableCell?.tool_outputs ?? {}) ? (
									<ToolOutputs outputs={batchTableCell?.tool_outputs ?? {}} />
								) : null}
							</div>

							<div className="flex gap-2 items-center">
								<DialogClose asChild>
									<Button
										title="Cancel and close editor"
										variant="destructive"
										size="sm"
									>
										Cancel
									</Button>
								</DialogClose>

								<Button
									onClick={handleClearCellValue}
									title="Clear cell value"
									variant="purple"
									size="sm"
								>
									Clear
								</Button>

								<Button
									title="Save cell value"
									onClick={handleSave}
									variant="success"
									size="sm"
								>
									Save cell data
								</Button>
							</div>
						</footer>
					</>
				) : (
					<footer className="flex gap-2 mt-6 items-center justify-between">
						<div className="flex gap-2 items-center">
							{batchTableCell?.tool_outputs ? (
								<ToolOutputs outputs={batchTableCell.tool_outputs} />
							) : null}

							<Button size="sm" onClick={handleAddArrayAsRoot}>
								Add array at root
							</Button>

							<Button size="sm" onClick={handleAddObjectAsRoot}>
								Add object at root
							</Button>
						</div>

						<div className="flex gap-2 items-center">
							<DialogClose asChild>
								<Button
									title="Cancel and close editor"
									variant="destructive"
									size="sm"
								>
									Cancel
								</Button>
							</DialogClose>

							<Button
								title="Save cell value"
								onClick={handleSave}
								variant="success"
								size="sm"
							>
								Save cell data
							</Button>
						</div>
					</footer>
				)}
			</DialogContent>
		</Dialog>
	);
}

function TipsPopover() {
	return (
		<Popover>
			<PopoverTrigger
				className="flex p-1 h-full items-center justify-center rounded-md button-hover gap-1 text-xs"
				title="Tips"
			>
				<Info className="size-4" />

				<i>Tips</i>
			</PopoverTrigger>

			<PopoverContent
				className="flex max-h-[50vh] min-w-60 max-w-md flex-col gap-[1px] rounded-sm z-110"
				onWheel={stopPropagation} // Needed to enable scroll of a popover inside a dialog
				align="end"
				side="top"
			>
				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						Double-click a value (or a key) to edit it
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						When editing a string, use <Span>Cmd/Ctrl/Shift-Enter</Span> to add
						a new line (Enter submits the value)
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						It&apos;s the opposite when editing a full object/array node (which
						you do by clicking &quot;edit&quot; on an object or array value) —{" "}
						<Span>Enter</Span> for new line, and
						<Span>Cmd/Ctrl/Shift-Enter</Span> for submit
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						<Span>Escape</Span> to cancel editing
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						When clicking the &quot;clipboard&quot; icon, holding down{" "}
						<Span>Cmd/Ctrl</Span> will copy the path to the selected node rather
						than its value
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						When opening/closing a node, hold down <Span>Alt/Option</Span> to
						open/close all child nodes at once
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						For Number inputs, arrow-up and down keys will increment/decrement
						the value
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						For Boolean inputs, space bar will toggle the value
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						Easily move to the next/previous node (for editing) using the{" "}
						<Span>Tab/Shift-Tab</Span> key
					</p>
				</li>

				<li className="flex w-full items-center justify-start gap-2 rounded-xs p-2 hover:bg-button-hover">
					<span className="grid h-5 place-items-center">
						<Info className="size-5 stroke-link" />
					</span>

					<p className="break-words text-sm leading-5 text-primary">
						When editing is not permitted, double-clicking a string value will
						expand the text to the full value if it is truncated due to length
						(there is also a clickable &quot;...&quot; for long strings)
					</p>
				</li>
			</PopoverContent>
		</Popover>
	);
}

function Span({ children }: React.PropsWithChildren) {
	return (
		<span
			className="bg-muted-strong rounded-md px-1 py-0.5 font-mono font-semibold box-decoration-slice"
			data-markdown-code-inline
		>
			{children}
		</span>
	);
}
