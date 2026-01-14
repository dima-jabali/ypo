import { type Value } from "platejs";
import { Node } from "slate";
import type { IconReplacements } from "json-edit-react";
import {
	Ban,
	Check,
	ChevronDown,
	Clipboard,
	Pencil,
	Plus,
	Trash,
} from "lucide-react";

import type { BatchTableCell } from "#/types/batch-table";
import { convertStringToPlateValue } from "../column-options-popover/convert-string-to-plate-value";
import { useMentionablesStore } from "../../contexts/mentionables/mentionables-context";
import { isValidNumber } from "#/helpers/utils";

const FORMULA_ON_STRING_REGEX = /^=(.*)\(/;

export function getFormulaOnString(str: string | undefined | null) {
	return str?.match(FORMULA_ON_STRING_REGEX);
}

function getInitialChosenFormula(batchTableCell: BatchTableCell | undefined) {
	const formulaOnInitialValue = getFormulaOnString(batchTableCell?.formula);
	const formula = formulaOnInitialValue?.[1];

	if (!formula) return "";

	return formula;
}

export function useGetInitialPlateValue(
	batchTableCell: BatchTableCell | undefined,
) {
	const mentionablesStore = useMentionablesStore();

	const mentionables = mentionablesStore.getState().mentionables;
	const string = `${batchTableCell?.formula ?? batchTableCell?.value ?? ""}`;

	return convertStringToPlateValue(string, {
		mentionables,
		chosenFormula: getInitialChosenFormula(batchTableCell),
	});
}

export function convertPlateValueToStringOrNumber(
	plateValue: Value | Array<Node>,
) {
	const valueAsString = plateValue.map(Node.string).join("");
	const valueAsNumber = Number(valueAsString || undefined); // `|| undefined` because if valueAsString is `""` then `Number("")` will be `0`.

	return isValidNumber(valueAsNumber) ? valueAsNumber : valueAsString;
}

export const JSON_ICONS: IconReplacements = {
	add: (
		<button className="rounded-full p-1 button-hover" title="Add">
			<Plus className="text-primary size-4" />
		</button>
	),
	edit: (
		<button className="rounded-full p-1 button-hover" title="Edit">
			<Pencil className="text-primary size-4" />
		</button>
	),
	delete: (
		<button className="rounded-full p-1 button-hover" title="Delete">
			<Trash className="text-primary size-4" />
		</button>
	),
	copy: (
		<button className="rounded-full p-1 button-hover" title="Copy to clipboard">
			<Clipboard className="text-primary size-4" />
		</button>
	),
	ok: (
		<button className="rounded-full p-1 button-hover" title="Ok">
			<Check className="text-primary size-4" />
		</button>
	),
	cancel: (
		<button className="rounded-full p-1 button-hover" title="Cancel">
			<Ban className="text-primary size-4" />
		</button>
	),
	chevron: (
		<button className="rounded-full button-hover" title="Toggle collapse">
			<ChevronDown className="text-primary size-4" />
		</button>
	),
};
