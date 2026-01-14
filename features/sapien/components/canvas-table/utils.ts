import type { GridSelection, SpriteMap } from "@glideapps/glide-data-grid";

import {
	BatchTableMetadataColumnType,
	type BatchTableColumnIndex,
	type BatchTableRowIndex,
} from "#/types/batch-table";

export const DEFAULT_EXCEL_COLUMNS_NUMBER = 26;
export const DEFAULT_EXCEL_ROWS_NUMBER = 150;
export const DEFAULT_CELL_WIDTH = 150;
export const DEFAULT_ROW_HEIGHT = 40;

export const HEADER_ICONS: SpriteMap = {
	[BatchTableMetadataColumnType.FILE]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,

	[BatchTableMetadataColumnType.BOOLEAN]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="12" r="3"/><rect width="20" height="14" x="2" y="5" rx="7"/></svg>`,

	[BatchTableMetadataColumnType.JSON]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>`,

	[BatchTableMetadataColumnType.LONG_TEXT]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu-icon lucide-menu"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>`,

	[BatchTableMetadataColumnType.NUMBER]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>`,

	[BatchTableMetadataColumnType.SINGLE_LINE_TEXT]: (spriteProps) =>
		`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${spriteProps.bgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>`,
};

export function calcSelectedCells(gridSelection: GridSelection | undefined) {
	if (!gridSelection?.current) {
		// gridSelection.columns
		// TODO: handle columns and rows

		return [];
	}

	const range = gridSelection.current.range;
	const endX = (range.x + range.width) as BatchTableColumnIndex;
	const endY = (range.y + range.height) as BatchTableRowIndex;
	const startX = range.x as BatchTableColumnIndex;
	const startY = range.y as BatchTableRowIndex;

	const arr: Array<{
		column_index: BatchTableColumnIndex;
		row_index: BatchTableRowIndex;
	}> = [];

	for (let col = startX; col < endX; ++col) {
		// The outer loop handles the x-coordinates (columns)
		for (let row = startY; row < endY; ++row) {
			// The inner loop handles the y-coordinates (rows)

			arr.push({ column_index: col, row_index: row });
		}
	}

	return arr;
}
