import { DialogDescription } from "@ariakit/react";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/Dialog";
import { TagGroup, type TagGroupProps } from "#/components/tag-group";
import type { SelectedColumnToAdd } from "./common";

export function SelectMultipleColumnsDialog({
	allColumns,
	onSelect,
	initialValue,
	children,
	description,
}: React.PropsWithChildren<{
	initialValue: Array<SelectedColumnToAdd>;
	allColumns: Array<SelectedColumnToAdd>;
	description: string;
	onSelect: (columns: Array<SelectedColumnToAdd>) => void;
}>) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			{children ? (
				children
			) : (
				<DialogTrigger
					className="flex flex-wrap min-h-10 items-center justify-between rounded-md border border-border-smooth bg-popover p-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 w-fit gap-1 text-primary"
					title="Select columns that will be added"
				>
					{initialValue.length === 0 ? (
						<i className="text-muted">Select columns</i>
					) : (
						initialValue.map((col) => {
							const column = allColumns.find((c) => c.id === col.id);

							if (!column) {
								return null;
							}

							return (
								<div className="w-full text-secondary" key={col.id}>
									<span className="relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded-sm bg-default-badge px-2 py-1 min-h-[1lh]">
										{column.name}
									</span>
								</div>
							);
						})
					)}

					<ChevronDown className="size-4 flex-none" />
				</DialogTrigger>
			)}

			{isOpen ? (
				<Content
					initialValue={initialValue}
					description={description}
					allcolumns={allColumns}
					setIsOpen={setIsOpen}
					onSelect={onSelect}
				/>
			) : null}
		</Dialog>
	);
}

function Content({
	setIsOpen,
	allcolumns,
	onSelect,
	initialValue,
	description,
}: {
	initialValue: Array<SelectedColumnToAdd>;
	allcolumns: Array<SelectedColumnToAdd>;
	description: string;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	onSelect: (columns: Array<SelectedColumnToAdd>) => void;
}) {
	const [selectedColumns, setSelectedColumns] = useState(initialValue);

	const handleSave = () => {
		onSelect(selectedColumns);

		setIsOpen(false);
	};

	return (
		<DialogContent className="flex flex-col gap-6 max-h-[90vh] md:max-w-2xl lg:max-w-3xl">
			<DialogHeader>
				<DialogTitle className="text-2xl">Select columns</DialogTitle>

				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>

			<TagGroup
				noMoreItemsToSelect={
					<p className="text-center w-full py-3">No more columns to select.</p>
				}
				renderRemovableItem={renderRemovableColumnItem}
				placeholder="Search columns to add..."
				setSelectedValues={setSelectedColumns}
				selectedValues={selectedColumns}
				renderItem={renderColumnItem}
				wrapperClassName="z-120"
				allValues={allcolumns}
				withSearch
				isMulti
			/>

			<DialogFooter>
				<Button variant="success" onClick={handleSave}>
					Save
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}

const renderRemovableColumnItem: TagGroupProps<SelectedColumnToAdd>["renderRemovableItem"] =
	(item, index, handleRemoveSelectedValue) => (
		<div /* Selected item container */
			className="relative box-border flex w-min items-center justify-center overflow-hidden rounded-sm bg-default-badge text-secondary"
			key={item.id}
		>
			<p className="whitespace-nowrap px-2">{item.name}</p>

			<button /* Remove item button */
				className="h-full p-2 transition-none hover:bg-destructive/80 hover:text-secondary"
				onPointerUp={() => handleRemoveSelectedValue(index)}
				type="button"
			>
				<X className="size-4" />
			</button>
		</div>
	);

const renderColumnItem: TagGroupProps<SelectedColumnToAdd>["renderItem"] = (
	item,
	handleAddSelectedValue,
) => (
	<div key={item.id}>
		<button
			className="w-full p-1 button-hover rounded-md text-secondary"
			onPointerUp={() => handleAddSelectedValue(item)}
		>
			<span className="relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded-sm bg-default-badge px-2 min-h-[1lh]">
				{item.name}
			</span>
		</button>
	</div>
);
