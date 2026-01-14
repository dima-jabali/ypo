import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { SelectedColumnToAdd } from "./common";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#/components/Command";

type Props = {
	columnsfromFile: Array<SelectedColumnToAdd>;
	defaultValue: string;
	index: number;
	onSelect: (nameOfNewColumn: string, index: number) => void;
};

export function ChooseNewColumnFromFilePopover({
	columnsfromFile,
	defaultValue,
	index,
	onSelect,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<div className="flex h-10 items-center justify-between w-full max-w-full overflow-hidden rounded-md border border-border-smooth  bg-popover px-3 py-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
					<div className="max-w-[70%] overflow-hidden">{defaultValue}</div>

					<div>
						<ChevronDown className="size-4" />
					</div>
				</div>
			</PopoverTrigger>

			<PopoverContent
				className="bg-black border border-border-smooth  z-50 w-[var(--radix-popover-trigger-width)] rounded-lg"
				sideOffset={5}
				align="center"
				side="bottom"
			>
				{isOpen ? (
					<ChooseColumnCombobox
						columnsfromFile={columnsfromFile}
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
	columnsfromFile,
	defaultValue,
	index,
	onSelect,
	setIsOpen,
}: {
	columnsfromFile: Array<SelectedColumnToAdd>;
	defaultValue: string;
	index: number;
	onSelect: (nameOfNewColumn: string, index: number) => void;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	return (
		<Command>
			<CommandInput
				placeholder="Search column name..."
				defaultValue={defaultValue}
			/>

			<CommandList>
				<CommandEmpty>No column found.</CommandEmpty>

				<CommandGroup>
					{columnsfromFile.map((col) => {
						const handleSelect = () => {
							onSelect(col.label, index);

							setIsOpen(false);
						};

						return (
							<CommandItem
								className="button-hover"
								onSelect={handleSelect}
								value={col.value}
								key={col.id}
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
