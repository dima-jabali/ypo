import { useState } from "react";
import { File } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { AddDataToColumnView } from "./AddDataToColumnView";
import { FillSpreadsheetWithDataFromCsv } from "./FillSpreadsheetWithDataFromCsv/FillSpreadsheetWithDataFromCsv";
import { AddFilesView } from "./AddFilesView";
import { useIsTableEmpty } from "../../hooks/get/use-fetch-batch-table-by-id";
import { preventDefault } from "#/helpers/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/tabs";

enum Tab {
	FillSheetWithDataFromCsv = "Fill sheet with data from CSV",
	AddDataToColumn = "Add data to column",
	AddFilesToCells = "Add files to cells",
}

export function AddYourDataDialog() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				className="w-fit bg-transparent items-center rounded-sm button-hover text-primary text-xs p-1 px-2 gap-1 h-fit flex data-[is-open=true]:bg-button-hover"
				title="Add data to a column"
			>
				<File className="size-3.5 flex-none stroke-1" />

				<span>Add data</span>
			</DialogTrigger>

			{isOpen ? <Content setIsAddDataDialogOpen={setIsOpen} /> : null}
		</Dialog>
	);
}

function Content({
	setIsAddDataDialogOpen,
}: {
	setIsAddDataDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [tab, setTab] = useState(Tab.AddDataToColumn);

	const isTableEmpty = useIsTableEmpty();

	return (
		<DialogContent
			className="flex flex-col gap-6 simple-scrollbar max-h-[90vh] h-[90vh] w-[90vw]! max-w-[90vw]! pb-0"
			onInteractOutside={preventDefault}
			onEscapeKeyDown={preventDefault}
			onFocusOutside={preventDefault} // Disable outside click closing the modal
		>
			<DialogHeader>
				<DialogTitle className="text-2xl">Add Your Data</DialogTitle>

				<DialogDescription asChild>
					<p>
						{isTableEmpty
							? "Your table is empty. You can drop a file here or use AI to ask for data."
							: null}
					</p>
				</DialogDescription>
			</DialogHeader>

			<Tabs
				className="flex flex-col min-h-1 h-full"
				onValueChange={(v) => setTab(v as Tab)}
				value={tab}
			>
				<TabsList className="mb-6 w-fit">
					<TabsTrigger value={Tab.AddDataToColumn} disabled={isTableEmpty}>
						{Tab.AddDataToColumn}
					</TabsTrigger>

					<TabsTrigger value={Tab.FillSheetWithDataFromCsv}>
						{Tab.FillSheetWithDataFromCsv}
					</TabsTrigger>

					<TabsTrigger value={Tab.AddFilesToCells}>
						{Tab.AddFilesToCells}
					</TabsTrigger>
				</TabsList>

				<TabsContent
					className="flex h-[90%] data-[state=inactive]:hidden"
					value={Tab.AddDataToColumn}
				>
					<AddDataToColumnView
						setIsAddDataDialogOpen={setIsAddDataDialogOpen}
					/>
				</TabsContent>

				<TabsContent
					className="flex flex-col gap-6 h-full data-[state=inactive]:hidden"
					value={Tab.FillSheetWithDataFromCsv}
				>
					<FillSpreadsheetWithDataFromCsv
						setIsAddDataDialogOpen={setIsAddDataDialogOpen}
					/>
				</TabsContent>

				<TabsContent
					className="flex flex-col gap-6 min-h-1 h-full data-[state=inactive]:hidden"
					value={Tab.AddFilesToCells}
				>
					<AddFilesView setIsAddDataDialogOpen={setIsAddDataDialogOpen} />
				</TabsContent>
			</Tabs>
		</DialogContent>
	);
}
