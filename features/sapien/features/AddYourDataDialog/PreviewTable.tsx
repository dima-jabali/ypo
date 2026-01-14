import { memo } from "react";

type Props = {
	parsedCSVAsColumns: Record<string, string | number>[];
	columnsToAdd: Record<string, string | number>[];
};

export const PreviewTable: React.FC<Props> = memo(function PreviewTable({
	parsedCSVAsColumns,
	columnsToAdd,
}) {
	const rowsPreview = parsedCSVAsColumns.slice(0, 10);

	return (
		<div className="max-h-[50vh]">
			<table className="tabular-nums whitespace-nowrap border-2 border-[rgb(83,83,83)] border-collapse">
				<thead>
					<tr className="border-2 border-[rgb(83,83,83)] bg-gray-800">
						{columnsToAdd.map((column) => (
							<th
								className="border-2 border-[rgb(83,83,83)] px-3 py-1"
								// eslint-disable-next-line react-hooks/purity
								key={Math.random()}
							>
								{column.name}
							</th>
						))}
					</tr>
				</thead>

				<tbody>
					{rowsPreview.map((row) => {
						return (
							<tr
								className="border-2 border-[rgb(83,83,83)] even:bg-slate-300/20 odd:bg-slate-300/5"
								// eslint-disable-next-line react-hooks/purity
								key={Math.random()}
							>
								{Object.entries(row).map(([column, cell]) => {
									const shouldShowColumn = columnsToAdd.some(
										({ name }) => name === column,
									);

									return shouldShowColumn ? (
										<td
											className="border-2 border-[rgb(83,83,83)] px-3 py-1"
											key={Math.random()}
										>
											{cell}
										</td>
									) : null;
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
});
