import {
	anyOf,
	createRegExp,
	exactly,
	global,
	maybe,
	whitespace,
} from "magic-regexp";

import { removeUrlHash } from "#/features/sources-for-user/utils";
import type { SourceID } from "#/contexts/source-citation-context";

// Test cases
// [**SOURCE:id:google_drive:google_drive::google_sheet_column_596243cd3e3042b3b1f1a82b6e6f3918**]
export const SOURCE_CITATIONS_REGEX =
	/\[(?:\s*|\**)(?:SOURCE:|WEBSITE:)(.*?)(?:\**)\]/g;

export const SOURCE_CITATION_LANG_REGEX = /^(\s*)source-citation/;
export const SOURCE_CITATION_LANG = "source-citation";
export const URL_TEXT_SEARCH = /#:~:text=(.*)/;
export const WEBSITE_PREFIX = "WEBSITE:";

const SPLIT_SOURCES_REGEX = createRegExp(
	maybe(whitespace)
		.and(maybe(anyOf(",", ";")))
		.and(maybe(whitespace))
		.and(exactly(anyOf("SOURCE:", "WEBSITE:", "SOURCE:WEBSITE:"))),

	[global],
);

export function preprocessSourceCitations(content: string) {
	SOURCE_CITATIONS_REGEX.lastIndex = 0;

	// Replace source citations with inline code blocks so we can parse them later
	const processedContent = content.replaceAll(
		SOURCE_CITATIONS_REGEX,
		(_, source: string) => {
			const split = source.split(SPLIT_SOURCES_REGEX).filter(Boolean);

			const result = split
				.map((source) => {
					const possibleUrlWithoutHash = removeUrlHash(source);

					return `\uFEFF\`${SOURCE_CITATION_LANG}${possibleUrlWithoutHash}\`\uFEFF`;
				})
				.join("");

			return result;
		},
	);

	return processedContent;
}

export function removeSourceCitations(content: string) {
	SOURCE_CITATIONS_REGEX.lastIndex = 0;

	return content.replaceAll(SOURCE_CITATIONS_REGEX, "");
}

export function getReferencedSources(content: string) {
	// Reset regex state for safety in case of 'g' flag
	SOURCE_CITATIONS_REGEX.lastIndex = 0;

	const ids: Array<SourceID> = [];

	// Use matchAll to iterate through all citation blocks
	const matches = content.matchAll(SOURCE_CITATIONS_REGEX);

	for (const match of matches) {
		// The source string is typically the first capture group (index 1)
		const sourceAttr = match[1];

		if (sourceAttr) {
			const split = sourceAttr.split(SPLIT_SOURCES_REGEX).filter(Boolean);

			for (const source of split) {
				const possibleUrlWithoutHash = removeUrlHash(source) as SourceID;

				ids.push(possibleUrlWithoutHash);
			}
		}
	}

	return ids;
}

const LATEX_MATH_REGEX = /\\\[(.*?)\\\]/gs;

export function normalizeLatexMath(source: string) {
	LATEX_MATH_REGEX.lastIndex = 0;

	return source.replace(
		LATEX_MATH_REGEX,
		(_, content) => `$$\n${content.trim()}\n$$`,
	);
}
