import { useEffect, useLayoutEffect, useRef, useState } from "react";

const keysToAction = {
	ArrowRight(
		e: KeyboardEvent,
		list: HTMLDivElement,
		_input: HTMLInputElement,
		isAnyButtonFocused: boolean,
		_onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		const currentListItemFocused = e.target as HTMLButtonElement | null;

		if (!currentListItemFocused) {
			if (!isAnyButtonFocused) {
				(list.children[1] as HTMLButtonElement | undefined)?.focus();
			}

			return;
		}

		const nextListItem =
			currentListItemFocused.nextElementSibling as HTMLButtonElement | null;

		if (nextListItem) {
			nextListItem.focus();

			e.preventDefault();
		} else {
			const firstElement = list.firstElementChild as HTMLButtonElement | null;

			firstElement?.focus();

			e.preventDefault();
		}
	},
	ArrowDown(
		e: KeyboardEvent,
		list: HTMLDivElement,
		_input: HTMLInputElement,
		_isAnyButtonFocused: boolean,
		_onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		const currentListItemFocused = e.target as HTMLButtonElement | null;

		if (!currentListItemFocused) return;

		const gridStyles = window.getComputedStyle(list);

		const gridTemplateColumns = gridStyles.gridTemplateColumns;
		const columnCount = gridTemplateColumns.split(" ").length;

		const children = [...list.children];
		const totalItems = children.length;

		let currentListItemFocusedIndex = 0;

		for (let i = 0; i < totalItems; ++i) {
			if (children[i] === currentListItemFocused) {
				currentListItemFocusedIndex = i;
				break;
			}
		}

		const belowListItem = children.at(
			currentListItemFocusedIndex + columnCount > totalItems
				? currentListItemFocusedIndex + columnCount - totalItems - 1
				: currentListItemFocusedIndex + columnCount,
		) as HTMLButtonElement | undefined;

		if (belowListItem) {
			belowListItem.focus();

			e.preventDefault();
		} else {
			const firstElement = list.firstElementChild as HTMLButtonElement | null;

			firstElement?.focus();

			e.preventDefault();
		}
	},
	ArrowLeft(
		e: KeyboardEvent,
		list: HTMLDivElement,
		_input: HTMLInputElement,
		_isAnyButtonFocused: boolean,
		_onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		const currentListItemFocused = e.target as HTMLButtonElement | null;

		if (!currentListItemFocused) return;

		const prevListItem =
			currentListItemFocused.previousElementSibling as HTMLButtonElement | null;

		if (prevListItem) {
			prevListItem.focus();

			e.preventDefault();
		} else {
			const lastElement = list.lastElementChild as HTMLButtonElement | null;

			lastElement?.focus();

			e.preventDefault();
		}
	},
	ArrowUp(
		e: KeyboardEvent,
		list: HTMLDivElement,
		_input: HTMLInputElement,
		_isAnyButtonFocused: boolean,
		_onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		const currentListItemFocused = e.target as HTMLButtonElement | null;

		if (!currentListItemFocused) return;

		const gridStyles = window.getComputedStyle(list);

		const gridTemplateColumns = gridStyles.gridTemplateColumns;
		const columnCount = gridTemplateColumns.split(" ").length;

		const children = [...list.children];
		const totalItems = children.length;

		let currentListItemFocusedIndex = 0;

		for (let i = 0; i < totalItems; ++i) {
			if (children[i] === currentListItemFocused) {
				currentListItemFocusedIndex = i;
				break;
			}
		}

		const belowListItem = children.at(
			currentListItemFocusedIndex - columnCount < 0
				? currentListItemFocusedIndex - columnCount + 1
				: currentListItemFocusedIndex - columnCount,
		) as HTMLButtonElement | undefined;

		if (belowListItem) {
			belowListItem.focus();

			e.preventDefault();
		} else {
			const firstElement = list.firstElementChild as HTMLButtonElement | null;

			firstElement?.focus();

			e.preventDefault();
		}
	},
	Enter(
		e: KeyboardEvent,
		list: HTMLDivElement,
		input: HTMLInputElement,
		_isAnyButtonFocused: boolean,
		onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		if (document.activeElement === input) {
			const firstButton = list.firstElementChild as HTMLButtonElement | null;

			if (firstButton) {
				onSelect(e, firstButton);
			}
		} else {
			onSelect(e);
		}
	},
	Tab(
		e: KeyboardEvent,
		list: HTMLDivElement,
		input: HTMLInputElement,
		_isAnyButtonFocused: boolean,
		_onSelect: (
			e:
				| React.KeyboardEvent<HTMLButtonElement>
				| React.PointerEvent<HTMLButtonElement>
				| KeyboardEvent,
			selectedButton?: HTMLButtonElement,
		) => void,
	) {
		if (document.activeElement === input) {
			(list.firstElementChild as HTMLButtonElement | null)?.focus();
			e.preventDefault();
		}
	},
} as const;

export const useListWithArrowKeysFocus = (
	searchRawString: string,
	onSelect: (
		e:
			| React.KeyboardEvent<HTMLButtonElement>
			| React.PointerEvent<HTMLButtonElement>
			| KeyboardEvent,
		selectedButton?: HTMLButtonElement,
	) => void,
) => {
	const [isAnyButtonFocused, setIsAnyButtonFocused] = useState(false);
	const [shouldRerender, setShouldRerender] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const input = inputRef.current;
		const list = listRef.current;

		if (!(list && input)) return;

		const moveFocus = (e: KeyboardEvent) => {
			const input = inputRef.current;
			const list = listRef.current;

			if (!(list || input)) return;

			// @ts-expect-error => This is fine. If the string doesn't exist, nothing will run.
			const action = keysToAction[e.key];

			if (action) {
				action(e, list, input, isAnyButtonFocused, onSelect);

				setShouldRerender((prev) => !prev);

				if (list) {
					list.classList.add("is-being-selected-by-keyboard");
				}
			}
		};

		const changeFocus = () => {
			setIsAnyButtonFocused(true);

			if (list) {
				list.classList.remove("is-being-selected-by-keyboard");
			}
		};

		input.addEventListener("keydown", moveFocus);
		list.addEventListener("keydown", moveFocus);
		list.addEventListener("click", changeFocus);

		return () => {
			input?.removeEventListener?.("keydown", moveFocus);
			list?.removeEventListener?.("keydown", moveFocus);
			list?.removeEventListener("click", changeFocus);
		};
	}, [isAnyButtonFocused, onSelect]);

	useLayoutEffect(() => {
		const list = listRef.current;

		if (!list) return;

		const focusedElement = list.querySelector(":focus");

		setIsAnyButtonFocused(Boolean(focusedElement));
	}, [shouldRerender, searchRawString]);

	return { listRef, isAnyButtonFocused, inputRef };
};
