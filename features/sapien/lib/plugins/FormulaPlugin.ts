import { createPlatePlugin } from "platejs/react";
import type { Descendant } from "platejs";

import { FormulaSpan } from "../../components/slate/FormulaSpan";

export const FORMULA_ELEMENT = "formula";

export type MyFormulaSpan = {
	type: typeof FORMULA_ELEMENT;
	children: Array<Descendant>;
	uuid: string;
};

export const FormulaPlugin = createPlatePlugin({
	key: FORMULA_ELEMENT,
	node: {
		component: FormulaSpan,
		type: FORMULA_ELEMENT,
		isMarkableVoid: true,
		isElement: true,
		isInline: true,
		isVoid: true,
	},
});
