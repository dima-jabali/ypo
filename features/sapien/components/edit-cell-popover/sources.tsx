import { useState } from "react";

import {
	BatchTableSourceType,
	type BatchTableSource,
} from "#/types/batch-table";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { matchIcon } from "#/icons/match-icon";
import {
	matchGeneralFileTypeToMimeType,
	MimeType,
} from "#/hooks/fetch/use-fetch-file-by-id";

export function Sources({ sources }: { sources: Array<BatchTableSource> }) {
	return (
		<div className="flex flex-col gap-2 p-2 text-left mt-2 bg-notebook border-t border-border-smooth text-primary">
			<h4 className="font-bold text-sm">
				Sources{" "}
				<span className="font-thin tabular-nums text-sm text-primary">
					({sources.length})
				</span>
			</h4>

			<ul className="flex flex-wrap gap-2">
				{sources.map((source, index) => {
					const key = `${source.type}-${source.identifier}-${index}`;

					switch (source.type) {
						case BatchTableSourceType.InternalContext: {
							return (
								<DocumentSourcePreview
									source={source}
									index={index}
									key={key}
								/>
							);
						}

						case BatchTableSourceType.Website: {
							return (
								<li
									className="list-none flex gap-2 items-center border-border-smooth border rounded-2xl text-xs px-2 py-0.5 button-hover select-none max-w-40"
									key={key}
								>
									{matchIcon(
										BatchTableSourceType.Website,
										"size-3.5 text-primary",
									)}

									<a
										className="text-link visited:text-link-visited truncate"
										rel="noopener noreferrer"
										title={source.identifier}
										href={source.identifier}
										target="_blank"
									>
										{source.identifier}
									</a>
								</li>
							);
						}

						case BatchTableSourceType.Column: {
							return (
								<li
									className="list-none flex gap-2 items-center border-border-smooth border rounded-2xl text-xs px-2 py-0.5 button-hover select-none"
									key={key}
								>
									<span>Column</span>
								</li>
							);
						}

						default:
							return null;
					}
				})}
			</ul>
		</div>
	);
}

function DocumentSourcePreview({
	source,
	index,
}: {
	source: BatchTableSource;
	index: number;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const split = source.identifier.split(":");
	const fileStringId = split[4];
	const type = (() => {
		try {
			const type = matchGeneralFileTypeToMimeType(
				fileStringId?.split("_")[0]?.toUpperCase() ?? "",
			);

			return type;
		} catch (error) {
			console.log(error);

			return "";
		}
	})();
	const name = type === MimeType.General ? "General file" : type;

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger asChild>
				<button
					className="list-none flex gap-2 items-center border-border-smooth  border rounded-2xl text-xs px-2 py-0.5 button-hover select-none"
					key={`${source.identifier}-${index}`}
				>
					{matchIcon(type, "size-3.5")}

					<span>{name}</span>
				</button>
			</PopoverTrigger>

			{isOpen && type ? (
				<PopoverContent className="flex flex-col gap-2 p-2 max-h-[50vh] max-w-[50vw] rounded-lg">
					{/* <DownloadAndShowFilePreview
						fileStringId={fileStringId}
						fileId={NaN as FileId}
						fileType={type}
					/> */}
				</PopoverContent>
			) : null}
		</Popover>
	);
}
