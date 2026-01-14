/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Row, Table } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import { type PropsWithChildren, type Ref, memo } from "react";

type Props = {
	ref: Ref<HTMLTableRowElement>;
	virtualRow: VirtualItem;
	table: Table<any>;
	row: Row<any>;
	item: any;
};

const memoCellCompareFunction = (prev: Props, next: Props) => {
	return (
		prev.virtualRow.index === next.virtualRow.index &&
		prev.virtualRow.start === next.virtualRow.start &&
		prev.row.id === next.row.id
	);
};

export const BodyTableRow = memo(function BodyTableRow({
	virtualRow,
	children,
	row,
	...props
}: PropsWithChildren<Props>) {
	const { index, start } = virtualRow;
	const isEven = index % 2 === 0;

	return (
		<tr
			className="group absolute w-full border-b border-b-border-smooth bg-secondary data-[even=false]:bg-alt-row border-x-gray-500 flex min-h-[20px] text-xs"
			style={{ transform: `translateY(${start}px)` }}
			data-tr-id={row.id}
			data-even={isEven}
			data-index={index}
			{...props}
		>
			{children}
		</tr>
	);
}, memoCellCompareFunction);

BodyTableRow.displayName = "BodyTableRow";
