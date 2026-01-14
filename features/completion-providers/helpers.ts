import { isLeftMultipleOfRight } from "#/helpers/utils";

const SORTED_LOWERCASE_ALPHABET = [
	"a",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"q",
	"r",
	"s",
	"t",
	"u",
	"v",
	"w",
	"x",
	"y",
	"z",
] as const;

const SORTED_LOWERCASE_ALPHABET_LENGHT = SORTED_LOWERCASE_ALPHABET.length;

export const makeSortTextStringsAndInserThem = <
	T extends { sortText?: string },
>(
	arrayToChange: T[],
) => {
	// Make sure Monaco will keep the same order as `uniqueSuggestions`:

	/**
	 * I'm going to use the following way to create strings that will be
	 * sorted by Monaco because we can't provide a sorting function to it.
	 *
	 * We can achieve that by manipulating the string that Monaco will use
	 * to sort: the `sortText`.
	 *
	 * The algorithm that will behave like this:
	 *
	 *      -   1°: 'a'; which is smaller than
	 *      -   2°: 'b'; which is smaller than
	 *      -   3°: 'c'; which is smaller than
	 *               ︙
	 *      -  24°: 'y'; which is smaller than
	 *      -  25°: 'z'; which is smaller than
	 *      -  26°: 'za'; which is smaller than
	 *      -  27°: 'zb'; which is smaller than
	 *               ︙
	 *      -  50°: 'zy'; which is smaller than
	 *      -  51°: 'zz'; which is smaller than
	 *      -  52°: 'zza'; which is smaller than
	 *      -  53°: 'zzb'; which is smaller than
	 *                ︙
	 */

	const numberOfUniqueStrings = arrayToChange.length;

	const sortText = ["a"];
	let charOnAlphabet = 0;
	let position = 0;

	for (
		let uniqueStringIndex = 0;
		uniqueStringIndex < numberOfUniqueStrings;
		++uniqueStringIndex
	) {
		sortText[position] = SORTED_LOWERCASE_ALPHABET[charOnAlphabet]!;

		arrayToChange[uniqueStringIndex]!.sortText = sortText.join("");
		++charOnAlphabet;

		if (
			uniqueStringIndex !== 0 &&
			isLeftMultipleOfRight(
				uniqueStringIndex + 1,
				SORTED_LOWERCASE_ALPHABET_LENGHT,
			)
		) {
			charOnAlphabet = 0;
			++position;
		}
	}
};
