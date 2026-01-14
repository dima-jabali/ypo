import type { Value } from "platejs";
import { Plate, PlateContent, type PlateEditor } from "platejs/react";
import { Node } from "slate";

import { KeepFocusOnPlateEditor } from "./KeepFocusOnPlateEditor";
import { useMentionInputEditor } from "./useMentionInputEditor";
import { cn } from "#/helpers/class-names";
import { isValidNumber } from "#/helpers/utils";

const convertPlateValueToStringOrNumber = (plateValue: Value | Array<Node>) => {
	const valueAsString = plateValue.map(Node.string).join("");
	const valueAsNumber = Number(valueAsString || undefined); // `|| undefined` because if valueAsString is `""` then `Number("")` will be `0`.

	return isValidNumber(valueAsNumber) ? valueAsNumber : valueAsString;
};

export const MentionInput: React.FC<{
	plateInitialValue: Value;
	autoFocus?: boolean;
	className?: string;
	title?: string;
	id: string;
	onKeyDown?: React.KeyboardEventHandler<HTMLDivElement> | undefined;
	onValueChange: (plateValueAsText: string) => void;
}> = ({
	plateInitialValue,
	autoFocus = true,
	className,
	title,
	id,
	onValueChange,
	onKeyDown,
}) => {
	const editor = useMentionInputEditor(plateInitialValue, id);

	function handleOnPlateValueChange(options: {
		editor: PlateEditor;
		value: Value;
	}) {
		const plateValueAsTextOrNumber = convertPlateValueToStringOrNumber(
			options.value,
		);

		onValueChange(`${plateValueAsTextOrNumber}`);
	}

	return (
		<Plate onValueChange={handleOnPlateValueChange} editor={editor} key={id}>
			<PlateContent
				className={cn(
					"w-full h-full relative min-h-[1lh] select-text bg-transparent textarea caret-primary",
					className,
				)}
				onKeyDown={onKeyDown}
				spellCheck={false}
				title={title}
			/>

			{autoFocus ? <KeepFocusOnPlateEditor /> : null}
		</Plate>
	);
};
