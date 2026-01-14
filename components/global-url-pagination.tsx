import { memo, startTransition, useMemo } from "react";

import {
	generalContextStore,
	type PageLimit,
	type PageOffset,
} from "#/contexts/general-ctx/general-context";
import { isValidNumber } from "#/helpers/utils";

type PaginationProps = {
	controlledPageOffset?: PageOffset;
	controlledPageLimit?: PageLimit;
	totalNumberOfItems: number;
	setControlledPageOffset?: (offset: PageOffset) => void;
	setControlledPageLimit?: (limit: PageLimit) => void;
};

export const GlobalUrlPagination = memo(function GlobalUrlPagination({
	controlledPageOffset,
	controlledPageLimit,
	totalNumberOfItems,
	setControlledPageOffset,
	setControlledPageLimit,
}: PaginationProps) {
	const localPageOffset = generalContextStore.use.pageOffset();
	const localPageLimit = generalContextStore.use.pageLimit();

	const setPageOffset =
		setControlledPageOffset ??
		((pageOffset: PageOffset) => generalContextStore.setState({ pageOffset }));
	const setPageLimit =
		setControlledPageLimit ??
		((pageLimit: PageLimit) => generalContextStore.setState({ pageLimit }));
	const pageOffset = controlledPageOffset ?? localPageOffset;
	const pageLimit = controlledPageLimit ?? localPageLimit;

	const currentPage = Math.floor(pageOffset / pageLimit);
	const actualCurrentPage = currentPage + 1;

	const { start, end, totalNumberOfPages } = useMemo(() => {
		const totalNumberOfPages = Math.ceil(totalNumberOfItems / pageLimit);

		let start = currentPage * pageLimit + 1;

		let end = 0;
		end = currentPage * pageLimit + pageLimit;
		end = end > totalNumberOfItems ? totalNumberOfItems : end;

		if (end === 0) {
			start = 0;
		}

		return { start, end, totalNumberOfPages };
	}, [currentPage, pageLimit, totalNumberOfItems]);

	const isNewPageValid = (page: number) => {
		return (
			Number.isFinite(page) &&
			page >= 1 &&
			page <= totalNumberOfPages &&
			page !== 0
		);
	};

	const isNewPageLimitValid = (limit: number) => {
		return isValidNumber(limit) && limit > 0 && limit <= 2_000;
	};

	const handleGoToPage = (page: number) => {
		const nextOffset = (page * pageLimit) as PageOffset;

		startTransition(async () => {
			setPageOffset(
				nextOffset === (pageLimit as unknown as PageOffset)
					? (0 as PageOffset)
					: ((nextOffset - pageLimit) as PageOffset),
			);
		});
	};

	const handleGoToPreviousPage = () => {
		startTransition(async () => {
			await setPageOffset((pageOffset - pageLimit) as PageOffset);
		});
	};

	const handleGoToNextPage = () => {
		startTransition(async () => {
			await setPageOffset((pageOffset + pageLimit) as PageOffset);
		});
	};

	const handleCurrentPageInputEnterPressed = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Enter") {
			const input = e.target as HTMLInputElement;

			const { valueAsNumber } = input;

			if (isNewPageValid(valueAsNumber)) {
				handleGoToPage(valueAsNumber);
			} else {
				input.value = `${actualCurrentPage}`;
			}
		}
	};

	const handleCurrentPageInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { valueAsNumber } = e.target;

		if (isNewPageValid(valueAsNumber)) {
			handleGoToPage(valueAsNumber);
		} else {
			e.target.value = `${actualCurrentPage}`;
		}
	};

	const handleCurrentPageLimitInputEnterPressed = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Enter") {
			const input = e.target as HTMLInputElement;

			const { valueAsNumber } = input;

			if (isNewPageLimitValid(valueAsNumber)) {
				startTransition(async () => {
					setPageLimit(valueAsNumber as PageLimit);
				});
			} else {
				input.value = `${actualCurrentPage}`;
			}
		}
	};

	const handleCurrentPageLimitInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { valueAsNumber } = e.target;

		if (isNewPageLimitValid(valueAsNumber)) {
			startTransition(async () => {
				setPageLimit(valueAsNumber as PageLimit);
			});
		} else {
			e.target.value = `${pageLimit}`;
		}
	};

	return (
		<nav
			className="flex w-full items-center justify-between px-4 **:transition-none"
			aria-label="Projects table pagination"
		>
			<span className="text-sm tabular-nums text-muted">
				Showing{" "}
				<span className="font-semibold">
					{start}-{end}
				</span>{" "}
				of <span className="font-semibold">{totalNumberOfItems}</span>
			</span>

			<section className="flex gap-6 items-center">
				<div className="inline-flex h-8 gap-4 text-sm font-bold leading-8">
					<input
						className="aspect-square rounded-md border border-border-smooth  text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						onKeyUp={handleCurrentPageLimitInputEnterPressed}
						onBlur={handleCurrentPageLimitInputChange}
						defaultValue={pageLimit}
						key={pageLimit}
						type="number"
						max={2_000}
						min={1}
					/>

					<span>items per page</span>
				</div>

				<div className="inline-flex h-8 gap-4 text-sm font-bold leading-8">
					<button
						className="flex h-8 items-center justify-center rounded-lg border-2 border-slate-400/80 px-3 leading-tight text-primary button-hover disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={actualCurrentPage === 1}
						onClick={handleGoToPreviousPage}
					>
						Previous
					</button>

					<input
						className="aspect-square rounded-md border border-border-smooth  text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						onKeyUp={handleCurrentPageInputEnterPressed}
						onBlur={handleCurrentPageInputChange}
						defaultValue={actualCurrentPage}
						max={totalNumberOfPages}
						key={actualCurrentPage}
						aria-current="page"
						type="number"
						min={1}
					/>

					<span>/ {totalNumberOfPages}</span>

					<button
						className="flex h-8 items-center justify-center rounded-lg border-2 border-slate-400/80 px-3 leading-tight text-primary button-hover disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={
							actualCurrentPage === totalNumberOfPages ||
							totalNumberOfPages === 0
						}
						onClick={handleGoToNextPage}
					>
						Next
					</button>
				</div>
			</section>
		</nav>
	);
});
