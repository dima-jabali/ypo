import { CheckIcon, PlusCircleIcon } from "lucide-react";
import { startTransition, useState } from "react";
import { titleCase } from "scule";

import { Badge } from "#/components/Badge";
import { Button } from "#/components/Button";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";

type Props = {
	numberOfAvailableItemsForEachValue: Map<string, number>;
	selectedValuesToFilter: Array<string>;
	allValuesToFilter: Array<string>;
	inputPlaceholder: string;
	filterTitle: string;
	setSelectedValuesToFilter: React.Dispatch<React.SetStateAction<string[]>>;
};

export function StringFilterCombobox({
	numberOfAvailableItemsForEachValue,
	selectedValuesToFilter,
	allValuesToFilter,
	inputPlaceholder,
	filterTitle,
	setSelectedValuesToFilter,
}: Props) {
	const [searchResults, setSearchResults] = useState(allValuesToFilter);
	const [rawFilterString, setRawFilterString] = useState("");

	function handleOnChangeFilterString(e: React.ChangeEvent<HTMLInputElement>) {
		const nextValue = e.target.value;

		setRawFilterString(nextValue);

		startTransition(() => {
			const filterString = nextValue.trim().toLowerCase();

			if (filterString) {
				setSearchResults(
					allValuesToFilter.filter((value) =>
						value.toLowerCase().includes(filterString),
					),
				);
			} else {
				setSearchResults(allValuesToFilter);
			}
		});
	}

	const handleClose = () => setRawFilterString("");

	return (
		<Popover onOpenChange={handleClose}>
			<PopoverTrigger asChild>
				<Button
					className="group flex h-8 border-dashed gap-2"
					title="Set filters"
					variant="outline"
					size="sm"
				>
					<PlusCircleIcon className="size-4" />

					<span>{filterTitle}</span>

					{selectedValuesToFilter.length > 0 ? (
						<>
							<hr className="h-4 border-r border-border-smooth " />

							<Badge
								className="rounded-xs px-1 font-normal lg:hidden group-hover:text-primary"
								variant="secondary"
							>
								{selectedValuesToFilter.length}
							</Badge>

							<div className="hidden space-x-1 lg:flex">
								{selectedValuesToFilter.length > 2 ? (
									<Badge className="rounded-xs px-1 font-normal tabular-nums group-hover:text-secondary">
										{selectedValuesToFilter.length} selected
									</Badge>
								) : (
									selectedValuesToFilter.map((value) => (
										<Badge
											className="rounded-xs px-1 font-sm text-primary group-hover:text-primary"
											variant="secondary"
											key={value}
										>
											{titleCase(value.toLowerCase())}
										</Badge>
									))
								)}
							</div>
						</>
					) : null}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				className="w-[206px] z-500 text-sm rounded-lg p-0 max-h-[45vh] simple-scrollbar"
				sideOffset={5}
				align="start"
			>
				<input
					className="bg-transparent focus:outline-hidden focus:border-white/40 rounded-md px-1.5 w-[calc(100%-0.5rem)] py-1 m-1 mb-0"
					onChange={handleOnChangeFilterString}
					placeholder={inputPlaceholder}
					value={rawFilterString}
					type="search"
				/>

				<hr className="my-1 border-border-smooth " />

				<ul className="flex flex-col">
					{searchResults.map((value) => {
						const isSelected = selectedValuesToFilter.includes(value);

						return (
							<li
								className="rounded-md button-hover cursor-pointer flex items-center gap-2 p-2 mx-1 text-xs last:mb-1"
								onClick={() => {
									startTransition(() => {
										if (isSelected) {
											setSelectedValuesToFilter((prev) =>
												prev.filter((v) => v !== value),
											);
										} else {
											setSelectedValuesToFilter((prev) => [...prev, value]);
										}
									});
								}}
								key={value}
							>
								<div
									className="flex size-4 items-center justify-center rounded-full border border-primary opacity-50 data-[is-selected=true]:bg-primary data-[is-selected=true]:text-primary-foreground"
									data-is-selected={isSelected}
								>
									<CheckIcon
										className="size-4 stroke-secondary data-[hidden=true]:hidden"
										data-hidden={!isSelected}
									/>
								</div>

								<span>{titleCase(value.toLowerCase())}</span>

								<span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
									{numberOfAvailableItemsForEachValue.get(value)}
								</span>
							</li>
						);
					})}

					{searchResults.length === 0 ? (
						<p className="flex items-center justify-center w-full h-8">
							No results
						</p>
					) : null}
				</ul>

				{selectedValuesToFilter.length > 0 ? (
					<>
						<hr className="my-1 border-border-smooth" />

						<button
							className="p-2 m-1 mt-0 w-[calc(100%-1rem)] button-hover flex justify-center text-center flex-none rounded-md"
							onClick={() =>
								startTransition(() => setSelectedValuesToFilter([]))
							}
							type="button"
						>
							Clear filters
						</button>
					</>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
