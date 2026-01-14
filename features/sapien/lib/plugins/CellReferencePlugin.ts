import { createPlatePlugin } from "platejs/react";
import type { Descendant } from "platejs";

import { CellReferenceSpan } from "../../components/slate/CellReferenceSpan";

export const CELL_REFERENCE = "cell-reference";

export type MyCellReferenceSpan = {
	type: typeof CELL_REFERENCE;
	children: Array<Descendant>;
	uuid: string;
};

export const CellReferencePlugin = createPlatePlugin({
	key: CELL_REFERENCE,
	node: {
		component: CellReferenceSpan,
		type: CELL_REFERENCE,
		isMarkableVoid: true,
		isElement: true,
		isInline: true,
		isVoid: true,
	},
});
