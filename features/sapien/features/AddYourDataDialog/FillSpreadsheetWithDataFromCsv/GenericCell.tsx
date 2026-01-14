import { memo } from "react";

import type { AnyCellContext } from "#/features/sapien/lib/table-utils";

export const GenericCell: React.FC<AnyCellContext> = memo(function GenericCell({
	renderValue,
}) {
	const value = `${renderValue()}`;

	return (
		<div
			className="items-center justify-start w-full p-4 flex h-full truncate"
			title={value}
		>
			<span className="truncate">{value}</span>
		</div>
	);
});
