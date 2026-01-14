import {
	startTransition,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import type { DataToAddToColumn } from "./common";
import { BatchTableMetadataColumnType } from "#/types/batch-table";
import { useForceRender } from "#/hooks/use-force-render";
import { isValidNumber } from "#/helpers/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "#/components/select";
import { matchType } from "../../components/column-options-popover/utils";
import { Input } from "#/components/Input";

type Props = {
	dataRef: React.RefObject<DataToAddToColumn>;
};

type InputValidator = (
	input: string,
) =>
	| [input: string, transformed: string | number | boolean, isValid: boolean]
	| null;

// const BOOLEAN_REGEX = /true|false|0|1/gi;

function validateInput(
	typeOfDataToAdd: BatchTableMetadataColumnType | null | undefined,
): InputValidator {
	switch (typeOfDataToAdd) {
		case BatchTableMetadataColumnType.LONG_TEXT:
			return (input: string) => {
				const trimmed = input.trim();

				return [input, trimmed, Boolean(trimmed)];
			};

		// 		case BatchTableMetadataColumnType.NUMBER:
		// 			return (input: string) => {
		// 				BOOLEAN_REGEX.lastIndex = 0;
		//
		// 				const trimmed = input.trim();
		// 				const isValid = BOOLEAN_REGEX.test(trimmed);
		//
		// 				return [input, isValid, isValid];
		// 			};

		case BatchTableMetadataColumnType.NUMBER:
			return (input: string) => {
				const trimmesAndAsNumber = Number(input.trim());

				return [input, trimmesAndAsNumber, isValidNumber(trimmesAndAsNumber)];
			};

		default: {
			return () => null;
		}
	}
}

export function BulkAddView({ dataRef }: Props) {
	const [inputString, setInputString] = useState("");
	const [separator, setSeparator] = useState(",");

	const olRef = useRef<HTMLOListElement>(null);

	const forceRender = useForceRender();

	const typeOfDataToAdd = dataRef.current.columnToAddDataTo?.column_type;

	const handleChangeDataRef = useCallback(
		(
			dataRef: React.RefObject<DataToAddToColumn>,
			typeOfDataToAdd: BatchTableMetadataColumnType | null | undefined,
		) => {
			if (
				!dataRef.current ||
				!dataRef.current.columnToAddDataTo ||
				!olRef.current
			)
				return;

			const inputs = olRef.current.querySelectorAll("input");
			const dataToAdd: Array<string> = [];

			for (const input of inputs) {
				if (!input.checked) continue;

				const value = input.getAttribute("data-value");

				if (!value) continue;

				dataToAdd.push(value);
			}

			if (dataToAdd.length === 0) {
				dataRef.current.bulkAdd = undefined;

				return;
			}

			dataRef.current.bulkAdd = dataToAdd;

			if (typeOfDataToAdd) {
				dataRef.current.columnToAddDataTo.column_type = typeOfDataToAdd;
			}
		},
		[],
	);

	const values = new Set(
		inputString
			.split(separator)
			.filter(Boolean)
			.map(validateInput(typeOfDataToAdd)),
	);
	const isInputEmpty = values.size === 0;

	const listItems: Array<React.ReactNode> = [];

	let index = 0;
	for (const value of values) {
		if (!value) continue;

		listItems.push(
			// eslint-disable-next-line react-hooks/purity
			<li key={Math.random()}>
				<label
					className="flex gap-4 px-4 py-2 items-center"
					title="(Un)Select data to add"
				>
					<input
						onChange={() => handleChangeDataRef(dataRef, typeOfDataToAdd)}
						defaultChecked={value[2]}
						data-value={value[1]}
						name={`${index}`}
						type="checkbox"
					/>

					<div className="flex items-center gap-4">
						<span title="Input string">{value[0]}</span>

						<span
							className="text-xs text-blue-400"
							title="Data that will be added"
						>{`${value[1]}`}</span>

						<span
							className="data-[is-valid=false]:block bg-destructive px-1 py-0.5 rounded-md hidden text-xs font-semibold"
							title="This data can not be used to add data"
							data-is-valid={value[2]}
						>
							Invalid data
						</span>
					</div>
				</label>
			</li>,
		);

		++index;
	}

	function handleChangeTypeOfDataToAdd(newValue: BatchTableMetadataColumnType) {
		if (!dataRef.current.columnToAddDataTo) return;

		dataRef.current.columnToAddDataTo.column_type = newValue;

		forceRender();
	}

	useEffect(() => {
		handleChangeDataRef(dataRef, typeOfDataToAdd);
	}, [dataRef, handleChangeDataRef, inputString, typeOfDataToAdd]);

	return (
		<section className="w-full flex flex-col gap-4 pl-3 pt-4 h-full">
			<h3 className="font-bold">
				Add several entities of the same type at once to the Entity Column
			</h3>

			<Select onValueChange={handleChangeTypeOfDataToAdd}>
				<fieldset className="flex items-center gap-2">
					<label
						className="text-sm text-muted-foreground"
						htmlFor="type-of-data-to-add"
					>
						Select type of data:
					</label>

					<SelectTrigger id="type-of-data-to-add" className="w-[200px]">
						{matchType(typeOfDataToAdd)}
					</SelectTrigger>
				</fieldset>

				<SelectContent>
					<SelectItem value={BatchTableMetadataColumnType.LONG_TEXT}>
						Long text
					</SelectItem>

					<SelectItem value={BatchTableMetadataColumnType.NUMBER}>
						Number
					</SelectItem>

					{/* <SelectItem value={TypeOfDataToAdd.Boolean}>
						{TypeOfDataToAdd.Boolean}
					</SelectItem> */}
				</SelectContent>
			</Select>

			<fieldset className="flex gap-2 items-center">
				<label
					className="text-sm text-muted-foreground"
					htmlFor="bulk-add-separator"
				>
					Choose separator:
				</label>

				<Input
					onChange={(e) => setSeparator(e.target.value)}
					className="w-[50px] font-mono font-bold"
					id="bulk-add-separator"
					value={separator}
				/>
			</fieldset>

			<fieldset className="flex flex-col gap-1 pb-1">
				<label
					className="text-sm text-muted-foreground"
					htmlFor="bulk-add-input"
				>
					Type the name of the entities you want to add separated by{" "}
					<span className="bg-mention rounded-xs p-[3px] font-mono font-bold text-primary">
						{separator}
					</span>
					:
				</label>

				<Input
					onChange={(e) =>
						startTransition(() => setInputString(e.target.value))
					}
					name="bulk-add-input"
					id="bulk-add-input"
					value={inputString}
				/>
			</fieldset>

			{isInputEmpty ? null : (
				<ol
					className="w-full flex flex-col h-fit rounded-lg border border-gray-700"
					ref={olRef}
				>
					{listItems}
				</ol>
			)}
		</section>
	);
}
