import {
	Fragment,
	useCallback,
	useRef,
	type CSSProperties,
	type PropsWithChildren,
} from "react";

import { useFiltersStore } from "./FiltersContextProvider";
import type { ChildFilter, Filter, FilterGroup } from "./generalFilterTypes";
import { PopoverFor_AND_or_OR } from "./PopoverFor_AND_or_OR";
import { PopoverToSelectColumnId } from "./PopoverToSelectColumnId";
import { PopoverToSelectValueOperator } from "./PopoverToSelectValueOperator";
import { isAParent, shouldHaveValueInput } from "./helpers";
import { ValueInput } from "./ValueInput";
import { ThreeDotsPopover } from "./ThreeDotsPopover";
import { AddFilterButtons } from "./conditional-execution-filter-popover";

export const FiltersToBeApplied: React.FC = () => {
	const groupOfFilters = useFiltersStore().use.groupOfFilters();

	// using forceRender because groupOfFilters is an object
	// that deals with pointers, as it was easier/simpler than deep cloning
	// every child filter plus changing their parent's references, which was
	// going to be a pointer anyway.
	useFiltersStore().use.forceRefresh();

	const indexRef = useRef(0);
	const depthRef = useRef(0);

	const makeGroupOrRow = useCallback(
		(outerFilter: Filter, index: number): React.ReactNode => {
			const makeRow = (
				childFilter: ChildFilter,
				columnIndexInRow: number,
			): React.ReactNode => {
				indexRef.current++;

				const isSecond = columnIndexInRow === 1;
				const isFirst = columnIndexInRow === 0;

				let left = <div></div>; // Needed to occupy grid space.

				if (isFirst) {
					// Do nothing
				} else if (isSecond) {
					left = <PopoverFor_AND_or_OR filter={childFilter} />;
				} else {
					left = <LeftText>{childFilter.parent.filter_operator}</LeftText>;
				}

				return (
					<Fragment key={indexRef.current}>
						{left}

						<PopoverToSelectColumnId childFilter={childFilter} />

						<PopoverToSelectValueOperator childFilter={childFilter} />

						{shouldHaveValueInput(childFilter) ? (
							<ValueInput childFilter={childFilter} />
						) : (
							<div></div> // Needed to occupy grid space.
						)}

						<ThreeDotsPopover filter={childFilter} />
					</Fragment>
				);
			};

			const makeGroup = (
				filterGroup: FilterGroup,
				index: number,
			): React.ReactNode => {
				depthRef.current++;

				if (indexRef.current === 0) {
					// eslint-disable-next-line react-hooks/immutability
					return filterGroup.children.map(makeGroupOrRow);
				}

				indexRef.current++;

				const rows = filterGroup.children.map(makeGroupOrRow);
				const isSecond = index === 1;

				let left = null;

				if (isSecond) {
					left = <PopoverFor_AND_or_OR filter={filterGroup} isSecondInARow />;
				} else if (filterGroup.parent) {
					left = <LeftText>{filterGroup.parent.filter_operator}</LeftText>;
				} else {
					left = <PopoverFor_AND_or_OR filter={filterGroup} />;
				}

				const jsx = (
					<Fragment key={indexRef.current}>
						{left}

						<BorderedGroupWrapper>
							<GroupWrapper>
								{rows}

								{depthRef.current > 0 ? (
									/* About `grid-column: 1/-1`: as negative number counts from the right, this code specifies the grid-column to the end of the last column. */
									<div className="inline-flex [grid-column:1/-1] gap-1">
										<AddFilterButtons parentFilter={filterGroup} />
									</div>
								) : null}
							</GroupWrapper>
						</BorderedGroupWrapper>

						<ThreeDotsPopover filter={filterGroup} />
					</Fragment>
				);

				depthRef.current--;

				return jsx;
			};

			return isAParent(outerFilter)
				? makeGroup(outerFilter, index)
				: makeRow(outerFilter, index);
		},
		[],
	);

	depthRef.current = 0;
	indexRef.current = 0;

	const rows = groupOfFilters.children.map(makeGroupOrRow);

	return (
		<div className="flex flex-col gap-1 p-1">
			<GroupWrapper>{rows}</GroupWrapper>
		</div>
	);
};

const LeftText: React.FC<PropsWithChildren> = ({ children }) => (
	<p className="text-sm inline-flex justify-end items-center h-8 w-16 truncate lowercase first-letter:uppercase">
		{children}
	</p>
);

const GROUP_WRAPPER_STYLES: CSSProperties = {
	gridTemplateColumns: `
	[ operator-start 				] 66px [ operator-end
	  column-start   				] auto [ column-end
	  value-operator-start  ] auto [ value-operator-end
	  value-input-start    	] auto [ value-input-end
	  menu-start     				] 32px [ menu-end     			]
`,
};

const GroupWrapper: React.FC<PropsWithChildren> = ({ children }) => (
	<div
		className="grid [grid-auto-rows:minmax(2rem,min-content)] justify-items-stretch items-start gap-2 min-w-max box-border"
		style={GROUP_WRAPPER_STYLES}
	>
		{children}
	</div>
);

const BorderedGroupWrapper: React.FC<PropsWithChildren> = ({ children }) => (
	<div className="[grid-column:column-start/value-input-end] self-stretch border border-border-smooth rounded-sm p-2 bg-primary/5">
		{children}
	</div>
);
