import { useLayoutEffect, useReducer, useRef, useState } from "react";
import { ChevronDownIcon, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { classNames } from "#/helpers/class-names";

export type TagGroupMinimumInterface = {
	id: string | number;
	color?: string;
	name: string;
};

export type TagGroupProps<T extends TagGroupMinimumInterface> = {
	noMoreItemsToSelect: React.ReactNode;
	customInputIdentifier?: string;
	disabled?: boolean | undefined;
	wrapperClassName?: string;
	footer?: React.ReactNode;
	withSearch?: boolean;
	placeholder: string;
	selectedValues: T[];
	isMulti?: boolean;
	allValues: T[];
	renderRemovableItem: (
		item: T,
		index: number,
		handleRemoveItem: (index: number) => void,
	) => React.ReactNode;
	renderItem: (
		item: T,
		handleAddSelectedValue: (item: T) => void,
	) => React.ReactNode;
	renderItemWhenDisabled?: ((item: T) => React.ReactNode) | undefined;
	setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>;
	onClose?: () => void;
};

export const TagGroup = <T extends TagGroupMinimumInterface>({
	wrapperClassName = "",
	customInputIdentifier,
	noMoreItemsToSelect,
	selectedValues,
	placeholder,
	withSearch,
	allValues,
	disabled,
	isMulti,
	footer,
	renderItemWhenDisabled,
	renderRemovableItem,
	setSelectedValues,
	renderItem,
	onClose,
}: TagGroupProps<T>) => {
	const [searchResults, setSearchResults] = useState(allValues);
	const [searchString, setSearchString] = useState("");

	const [isOpen, setIsOpen] = useReducer(
		(_prev: boolean, nextIsOpen: boolean) => {
			const isClosing = nextIsOpen === false;

			if (isClosing) {
				onClose?.();
			}

			return nextIsOpen;
		},
		false,
	);

	const inputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const wrapperWidth = useRef("");

	useLayoutEffect(() => {
		const searchStringTrimmed = searchString.trim().toLocaleLowerCase();
		const results = [];

		for (const item of allValues) {
			if (selectedValues.some((selectedValue) => item.id === selectedValue.id))
				continue;

			if (searchStringTrimmed) {
				// There's a search string, Show all values that match the search except those already selected.
				if (
					item.name?.toLocaleLowerCase().trim().includes(searchStringTrimmed)
				) {
					results.push(item);
				}
			} else {
				// Search string is empty, show all available values except those already selected.
				results.push(item);
			}
		}

		setSearchResults(results);
	}, [allValues, selectedValues, searchString]);

	useLayoutEffect(() => {
		// When a tag is added, the search term should be removed:
		setSearchString("");
	}, [selectedValues]);

	const handleRemoveSelectedValue = (index: number) => {
		setSelectedValues((prev) => {
			if (isMulti) {
				const newSelectedValues = [...prev];

				newSelectedValues.splice(index, 1);

				return newSelectedValues;
			} else {
				return [];
			}
		});
	};

	const handleAddSelectedValue = (value: T) => {
		setSelectedValues((prev) => {
			if (isMulti) {
				return [...prev, value];
			} else {
				setIsOpen(false);

				return [value];
			}
		});
	};

	const handleRemoveAll = () => {
		setSelectedValues([]);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchString(e.target.value);
		setIsOpen(true);
	};

	/** Prevent focusing on the popover on open or typing on input. */
	const handlePopoverFocus = (e: Event) => {
		e.stopPropagation();
		e.preventDefault();

		inputRef.current?.focus();
	};

	const handleOnFocus = (e: React.FocusEvent<HTMLDivElement, Element>) => {
		e.stopPropagation();

		const isFocusOnPopover = e.target === popoverRef.current;

		if (isFocusOnPopover) {
			inputRef.current?.focus();
		}
	};

	const RenderRemovableItem = (item: T, index: number) =>
		disabled && renderItemWhenDisabled
			? renderItemWhenDisabled(item)
			: renderRemovableItem(item, index, handleRemoveSelectedValue);

	const RenderItem = (item: T) => renderItem(item, handleAddSelectedValue);

	// eslint-disable-next-line react-hooks/refs
	if (wrapperRef.current) {
		// eslint-disable-next-line react-hooks/refs
		wrapperWidth.current = `${wrapperRef.current.offsetWidth}px`;
	}

	/* Left side of the input container/Selected values container */

	return (
		<div // Outer input container
			className={classNames(
				"flex min-h-8 w-full max-w-full items-end justify-between rounded-md border border-border-smooth  bg-yellow-200/20 p-1 text-sm font-medium aria-disabled:pointer-events-none",
				wrapperClassName,
			)}
			aria-disabled={disabled}
			aria-expanded={isOpen}
			ref={wrapperRef}
		>
			<div
				className="box-border flex w-full flex-wrap gap-2 px-0.5 data-[is-button=true]:w-full"
				onClick={() => setIsOpen(true)}
				data-is-button={!isMulti}
			>
				{selectedValues.map(RenderRemovableItem)}

				{withSearch && !disabled ? (
					<input
						className="flex min-h-8 cursor-text appearance-none items-center justify-center bg-transparent outline-hidden ring-transparent"
						onChange={handleInputChange}
						id={customInputIdentifier}
						placeholder={placeholder}
						value={searchString}
						autoComplete="off"
						ref={inputRef}
						type="text"
					/>
				) : selectedValues.length > 0 ? null : (
					<p className="ml-2 flex min-h-8 items-center justify-center">
						{placeholder}
					</p>
				)}
			</div>

			{disabled ? null : (
				<div
					/* Right side of the input container */ className="flex h-8 items-center justify-center gap-1"
				>
					<button
						className="flex aspect-square items-center justify-center rounded-full p-2 button-hover"
						title="Remove all selected values"
						onClick={handleRemoveAll}
						type="button"
					>
						<X className="size-4" />
					</button>

					<div className="h-6 w-[1px] bg-slate-500" />

					<Popover onOpenChange={setIsOpen} open={isOpen} modal>
						<PopoverTrigger
							className="flex aspect-square items-center justify-center rounded-full p-2 button-hover"
							title="Toggle selection menu open"
						>
							<ChevronDownIcon className="size-4" />
						</PopoverTrigger>

						{isOpen ? (
							<PopoverContent
								className="z-100 flex max-h-[70vh] w-[var(--popover-width)] flex-col overflow-hidden"
								// eslint-disable-next-line react-hooks/refs
								style={{ width: wrapperWidth.current }}
								onCloseAutoFocus={handlePopoverFocus}
								onOpenAutoFocus={handlePopoverFocus}
								onFocus={handleOnFocus}
								ref={popoverRef}
								hideWhenDetached
								alignOffset={-5}
								sideOffset={5}
								side="bottom"
								align="end"
							>
								<div className="flex h-4/5 w-full flex-col simple-scrollbar">
									<div className="simple-scrollbar rounded min-h-8">
										{searchResults.length > 0
											? searchResults.map(RenderItem)
											: noMoreItemsToSelect}
									</div>
								</div>

								{footer ? (
									<>
										<div className="h-[1px] w-full bg-border-smooth" />

										{footer}
									</>
								) : null}
							</PopoverContent>
						) : null}
					</Popover>
				</div>
			)}
		</div>
	);
};
