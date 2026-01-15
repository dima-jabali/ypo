import { Fragment, useCallback, useRef, type PropsWithChildren } from "react";

import { shouldHaveValueInput } from "../../filters/filters";
import type {
	ChildFilter,
	Filter,
	FilterGroup,
} from "../../filters/utilityTypes";
import { AddFilterButtons } from "../AddFilterPopover";
import { PopoverFor_AND_or_OR } from "../PopoverFor_AND_or_OR";
import { PopoverToSelectColumnToFilter } from "../PopoverToSelectColumnToFilter";
import { PopoverToSelectValueOperator } from "../PopoverToSelectValueOperator";
import { ThreeDotsPopover } from "../ThreeDotsPopover";
import { ValueInput } from "../ValueInput";
import { isAParent } from "./helpers";
import {
	useGroupOfFilters,
	useTableForceRender,
} from "../../tableDataContextUtils";

export const FiltersToBeApplied: React.FC = () => {
	const groupOfFilters = useGroupOfFilters();

	// using forceRender because groupOfFilters is an object
	// that deals with pointers, as it was easier/simpler than deep cloning
	// every child filter plus changing their parent's references, which was
	// going to be a pointer anyway.
	useTableForceRender();

	const indexRef = useRef(0);
	const depthRef = useRef(0);

	const makeGroupOrRow = useCallback(
		(outerFilter: Filter, index: number): React.ReactNode => {
			const makeRow = (
				childFilter: ChildFilter,
				index: number,
			): React.ReactNode => {
				indexRef.current++;

				const isSecond = index === 1;
				const isFirst = index === 0;

				let left = null;

				if (isFirst) {
					left = <LeftText>Where</LeftText>;
				} else if (isSecond) {
					left = <PopoverFor_AND_or_OR filter={childFilter} />;
				} else {
					left = <LeftText>{childFilter.parent.filterOperator}</LeftText>;
				}

				return (
					<Fragment key={indexRef.current}>
						{left}

						<PopoverToSelectColumnToFilter childFilter={childFilter} />

						<PopoverToSelectValueOperator filter={childFilter} />

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
					return <>{filterGroup.children.map(makeGroupOrRow)}</>;
				}

				indexRef.current++;

				const rows = filterGroup.children.map(makeGroupOrRow);
				const isSecond = index === 1;

				let left = null;

				if (isSecond) {
					left = <PopoverFor_AND_or_OR filter={filterGroup} isSecondInARow />;
				} else if (filterGroup.parent) {
					left = <LeftText>{filterGroup.parent.filterOperator}</LeftText>;
				} else {
					left = <PopoverFor_AND_or_OR filter={filterGroup} />;
				}

				const jsx = (
					<Fragment key={indexRef.current}>
						{left}

						<div
							className="[grid-column:property-start_/_value-end] self-stretch border border-border-smooth rounded p-1"
							style={{
								backgroundColor: `rgba(150, 150, 150, ${((depthRef.current + 1) % 10) / 20})`,
							}}
						>
							<GroupWrapper>
								{rows}

								{depthRef.current > 0 ? (
									<div className="[grid-column:1/-1] inline-flex flex-row gap-1">
										<AddFilterButtons parentFilter={filterGroup} />
									</div>
								) : null}
							</GroupWrapper>
						</div>

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
		<div className="flex flex-col w-full flex-1 gap-1 p-1">
			<GroupWrapper>{rows}</GroupWrapper>
		</div>
	);
};

const GroupWrapper: React.FC<PropsWithChildren> = ({ children }) => (
	<div className="grid min-w-max gap-2 [grid-auto-rows:minmax(32px,min-content)] filters-grid">
		{children}
	</div>
);

const LeftText: React.FC<PropsWithChildren> = ({ children }) => (
	<p className="inline-flex justify-end items-center h-8 w-[66px] text-primary text-sm truncate">
		{children}
	</p>
);
