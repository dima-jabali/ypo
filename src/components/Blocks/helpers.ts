const ALPHABET_AND_NUMBERS_AND_UNDERSCORE_REGEX = /^\w$/;
const SPACE_REGEX = / /g;

export function handleChangeWriteVariableName({
	nextWriteVariableName,
	prevWriteVariableName,
	newName,
	setNextWriteVariableName,
	setPrevWriteVariableName,
}: {
	nextWriteVariableName: string;
	prevWriteVariableName: string;
	newName: string;
	setPrevWriteVariableName: (value: React.SetStateAction<string>) => void;
	setNextWriteVariableName: (value: React.SetStateAction<string>) => void;
}) {
	const value = newName.replace(SPACE_REGEX, "_");
	const lastChar = value.at(-1);

	if (!prevWriteVariableName) {
		setPrevWriteVariableName(nextWriteVariableName);
	}

	if (
		ALPHABET_AND_NUMBERS_AND_UNDERSCORE_REGEX.test(lastChar!) ||
		lastChar === "ArrowRight" ||
		lastChar === "Backspace" ||
		lastChar === "ArrowLeft"
	) {
		setNextWriteVariableName(value);

		return value;
	}

	return null;
}
