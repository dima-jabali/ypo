import { useRef } from "react";

import type { BatchTable } from "#/types/batch-table";
import { BatchTableMetadataRow } from "./batch-table-metadata-row";
import {
	ProjectColumnToSortOn,
	useFetchBatchTableMetadatasPage,
} from "../../hooks/get/use-fetch-batch-table-metadatas-page";
import {
	FilterArchived,
	generalContextStore,
	type PageLimit,
} from "#/contexts/general-ctx/general-context";
import { isValidNumber, noop } from "#/helpers/utils";
import { ProjectsTableCell } from "../../components/projects-table-cell";
import { Loader } from "#/components/Loader";
import { SortButtonWrapper } from "../../components/sort-button-wrapper";
import { ProjectFilterPopover } from "../../components/project-filter-popover";
import { CreateBatchTableModal } from "../../components/create-batch-table-modal";

export function TableOfBatchTableMetadatas() {
	const fetchBatchTableMetadatasPageQuery = useFetchBatchTableMetadatasPage();
	const pageArchived = generalContextStore.use.pageArchived();
	const pageLimit = generalContextStore.use.pageLimit();

	const tableRef = useRef<HTMLTableElement>(null);

	const totalNumberOfProjects =
		fetchBatchTableMetadatasPageQuery.data.pages.at(-1)?.num_results ?? 0;
	const onlyShowArchivedProjects =
		pageArchived === FilterArchived.ONLY_ARCHIVED;
	const batchTableMetadatas =
		fetchBatchTableMetadatasPageQuery.data.pages.flatMap(
			(page) => page.results,
		);

	async function handleRowClick(
		e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
		batchTable: BatchTable,
	) {
		const table = tableRef.current;

		// If was not pressed with the left mouse (main) button, ignore it:
		if (!table || e.button !== 0) return;

		const target = e.target as HTMLElement;

		if (
			target.classList.contains("ignore-table-row-click") ||
			target.getElementsByClassName(".ignore-table-row-click").length > 0 ||
			target.querySelector(".ignore-table-row-click") ||
			target.closest(".ignore-table-row-click")
		) {
			return;
		}

		// If the clicked item is not a child of the table, ignore it
		// (needed to ignore clicks on modals):
		if (!table.contains(e.target as Node)) return;

		generalContextStore.setState({ batchTableId: batchTable.id });
	}

	function handleLoadMore() {
		fetchBatchTableMetadatasPageQuery.fetchNextPage().catch(noop);
	}

	function isNewPageLimitValid(limit: number) {
		return isValidNumber(limit) && limit > 0 && limit <= 2_000;
	}

	function handleCurrentPageLimitInputEnterPressed(
		e: React.KeyboardEvent<HTMLInputElement>,
	) {
		if (e.key === "Enter") {
			const input = e.target as HTMLInputElement;

			const { valueAsNumber } = input;

			if (isNewPageLimitValid(valueAsNumber)) {
				generalContextStore.setState({ pageLimit: valueAsNumber as PageLimit });
			} else {
				input.value = `${pageLimit}`;
			}
		}
	}

	function handleCurrentPageLimitInputChange(
		e: React.ChangeEvent<HTMLInputElement>,
	) {
		const { valueAsNumber } = e.target;

		if (isNewPageLimitValid(valueAsNumber)) {
			generalContextStore.setState({ pageLimit: valueAsNumber as PageLimit });
		} else {
			e.target.value = `${pageLimit}`;
		}
	}

	return (
		<div className="flex w-full h-full flex-col gap-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Sapien</h1>

				<div className="flex items-center gap-4">
					<ProjectFilterPopover />

					<CreateBatchTableModal />
				</div>
			</div>

			<div className="max-w-full rounded-lg border border-border-smooth overflow-hidden">
				<div className="h-full simple-scrollbar">
					<table
						className="h-1 w-full table-auto text-left text-sm"
						ref={tableRef}
					>
						<thead className="border-b border-border-smooth bg-transparent font-bold">
							<tr>
								<ProjectsTableCell data-is-header />

								<ProjectsTableCell data-is-header />

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper thisColumn={ProjectColumnToSortOn.Name}>
										Name
									</SortButtonWrapper>
								</ProjectsTableCell>

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper thisColumn={ProjectColumnToSortOn.Id}>
										ID
									</SortButtonWrapper>
								</ProjectsTableCell>

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper
										thisColumn={ProjectColumnToSortOn.CreatedBy}
									>
										Created by
									</SortButtonWrapper>
								</ProjectsTableCell>

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper
										thisColumn={ProjectColumnToSortOn.CreatedAt}
									>
										Created at
									</SortButtonWrapper>
								</ProjectsTableCell>

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper
										thisColumn={ProjectColumnToSortOn.LastModifiedBy}
									>
										Last Modified by
									</SortButtonWrapper>
								</ProjectsTableCell>

								<ProjectsTableCell data-is-header>
									<SortButtonWrapper
										thisColumn={ProjectColumnToSortOn.LastModifiedAt}
									>
										Last Modified at
									</SortButtonWrapper>
								</ProjectsTableCell>
							</tr>
						</thead>

						<tbody className="simple-scrollbar">
							{batchTableMetadatas.map((batchTable) => (
								<tr
									className="h-1 cursor-pointer transition-none odd:bg-slate-700/20 hover:bg-button-hover"
									onClick={(e) => handleRowClick(e, batchTable)}
									key={batchTable.id}
								>
									<BatchTableMetadataRow batchTable={batchTable} />
								</tr>
							))}
						</tbody>

						<tfoot>
							<tr>
								<td colSpan={8}>
									{batchTableMetadatas.length > 0 ? (
										<div
											className="flex w-full items-center justify-between p-4 border-t border-border-smooth **:transition-none"
											aria-label="Projects table pagination"
										>
											<span className="text-sm tabular-nums text-muted">
												Showing{" "}
												<span className="font-semibold">
													1-{batchTableMetadatas.length}
												</span>{" "}
												of{" "}
												<span className="font-semibold">
													{totalNumberOfProjects}
												</span>
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

													<span>items per load</span>
												</div>

												<div className="inline-flex h-8 gap-4 text-sm font-bold leading-8">
													<button
														className="flex h-8 items-center justify-center rounded-lg border-2 gap-3 border-slate-400/80 px-3 leading-tight text-primary button-hover disabled:opacity-50 disabled:cursor-not-allowed"
														disabled={
															batchTableMetadatas.length ===
																totalNumberOfProjects ||
															totalNumberOfProjects === 0
														}
														onClick={handleLoadMore}
													>
														{fetchBatchTableMetadatasPageQuery.isFetchingNextPage ? (
															<Loader className="border-t-primary" />
														) : null}

														<span>
															Load
															{fetchBatchTableMetadatasPageQuery.isFetchingNextPage
																? "ing"
																: ""}{" "}
															more
															{fetchBatchTableMetadatasPageQuery.isFetchingNextPage
																? "..."
																: ""}
														</span>
													</button>
												</div>
											</section>
										</div>
									) : onlyShowArchivedProjects ? (
										<p className="p-4 text-center text-base">
											You have no archived projects yet.
										</p>
									) : (
										<div className="p-4 text-center text-base">
											No projects found.
										</div>
									)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	);
}
