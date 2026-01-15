import { isObjectEmpty } from "#/helpers/utils";
import { HighlightStringWithFilterRegex } from "./highlight-string-with-filter-regex";

export const FileMetadataTable: React.FC<{
	metadata: Record<string, unknown>;
}> = ({ metadata }) => {
	if (!metadata || isObjectEmpty(metadata)) return null;

	return (
		<section className="flex flex-col max-w-full overflow-hidden gap-2">
			<span className="pl-2 my-1 font-bold text-primary">File metadata</span>

			<div className="tabular-nums simple-scrollbar [&_th]:px-2 [&_td]:px-2">
				<table>
					<tbody>
						{Object.entries(metadata).map(([key, value]) =>
							typeof value === "string" || typeof value === "number" ? (
								<tr className="even:bg-alt-row bg-muted/40" key={key}>
									<th>{key}</th>

									<td>
										<HighlightStringWithFilterRegex string={`${value}`} />
									</td>
								</tr>
							) : null,
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
};
