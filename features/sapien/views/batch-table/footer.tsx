import { memo } from "react";

export const BatchTableFooter: React.FC = memo(function BatchTableFooter() {
	return (
		<footer className="flex w-full items-center justify-between [grid-area:footer]">
			<div className="flex gap-2 items-center pl-2"></div>

			<div className="flex gap-2 items-center"></div>
		</footer>
	);
});
