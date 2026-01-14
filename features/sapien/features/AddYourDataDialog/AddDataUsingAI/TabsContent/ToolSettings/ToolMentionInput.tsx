import { Suspense, useState } from "react";

import { LOADER } from "#/components/Button";
import { Input } from "#/components/Input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "#/components/select";
import { Switch } from "#/components/switch";
import { convertStringToPlateValue } from "#/features/sapien/components/column-options-popover/convert-string-to-plate-value";
import { MentionInput } from "#/features/sapien/components/mention-input/MentionInput";
import { useMentionablesStore } from "#/features/sapien/contexts/mentionables/mentionables-context";
import { isValidNumber, stringifyUnknown } from "#/helpers/utils";
import { useFetchAllDatabaseConnections } from "#/hooks/fetch/use-fetch-all-database-connections";
import { useForceRender } from "#/hooks/use-force-render";
import { matchIcon } from "#/icons/match-icon";
import type { GeneralToolInput, ToolConfiguration } from "#/types/batch-table";
import type { GoogleDriveDatabaseConnectionId } from "#/types/databases";

type Props = {
	toolConfig: ToolConfiguration;
	input: GeneralToolInput;
	index: number;
};

export function ToolMentionInput(props: Props) {
	if (
		props.input.type === "integer" &&
		props.input.name === "google_drive_connection_id"
	) {
		return (
			<Suspense fallback={LOADER}>
				<GoogleDriveConnectionIdSelector {...props} />
			</Suspense>
		);
	}

	switch (props.input.type) {
		case "boolean":
			return <BooleanInput {...props} />;

		case "array<string>":
			return <StringArrayInputsWithMention {...props} />;

		case "integer":
			return <IntegerInput {...props} />;

		default:
			return <StringInputWithMention {...props} />;
	}
}

function BooleanInput({ toolConfig, index, input }: Props) {
	const description = input.description ?? "";
	const hasDefaultValue = input.has_default;
	const name = input.name;

	let isRequired = false;
	if (input.can_be_inferred || hasDefaultValue) {
		isRequired = false;
	} else if (input.is_required) {
		isRequired = true;
	}

	const defaultChecked =
		(toolConfig.inputs?.[name] as boolean | undefined) ?? false;

	const handleChangeBooleanInput = (newValue: boolean) => {
		toolConfig.inputs ??= {};

		toolConfig.inputs[name] = newValue;
	};

	return (
		<fieldset className="flex flex-col gap-0 text-sm" key={name}>
			<label className="text-sm flex flex-col gap-1" htmlFor={name}>
				<div className="flex items-center gap-2">
					<div className="flex items-center">
						<span className="font-normal text-primary" title="Input's number">
							{index + 1}.&nbsp;
						</span>

						<span className="font-mono font-semibold" title="Input's name">
							{name}:
							{isRequired ? (
								<span className="text-warning text-xs" title="Required field">
									&nbsp;required
								</span>
							) : null}
						</span>
					</div>

					<Switch
						onCheckedChange={handleChangeBooleanInput}
						defaultChecked={defaultChecked}
						id={name}
					/>
				</div>

				<p
					className="text-xs text-primary tabular-nums"
					title="Input's description"
				>
					{description}
				</p>
			</label>
		</fieldset>
	);
}

function IntegerInput({ toolConfig, index, input }: Props) {
	const description = input.description ?? "";
	const name = input.name;

	let isRequired = false;
	if (input.can_be_inferred) {
		isRequired = false;
	} else if (input.is_required) {
		isRequired = true;
	}

	function handleChangeIntegerInput(e: React.ChangeEvent<HTMLInputElement>) {
		toolConfig.inputs ??= {};

		toolConfig.inputs[name] = e.target.valueAsNumber;
	}

	return (
		<fieldset className="flex flex-col gap-1 text-sm" key={name}>
			<label className="text-sm flex flex-col gap-1">
				<div className="flex">
					<span className="font-normal text-primary" title="Input's number">
						{index + 1}.&nbsp;
					</span>

					<span className="font-mono font-semibold" title="Input's name">
						{name}:
						{isRequired ? (
							<span className="text-yellow-400 text-xs" title="Required field">
								&nbsp;required
							</span>
						) : null}
					</span>
				</div>

				<p
					className="text-xs text-primary tabular-nums"
					title="Input's description"
				>
					{description}
				</p>
			</label>

			<Input type="number" step="1" onChange={handleChangeIntegerInput} />
		</fieldset>
	);
}

function StringInputWithMention({ toolConfig, index, input }: Props) {
	const mentionables = useMentionablesStore().use.mentionables();

	const defaultValue = stringifyUnknown(input.default_value);
	const description = input.description ?? "";
	const hasDefaultValue = input.has_default;
	const name = input.name;
	const initialValue = toolConfig.inputs?.[name]
		? stringifyUnknown(toolConfig.inputs?.[name])
		: defaultValue;

	let isRequired = false;
	if (input.can_be_inferred || hasDefaultValue) {
		isRequired = false;
	} else if (input.is_required) {
		isRequired = true;
	}

	const promptPlateEditorKey = `tool-config-input&input=${name}}`;
	const plateInitialValue = convertStringToPlateValue(`${initialValue}`, {
		mentionables,
	});

	const handleChangeStringInput = (newValue: string) => {
		toolConfig.inputs ??= {};

		toolConfig.inputs[name] = newValue;
	};

	return (
		<fieldset className="flex flex-col gap-1 text-sm" key={name}>
			<label
				className="text-sm flex flex-col gap-1"
				htmlFor={promptPlateEditorKey}
			>
				<div className="flex">
					<span className="font-normal text-primary" title="Input's number">
						{index + 1}.&nbsp;
					</span>

					<span className="font-mono font-semibold" title="Input's name">
						{name}:
						{isRequired ? (
							<span className="text-warning text-xs" title="Required field">
								&nbsp;required
							</span>
						) : null}
					</span>
				</div>

				<p
					className="text-xs text-primary tabular-nums"
					title="Input's description"
				>
					{description}
				</p>

				{hasDefaultValue ? (
					<p
						className="text-xs flex text-primary"
						title="Input's default value"
					>
						Default value:&nbsp;<i>{defaultValue}</i>
					</p>
				) : null}
			</label>

			<MentionInput
				className="flex flex-col max-h-[50vh] simple-scrollbar min-h-[80px] w-full rounded-sm overflow-auto border border-border-smooth bg-popover px-3 py-2 text-sm focus-visible:outline-hidden cursor-text caret-primary resize-y"
				onValueChange={handleChangeStringInput}
				plateInitialValue={plateInitialValue}
				id={promptPlateEditorKey}
				title="Input's value"
			/>
		</fieldset>
	);
}

function StringArrayInputsWithMention({ toolConfig, index, input }: Props) {
	const [numberOfUrls, setNumberOfUrls] = useState(
		(toolConfig.inputs?.[input.name] as Array<string> | undefined)?.map(
			(_, index) => index,
		) ?? [0],
	);

	const mentionables = useMentionablesStore().use.mentionables();

	const defaultValue = stringifyUnknown(input.default_value);
	const hasOnlyOneUrl = numberOfUrls.length === 1;
	const description = input.description ?? "";
	const hasDefaultValue = input.has_default;
	const name = input.name;

	let isRequired = false;
	if (input.can_be_inferred || hasDefaultValue) {
		isRequired = false;
	} else if (input.is_required) {
		isRequired = true;
	}

	const handleChangeStringInput = (newValue: string, index: number) => {
		toolConfig.inputs ??= {};
		toolConfig.inputs[name] ??= [];

		(toolConfig.inputs[name] as Array<string>)[index] = newValue;
	};

	const addUrl = () => {
		setNumberOfUrls((prev) => [...prev, prev.length]);
	};

	const removeLastUrl = () => {
		setNumberOfUrls((prev) => {
			const newUrls = [...prev];

			const index = newUrls.pop();

			if (newUrls.length === 0) {
				newUrls.push(0);
			}

			if (isValidNumber(index)) {
				(toolConfig.inputs?.[name] as Array<string>)?.splice(index, 1);
			}

			return newUrls;
		});
	};

	return (
		<fieldset className="flex flex-col gap-1 text-sm" key={name}>
			<label className="text-sm flex flex-col gap-1">
				<div className="flex">
					<span className="font-normal text-primary" title="Input's number">
						{index + 1}.&nbsp;
					</span>

					<span className="font-mono font-semibold" title="Input's name">
						{name}:
						{isRequired ? (
							<span className="text-yellow-400 text-xs" title="Required field">
								&nbsp;required
							</span>
						) : null}
					</span>
				</div>

				<p
					className="text-xs text-primary tabular-nums"
					title="Input's description"
				>
					{description}
				</p>

				{hasDefaultValue ? (
					<p
						className="text-xs flex text-primary"
						title="Input's default value"
					>
						Default value:&nbsp;<i>{defaultValue}</i>
					</p>
				) : null}
			</label>

			{numberOfUrls.map((index) => {
				const promptPlateEditorKey = `tool-config-input&input=${name}}&index=${index}`;
				const rawInitialValue = (
					toolConfig.inputs?.[name] as Array<string> | undefined
				)?.[index];
				const initialValue = rawInitialValue
					? stringifyUnknown(rawInitialValue)
					: defaultValue;
				const plateInitialValue = convertStringToPlateValue(`${initialValue}`, {
					mentionables,
				});

				const isLastInput = index === numberOfUrls.length - 1;

				return (
					<div className="flex items-center gap-2 w-full" key={index}>
						<MentionInput
							className="flex flex-col h-7 whitespace-nowrap w-full rounded-md overflow-auto border border-border-smooth  bg-popover px-2 justify-center text-sm ring-offset-background   focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text caret-white"
							onValueChange={(newValue) =>
								handleChangeStringInput(newValue, index)
							}
							plateInitialValue={plateInitialValue}
							id={promptPlateEditorKey}
							title="Input's value"
						/>

						{isLastInput ? (
							<>
								{hasOnlyOneUrl ? null : (
									<button
										className="rounded-md bg-destructive hover:bg-red-600 active:bg-red-700 flex items-center justify-center h-6 aspect-square"
										onClick={removeLastUrl}
									>
										{matchIcon("x")}
									</button>
								)}

								<button
									className="rounded-md bg-green-600 hover:bg-green-700 active:bg-green-800 flex items-center justify-center h-6 aspect-square"
									onClick={addUrl}
								>
									{matchIcon("+")}
								</button>
							</>
						) : null}
					</div>
				);
			})}
		</fieldset>
	);
}

function GoogleDriveConnectionIdSelector({ toolConfig, index, input }: Props) {
	const fetchAllDatabaseConnectionsQuery = useFetchAllDatabaseConnections();
	const { googleDriveDatabases } = fetchAllDatabaseConnectionsQuery.data;
	const forceRender = useForceRender();

	const description = input.description ?? "";
	const name = input.name;

	let isRequired = false;
	if (input.can_be_inferred) {
		isRequired = false;
	} else if (input.is_required) {
		isRequired = true;
	}

	const selectedConn = googleDriveDatabases.find(
		(db) => db.id === toolConfig.inputs?.[name],
	);
	const value = selectedConn ? (
		<div className="capitalize flex items-center w-full gap-2">
			<span>{selectedConn.name}</span>

			<span className="text-xs text-muted group-hover:text-accent-foreground">
				({selectedConn.id})
			</span>
		</div>
	) : null;

	return (
		<fieldset className="flex flex-col gap-1 text-sm" key={name}>
			<label className="text-sm flex flex-col gap-1">
				<div className="flex">
					<span className="font-normal text-primary" title="Input's number">
						{index + 1}.&nbsp;
					</span>

					<span className="font-mono font-semibold" title="Input's name">
						{name}:
						{isRequired ? (
							<span className="text-yellow-400 text-xs" title="Required field">
								&nbsp;required
							</span>
						) : null}
					</span>
				</div>

				<p
					className="text-xs text-primary tabular-nums"
					title="Input's description"
				>
					{description}
				</p>
			</label>

			<Select
				onValueChange={(dbIdAsString) => {
					const newValue = Number(
						dbIdAsString || undefined,
					) as GoogleDriveDatabaseConnectionId;
					const isValid = isValidNumber(newValue);

					if (!isValid) return;

					toolConfig.inputs ??= {};

					toolConfig.inputs[name] = newValue;

					forceRender();
				}}
			>
				<SelectTrigger className="w-full">{value}</SelectTrigger>

				<SelectContent className="z-110">
					{googleDriveDatabases.map((db) => (
						<SelectItem
							className="capitalize flex items-center justify-between w-full gap-4"
							value={`${db.id}`}
							key={db.id}
						>
							<span>{db.name}</span>

							<span className="text-xs text-muted group-hover:text-accent-foreground">
								({db.id})
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</fieldset>
	);
}
