import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { ExistingColumn } from "./common";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/Command";
import { useBatchTableColumns } from "../../hooks/get/use-fetch-batch-table-by-id";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";

type Props = {
	defaultValue: string;
	index: number;
	onSelect: (existingColumn: ExistingColumn, index: number) => void;
};

export function ChooseExistingColumnPopover({
	defaultValue,
	index,
	onSelect,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger className="flex h-10 items-center justify-between w-full max-w-full overflow-hidden rounded-md border border-border-smooth bg-popover px-3 py-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
				<span className="max-w-[70%] overflow-hidden">{defaultValue}</span>

				<ChevronDown className="size-4" />
			</PopoverTrigger>

			<PopoverContent
				className="bg-black border border-border-smooth  z-50 w-[var(--radix-popover-trigger-width)] rounded-lg"
				sideOffset={5}
				align="center"
				side="bottom"
			>
				{isOpen ? (
					<ChooseColumnCombobox
						defaultValue={defaultValue}
						setIsOpen={setIsOpen}
						onSelect={onSelect}
						index={index}
					/>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

function ChooseColumnCombobox({
	defaultValue,
	index,
	onSelect,
	setIsOpen,
}: {
	defaultValue: string;
	index: number;
	onSelect: (existingColumn: ExistingColumn, index: number) => void;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const batchTableColumns = useBatchTableColumns();

	const columns: Array<{
		existingColumn: ExistingColumn;
		value: string;
		label: string;
	}> = [];

	for (const column of batchTableColumns.values()) {
		const headerName = column.name;

		if (!headerName) continue;

		columns.push({
			value: headerName,
			label: headerName,
			existingColumn: {
				name: headerName,
				id: column.id,
			},
		});
	}

	return (
		<Command>
			<CommandInput
				placeholder="Search column name..."
				defaultValue={defaultValue}
			/>

			<CommandList>
				<CommandEmpty>No column found.</CommandEmpty>

				<CommandGroup>
					{columns.map((col) => {
						function handleSelect() {
							onSelect(col.existingColumn, index);

							setIsOpen(false);
						}

						return (
							<CommandItem
								className="button-hover"
								onSelect={handleSelect}
								key={Math.random()}
								value={col.value}
							>
								<span className="truncate whitespace-nowrap">{col.label}</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
