import type { Node, Value } from "platejs";

import type { BatchTableColumn } from "#/types/batch-table";
import { createUUID, isValidNumber } from "#/helpers/utils";
import {
	CELL_REFERENCE,
	type MyCellReferenceSpan,
} from "../../lib/plugins/CellReferencePlugin";

export const MENTION_REGEX =
	/BB_COLUMN_MENTION:column_id=\d+:BB_COLUMN_MENTION/g;
const POSSIBLE_CELL_REFERENCE_REGEX = /([A-Z]+)(\d+)(:[A-Z]+\d+)?/gi;

export const toColumnMention = (columnId: string | number) =>
	`BB_COLUMN_MENTION:column_id=${columnId}:BB_COLUMN_MENTION`;

export function convertStringToPlateValue(
	string: string,
	extraProps: {
		mentionables: Array<BatchTableColumn>;
		chosenFormula?: string;
	},
) {
	const plateValueToReturn: Value = [
		{ type: "p", children: [{ text: string }] },
	];

	// Handle mentions to other columns:
	handleMentions: {
		MENTION_REGEX.lastIndex = 0;
		const mentionMatches = string.match(MENTION_REGEX);

		if (!mentionMatches) {
			break handleMentions;
		}

		const strings = string.split(MENTION_REGEX);

		let childrenIndex = 0;
		let index = 0;
		for (const string of strings) {
			const match = mentionMatches[index];

			if (match) {
				plateValueToReturn[0]!.children[childrenIndex] = { text: string };

				const id = Number(match.match(/\d+/)?.[0] || undefined);

				if (isValidNumber(id) && extraProps.mentionables) {
					const column = extraProps.mentionables.find((col) => col.id === id);

					if (column) {
						plateValueToReturn[0]!.children[++childrenIndex] = {
							children: [{ text: toColumnMention(id) }],
							value: `${column.name ?? ""} (id: ${id})`,
							type: "mention",
						};
					}
				}
			} else {
				plateValueToReturn[0]!.children[childrenIndex] = { text: string };
			}

			++childrenIndex;
			++index;
		}
	}

	handleCellReferences: if (string[0] === "=") {
		// Handle when `string` is something like "=A3":

		POSSIBLE_CELL_REFERENCE_REGEX.lastIndex = 0;

		const possibleReferences = string.matchAll(POSSIBLE_CELL_REFERENCE_REGEX);

		if (!possibleReferences) break handleCellReferences;

		const children: Array<Node> = [];

		let lastIndex = 0;
		for (const possibleReference of possibleReferences) {
			const stringBefore = string.slice(lastIndex, possibleReference.index);
			const match = possibleReference[0];

			const isReference = getIsReferenceToRangeOfCells(match);

			if (isReference) {
				const cellReference: MyCellReferenceSpan = {
					children: [{ text: match }],
					type: CELL_REFERENCE,
					uuid: createUUID(),
				};

				children.push({ text: stringBefore });
				children.push(cellReference);
			} else {
				children.push({ text: `${stringBefore}${match}` });
			}

			lastIndex = possibleReference.index + match.length;
		}

		if (lastIndex < string.length) {
			const stringAfter = string.slice(lastIndex);

			children.push({ text: stringAfter });
		}

		plateValueToReturn[0]!.children = children as Value;
	}

	return plateValueToReturn;
}

function getIsReferenceToRangeOfCells(match: string) {
	console.log({ match });

	return true;

	// const { range } = deserializeRangeWithSheet(string);

	// return (
	// 	isValidNumber(range.startColumn) &&
	// 	isValidNumber(range.endColumn) &&
	// 	isValidNumber(range.startRow) &&
	// 	isValidNumber(range.endRow)
	// );
}
