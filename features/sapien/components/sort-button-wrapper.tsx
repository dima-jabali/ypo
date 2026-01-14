import { useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
	generalContextStore,
	type PageOffset,
} from "#/contexts/general-ctx/general-context";
import {
	ProjectSortDirection,
	type ProjectColumnToSortOn,
} from "../hooks/get/use-fetch-batch-table-metadatas-page";

type Props = {
	thisColumn: ProjectColumnToSortOn | "name";
};

const TIMEOUT_TO_CHANGE_SORT_DIRECTION = 200;

export const SortButtonWrapper: React.FC<React.PropsWithChildren<Props>> = ({
	thisColumn,
	children,
}) => {
	const pageSort = generalContextStore.use.pageSort();

	const timeoutRef = useRef<NodeJS.Timeout>(undefined);

	const isActive = pageSort.sort === thisColumn;

	const handleSort = () => {
		clearTimeout(timeoutRef.current);

		timeoutRef.current = setTimeout(async () => {
			let nextSortDirection = null;

			if (isActive) {
				if (pageSort.sort_direction === ProjectSortDirection.ASC) {
					nextSortDirection = ProjectSortDirection.DESC;
				} else if (pageSort.sort_direction === null) {
					nextSortDirection = ProjectSortDirection.ASC;
				}
			} else {
				nextSortDirection = ProjectSortDirection.ASC;
			}

			generalContextStore.setState({
				pageSort: {
					sort: (nextSortDirection === null ? null : thisColumn) as
						| string
						| null,
					sort_direction: nextSortDirection,
				},
				pageOffset: 0 as PageOffset,
			});
		}, TIMEOUT_TO_CHANGE_SORT_DIRECTION);
	};

	return (
		<button
			className="flex h-full w-full items-center gap-3 truncate whitespace-nowrap p-3 font-bold text-primary transition-none button-hover"
			onPointerUp={handleSort}
		>
			{children}

			<span>
				<ChevronUp
					className="relative -bottom-1 size-4 stroke-accent opacity-0 data-[should-show=true]:opacity-100"
					data-should-show={
						!isActive ||
						pageSort.sort_direction === ProjectSortDirection.ASC ||
						pageSort.sort_direction === null
					}
				/>

				<ChevronDown
					className="relative -top-1 size-4 stroke-accent opacity-0 data-[should-show=true]:opacity-100"
					data-should-show={
						!isActive ||
						pageSort.sort_direction === ProjectSortDirection.DESC ||
						pageSort.sort_direction === null
					}
				/>
			</span>
		</button>
	);
};
