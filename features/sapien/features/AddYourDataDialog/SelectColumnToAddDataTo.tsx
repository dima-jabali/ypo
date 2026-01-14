import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/Command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { type BatchTableColumn } from "#/types/batch-table";
import { useBatchTableColumns } from "../../hooks/get/use-fetch-batch-table-by-id";

type Props = {
	defaultValue: BatchTableColumn | null;
	onSelect: (batchTableColumn: BatchTableColumn) => void;
};

export function SelectColumnToAddDataTo({ defaultValue, onSelect }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<label className="flex flex-col gap-1">
					<span className="text-sm text-primary pl-3">
						Choose column to add bulk data to:
					</span>

					<div className="flex h-10 items-center justify-between w-full max-w-full overflow-hidden rounded-md border border-border-smooth  bg-popover px-3 py-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 button-hover">
						<div className="max-w-[70%] overflow-hidden">
							{defaultValue?.name}
						</div>

						<div>
							<ChevronDown className="size-4" />
						</div>
					</div>
				</label>
			</PopoverTrigger>

			<PopoverContent
				className="p-0 z-50 w-[var(--radix-popover-trigger-width)] rounded-lg"
				sideOffset={5}
				align="center"
				side="bottom"
			>
				{isOpen ? (
					<ChooseColumnCombobox
						defaultValue={defaultValue}
						setIsOpen={setIsOpen}
						onSelect={onSelect}
					/>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

function ChooseColumnCombobox({
	defaultValue,
	onSelect,
	setIsOpen,
}: Props & {
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const batchTableColumns = useBatchTableColumns();

	const columns: Array<{
		batchTableColumn: BatchTableColumn;
		value: string;
		label: string;
	}> = [];

	for (const column of batchTableColumns.values()) {
		const headerName = column.name;

		if (!headerName) continue;

		columns.push({
			batchTableColumn: column,
			value: headerName,
			label: headerName,
		});
	}

	return (
		<Command>
			<CommandInput
				defaultValue={defaultValue?.name ?? ""}
				placeholder="Search column name..."
				className="placeholder:italic"
			/>

			<CommandList>
				<CommandEmpty>No columns found.</CommandEmpty>

				<CommandGroup>
					{columns.map((col) => {
						const isSelected = defaultValue?.id === col.batchTableColumn.id;

						const handleSelect = () => {
							onSelect(col.batchTableColumn);

							setIsOpen(false);
						};

						return (
							<CommandItem
								className="button-hover flex gap-2 items-center group text-primary"
								key={col.batchTableColumn.id}
								title="Select this column"
								onSelect={handleSelect}
								value={col.value}
							>
								{isSelected ? (
									<Check className="size-4 group-data-[state=checked]:text-accent-foreground" />
								) : (
									<span className="size-4"></span>
								)}

								<span className="truncate whitespace-nowrap aria-disabled:pointer-events-none">
									{col.label}
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</Command>
	);
}
