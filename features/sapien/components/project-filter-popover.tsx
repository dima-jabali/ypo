import { FunnelIcon } from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import { Checkbox } from "#/components/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import {
	FilterArchived,
	generalContextStore,
} from "#/contexts/general-ctx/general-context";

const NON_ARCHIVED = "Non-Archived";
const ARCHIVED = "Archived";

export function ProjectFilterPopover() {
	const pageArchived = generalContextStore.use.pageArchived();

	const [selectedOption, setSelectedOption] = useState({
		[NON_ARCHIVED]:
			pageArchived === FilterArchived.ONLY_NON_ARCHIVED ||
			pageArchived === FilterArchived.ALL ||
			pageArchived === null,
		[ARCHIVED]:
			pageArchived === FilterArchived.ONLY_ARCHIVED ||
			pageArchived === FilterArchived.ALL ||
			pageArchived === null,
	});
	const [isOpen, setIsOpen] = useState(false);

	function handleApplyFilter(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setIsOpen(false);

		const isNonArchivedChecked = selectedOption[NON_ARCHIVED];
		const isArchivedChecked = selectedOption[ARCHIVED];

		const areBothOptionsChecked = isNonArchivedChecked && isArchivedChecked;

		let nextArchived: FilterArchived;

		if (areBothOptionsChecked) {
			nextArchived = FilterArchived.ALL;
		} else if (isNonArchivedChecked) {
			nextArchived = FilterArchived.ONLY_NON_ARCHIVED;
		} else if (isArchivedChecked) {
			nextArchived = FilterArchived.ONLY_ARCHIVED;
		} else {
			// Shoudn't be possible!
			nextArchived = FilterArchived.ALL;
		}

		generalContextStore.setState({ pageArchived: nextArchived });
	}

	function handleSetFilter(
		filter: typeof ARCHIVED | typeof NON_ARCHIVED,
		isChecked: boolean,
	) {
		setSelectedOption((prev) => {
			const next = { ...prev, [filter]: isChecked };

			const values = Object.values(next);

			if (values.every((value) => value === false)) {
				// They can't all be un-selected, so let's not do anything

				return prev;
			}

			return next;
		});
	}

	useLayoutEffect(() => {
		// Set the actual current filters when closed, or when the currentArchivedFilterMode changes:

		setSelectedOption({
			[NON_ARCHIVED]:
				pageArchived === FilterArchived.ONLY_NON_ARCHIVED ||
				pageArchived === FilterArchived.ALL ||
				pageArchived === null,
			[ARCHIVED]:
				pageArchived === FilterArchived.ONLY_ARCHIVED ||
				pageArchived === FilterArchived.ALL ||
				pageArchived === null,
		});
	}, [pageArchived, isOpen]);

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<Button
					className="hover:border-accent"
					variant={ButtonVariant.OUTLINE}
					title="Filter projects"
					size="sm"
				>
					<FunnelIcon className="size-4" />

					<p>Filter</p>
				</Button>
			</PopoverTrigger>

			<PopoverContent sideOffset={5} asChild align="start">
				<form
					className="z-10 flex flex-col rounded border border-border-smooth bg-popover p-1 gap-1"
					onSubmit={handleApplyFilter}
				>
					<label className="flex items-center justify-start gap-3 rounded-sm p-2 hover:bg-button-hover text-sm">
						<Checkbox
							onCheckedChange={(newIsChecked) =>
								handleSetFilter(ARCHIVED, newIsChecked as boolean)
							}
							checked={selectedOption[ARCHIVED]}
							name={ARCHIVED}
						/>

						<p>{ARCHIVED}</p>
					</label>

					<label className="flex items-center gap-3 rounded-sm p-2 hover:bg-button-hover text-sm">
						<Checkbox
							onCheckedChange={(newIsChecked) =>
								handleSetFilter(NON_ARCHIVED, newIsChecked as boolean)
							}
							checked={selectedOption[NON_ARCHIVED]}
							name={NON_ARCHIVED}
						/>

						<p>{NON_ARCHIVED}</p>
					</label>

					<hr className="border-border-smooth " />

					<Button variant="purple" title="Apply filter" type="submit">
						Apply
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}
