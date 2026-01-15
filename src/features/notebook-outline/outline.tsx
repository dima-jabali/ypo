import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { isObjectEmpty } from "#/helpers/utils";
import { useNotebookBlocks } from "#/hooks/fetch/use-fetch-notebook";
import { BlockType, type NotebookBlock } from "#/types/notebook";
import { Block } from "#/features/notebook-outline/block";

enum Filter {
	All = "All",
	// Text = 'Text',
	// PDF = 'PDF',
	SQL = "SQL",
	Csv = "CSV",
	// Chart = "Chart",
	Python = "Python",
	SimilarQueries = "Similar Queries",
}

const FILTERS = Object.values(Filter);

export function Outline() {
	const [filter, setFilter] = useState(Filter.All);
	const [isOpen, setIsOpen] = useState(false);

	const filteredBlocksParentRef = useRef<HTMLDivElement>(null);

	const allBlocks = useNotebookBlocks();

	const filteredBlocks = useMemo(() => {
		const filteredBlocks: Record<Filter, React.ReactNode[]> = {
			[Filter.SimilarQueries]: [],
			// [Filter.Text]: [],
			// [Filter.PDF]: [],
			[Filter.Python]: [],
			// [Filter.Chart]: [],
			[Filter.Csv]: [],
			[Filter.SQL]: [],
			[Filter.All]: [],
		};

		if (isObjectEmpty(allBlocks)) return filteredBlocks;

		function onBlockOfSimilarQueryClick(block: NotebookBlock) {
			const projectBlock = allBlocks.find(({ uuid }) => uuid === block.uuid);

			if (projectBlock && projectBlock.similar_queries.length > 0) {
				generalContextStore.setState({
					similarQueriesToShow: {
						similarQueries: projectBlock.similar_queries,
						block,
					},
				});
			}
		}

		for (const uuid in allBlocks) {
			const projectBlock = allBlocks[uuid];

			if (!projectBlock) continue;

			const hasSimilarQueries = projectBlock.similar_queries.length > 0;

			const block = (
				<DefaultSuspenseAndErrorBoundary
					failedText="Failed to load block on outline"
					fallbackFor="outline-block"
					key={uuid}
				>
					<Block
						showSimilarQueries={onBlockOfSimilarQueryClick}
						projectBlock={projectBlock}
					/>
				</DefaultSuspenseAndErrorBoundary>
			);

			if (hasSimilarQueries) {
				filteredBlocks[Filter.SimilarQueries].push(block);
			}

			switch (projectBlock.type) {
				case BlockType.Sql:
				case "sql" as BlockType: // Workaround for legacy projects
					filteredBlocks[Filter.SQL].push(block);
					filteredBlocks[Filter.All].push(block);
					break;

				case BlockType.Python:
					filteredBlocks[Filter.Python].push(block);
					filteredBlocks[Filter.All].push(block);
					break;

				case BlockType.Csv:
					filteredBlocks[Filter.Csv].push(block);
					filteredBlocks[Filter.All].push(block);
					break;

				case "text" as BlockType:
				case BlockType.Text:
				case BlockType.Pdf:
					// sortedBlocks[Filter.Text].push(block as TextBlock);
					// sortedBlocks[Filter.All].push(block);
					break;

				// case BlockType.Chart:
				// 	filteredBlocks[Filter.Chart].push(block);
				// 	filteredBlocks[Filter.All].push(block);
				// 	break;

				default:
					console.log("Unknown block type to sort!", { projectBlock });
					break;
			}
		}

		return filteredBlocks;
	}, [allBlocks]);

	return (
		<>
			<Popover onOpenChange={setIsOpen} open={isOpen}>
				<PopoverTrigger className="flex items-center justify-between gap-2 rounded-sm bg-primary/5 button-hover p-2 text-xs font-bold tracking-wider data-[state=open]:bg-button-active mb-1 w-fit ml-auto">
					{filter}

					<ChevronDownIcon className="size-3 stroke-primary" />
				</PopoverTrigger>

				<PopoverContent
					className="flex flex-col w-[unset] z-500"
					side="bottom"
					align="end"
				>
					{FILTERS.map((filterString) => {
						const isActive = filter === filterString;

						return (
							<button
								className="button-hover py-1 px-2 rounded text-sm flex w-full items-center justify-between"
								onClick={() => setFilter(filterString)}
								data-default-checked={isActive}
								key={filterString}
							>
								{filterString}

								{isActive ? <CheckIcon className="size-4" /> : null}
							</button>
						);
					})}
				</PopoverContent>
			</Popover>

			<div
				className="simple-scrollbar scrollbar-stable"
				ref={filteredBlocksParentRef}
			>
				<div className="flex flex-col gap-2">{filteredBlocks[filter]}</div>
			</div>
		</>
	);
}
