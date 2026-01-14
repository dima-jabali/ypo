import { CaseSensitive, ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { ChildFilter } from "./generalFilterTypes";
import { useSetCaseSensitive, useSetFilterValue } from "./hooks";
import { BatchTableMetadataColumnType } from "#/types/batch-table";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { Input } from "#/components/Input";
import { useBatchTableColumnsArray } from "../../hooks/get/use-fetch-batch-table-by-id";
import { isValidNumber } from "#/helpers/utils";

type Props = {
	childFilter: ChildFilter;
};

export const ValueInput = ({ childFilter }: Props) => {
	const [numberError, setNumberError] = useState<string | null>(null);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const setCaseSensitive = useSetCaseSensitive();
	const allColumns = useBatchTableColumnsArray();
	const setFilterValue = useSetFilterValue();

	const column = useMemo(() => {
		if (!childFilter.column_id) return undefined;

		// Find the column with matching ID
		return allColumns.find((col) => col.id === childFilter.column_id);
	}, [childFilter.column_id, allColumns]);

	const columnType = column?.column_type;

	const value = (() => {
		if (
			typeof childFilter.value === "boolean" ||
			typeof childFilter.value === "object"
		) {
			return `${childFilter.value}`;
		} else if (typeof childFilter.value === "number") {
			return childFilter.value;
		} else if (typeof childFilter.value !== "undefined") {
			return `${childFilter.value}`;
		} else return "";
	})();

	const booleanOptions = useMemo(
		() => [
			{
				value: "true",
				label: "True",
				isSelected: value === "true",
			},
			{
				value: "false",
				label: "False",
				isSelected: value === "false",
			},
		],
		[value],
	);

	const onStringValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilterValue(e.target.value, childFilter);
	};

	const handleChangeCaseSensitive = () => {
		setCaseSensitive(!childFilter.caseSensitive, childFilter);
	};

	const onNumberValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;

		// Empty value handling
		if (inputValue === "") {
			setFilterValue("", childFilter);
			setNumberError(null);

			return;
		}

		// Validate if it's a proper number
		const numValue = e.target.valueAsNumber;

		if (!isValidNumber(numValue)) {
			setNumberError("Please enter a valid number");

			// Still update the input field but don't update the filter value
			return;
		}

		// Valid number - clear any error and update the filter
		setFilterValue(numValue, childFilter);
		setNumberError(null);
	};

	const onBooleanValueSelectChange = (selectedValue: string) => {
		const boolValue = selectedValue === "true";

		setFilterValue(boolValue, childFilter);
	};

	// Render different input based on column type
	const renderInput = () => {
		switch (columnType) {
			case BatchTableMetadataColumnType.BOOLEAN:
				return (
					<Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
						<PopoverTrigger
							className="inline-flex justify-between items-center min-h-8 min-w-full border border-border-smooth rounded-sm py-1 px-2 gap-2 text-xs overflow-hidden button-hover"
							title="Select boolean value"
						>
							<span className="truncate capitalize">
								{value === "true" ? (
									<strong>True</strong>
								) : value === "false" ? (
									<strong>False</strong>
								) : (
									<i className="text-muted">Select boolean value</i>
								)}
							</span>

							<ChevronDownIcon className="size-3 flex-none" />
						</PopoverTrigger>

						<PopoverContent
							className="flex flex-col justify-start items-start min-w-min w-full gap-1 p-1"
							side="bottom"
						>
							{booleanOptions.map((option) => (
								<button
									className="flex justify-start items-center w-full gap-2 rounded py-1 px-3 button-hover-accent text-xs simple-scrollbar data-[default-checked=true]:text-accent-foreground data-[default-checked=true]:bg-accent capitalize font-bold"
									data-default-checked={option.isSelected}
									data-value={option.value}
									key={option.value}
									onClick={() => {
										onBooleanValueSelectChange(option.value);
										setIsPopoverOpen(false);
									}}
								>
									{option.label}
								</button>
							))}
						</PopoverContent>
					</Popover>
				);

			case BatchTableMetadataColumnType.NUMBER:
				return (
					<div className="flex flex-col w-full">
						<Input
							className="h-8 border-border-smooth text-xs rounded-sm data-[has-number-error=true]:border-red-500 data-[has-number-error=true]:focus-visible:ring-red-500"
							data-has-number-error={!!numberError}
							onChange={onNumberValueChange}
							placeholder="Numeric value"
							value={value}
							type="number"
							required
						/>

						{numberError && (
							<p className="text-red-500 text-xs mt-1">{numberError}</p>
						)}
					</div>
				);

			default:
				return (
					<>
						<Input
							className="h-8 border-border-smooth text-xs rounded-sm"
							onChange={onStringValueChange}
							placeholder="Value"
							value={`${value}`}
							type="text"
							required
						/>

						<button
							className="flex items-center justify-center aspect-square h-8 rounded-sm border border-transparent data-[is-case-sensitive=true]:bg-button-active data-[is-case-sensitive=true]:border-accent button-hover"
							data-is-case-sensitive={childFilter.caseSensitive}
							onClick={handleChangeCaseSensitive}
							title="Match case"
							type="button"
						>
							<CaseSensitive className="size-5 text-primary" />
						</button>
					</>
				);
		}
	};

	return <div className="flex gap-2">{renderInput()}</div>;
};
