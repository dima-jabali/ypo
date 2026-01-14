import { format, isValid } from "date-fns";
import {
	lazy,
	type SetStateAction,
	Suspense,
	useEffect,
	useMemo,
	useState,
} from "react";
import { CalendarIcon, CaseSensitive } from "lucide-react";

import { Input } from "#/components/Input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import {
	type ChildFilter,
	FilterType,
} from "#/components/Tables/TableMaker/filters/utilityTypes";
import { useSetCaseSensitive, useSetFilterValue } from "./helperFilterHooks";
import { LOADER } from "#/components/Button";

type Props = { childFilter: ChildFilter };

const DATE_FORMAT_FOR_SERVER = "dd/LL/yyyy HH:mm";

const NUMBER_COLUMN_TYPE = ["int64", "float64"];
const BOOLEAN_COLUMN_TYPE = ["bool"];

enum InputType {
	BOOLEAN = "boolean",
	NUMBER = "number",
	TEXT = "text",
}

const DayPicker = lazy(async () => ({
	default: (await import("react-day-picker")).DayPicker,
}));

const getFilterValueInputType = (columnType: ChildFilter["column"]["type"]) => {
	const isNumber = NUMBER_COLUMN_TYPE.includes(columnType as string);

	if (isNumber) {
		return InputType.NUMBER;
	}

	const isBoolean = BOOLEAN_COLUMN_TYPE.includes(columnType as string);

	if (isBoolean) {
		return InputType.BOOLEAN;
	}

	return InputType.TEXT;
};

export const ValueInput: React.FC<Props> = ({ childFilter }) => {
	// The ones below are for when there are TWO calendars in a row
	const [isSecondDatePickerOpen, setIsSecondDatePickerOpen] = useState(false);
	const [isFirstDatePickerOpen, setIsFirstDatePickerOpen] = useState(false);
	const [secondDateSelected, setSecondDateSelected] = useState<Date>();
	const [firstDateSelected, setFirstDateSelected] = useState<Date>();
	const [secondTimeValue, setSecondTimeValue] = useState("");
	const [firstTimeValue, setFirstTimeValue] = useState("");

	// The ones below are for when there is only ONE calendar in a row
	const [isSingleDatePickerOpen, setIsSingleDatePickerOpen] = useState(false);
	const [singleDateSelected, setSingleDateSelected] = useState<Date>();
	const [singleTimeValue, setSingleTimeValue] = useState("");

	const inputType = useMemo(
		() => getFilterValueInputType(childFilter.column.type),
		[childFilter.column.type],
	);

	const setCaseSensitive = useSetCaseSensitive();
	const setFilterValue = useSetFilterValue();

	const value = (() => {
		if (
			typeof childFilter.value === "boolean" ||
			typeof childFilter.value === "object"
		) {
			return `${childFilter.value}`;
		} else if (typeof childFilter.value === "number") {
			return childFilter.value;
		} else if (typeof childFilter.value !== "undefined") {
			return `${childFilter.value}`;
		} else return undefined;
	})();

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (inputType === InputType.NUMBER) {
			setFilterValue(Number(e.target.value), childFilter);
		} else {
			setFilterValue(e.target.value, childFilter);
		}
	};

	const handleInputChange = (
		day: Date,
		setTimeValue: (value: SetStateAction<Date | undefined>) => void,
	) => {
		const date = new Date(day);

		setTimeValue(isValid(date) ? date : undefined);
	};

	const handleChangeCaseSensitive = () => {
		setCaseSensitive(!childFilter.caseSensitive, childFilter);
	};

	useEffect(() => {
		if (!(secondDateSelected && firstDateSelected)) return;

		const from = new Date(firstDateSelected);
		{
			const [hour = "", minute = ""] = firstTimeValue.split(":");
			from.setHours(Number(hour), Number(minute));
		}

		const to = new Date(secondDateSelected);
		{
			const [hour = "", minute = ""] = secondTimeValue.split(":");
			to.setHours(Number(hour), Number(minute));
		}

		const isFromDateValid = isValid(from);
		const isToDateValid = isValid(to);

		if (!isFromDateValid || !isValid(to)) {
			if (!isFromDateValid) {
				toast({
					description: "Please select a valid date",
					title: `Invalid date: from ${from}`,
					variant: ToastVariant.Destructive,
				});
			}
			if (!isToDateValid) {
				toast({
					description: "Please select a valid date",
					variant: ToastVariant.Destructive,
					title: `Invalid date: to ${to}`,
				});
			}

			return;
		}

		setFilterValue(
			{
				from: format(firstDateSelected, DATE_FORMAT_FOR_SERVER),
				to: format(secondDateSelected, DATE_FORMAT_FOR_SERVER),
			},
			childFilter,
		);
	}, [
		secondDateSelected,
		firstDateSelected,
		secondTimeValue,
		firstTimeValue,
		childFilter,
		setFilterValue,
	]);

	useEffect(() => {
		if (!singleDateSelected) return;

		const [hour = "", minute = ""] = firstTimeValue.split(":");
		const date = new Date(singleDateSelected);

		date.setHours(Number(hour), Number(minute));

		if (!isValid(date)) {
			toast({
				description: "Please select a valid date",
				variant: ToastVariant.Destructive,
				title: `Invalid date: ${date}`,
			});

			return;
		}

		setFilterValue(format(date, DATE_FORMAT_FOR_SERVER), childFilter);
	}, [childFilter, firstTimeValue, setFilterValue, singleDateSelected]);

	switch (childFilter.column.type) {
		case FilterType.timedelta:
			return (
				<div className="flex items-centermin-h-[31px]">
					<Popover
						onOpenChange={setIsFirstDatePickerOpen}
						open={isFirstDatePickerOpen}
					>
						<div className="border-table-separator bg-input-bg text-font-color flex flex-col gap-1 rounded-sm border p-1 tabular-nums">
							<div className="flex h-[31px] w-full items-center justify-between gap-2 pr-1">
								<p className="w-full">
									{firstDateSelected
										? firstDateSelected.toLocaleDateString()
										: "From"}
								</p>

								<PopoverTrigger>
									<CalendarIcon className="stroke-primary/60" />
								</PopoverTrigger>
							</div>

							<Input
								onChange={(e) => setFirstTimeValue(e.target.value)}
								value={firstTimeValue}
								className="h-[31px]"
								placeholder="From"
								type="time"
							/>
						</div>

						<PopoverContent side="bottom">
							{isFirstDatePickerOpen ? (
								<Suspense fallback={LOADER}>
									<DayPicker
										onDayClick={(day) => {
											handleInputChange(day, setFirstDateSelected);
											setIsFirstDatePickerOpen(false);
										}}
										selected={firstDateSelected}
										mode="single"
										required
									/>
								</Suspense>
							) : null}
						</PopoverContent>
					</Popover>
					&nbsp;-&nbsp;
					<Popover
						onOpenChange={setIsSecondDatePickerOpen}
						open={isSecondDatePickerOpen}
					>
						<div className="border-table-separator bg-input-bg text-font-color flex flex-col gap-1 rounded-sm border p-1 tabular-nums">
							<div className="flex h-[31px] w-full items-center justify-between gap-1 pr-1">
								<p className="w-full">
									{secondDateSelected
										? secondDateSelected.toLocaleDateString()
										: "To"}
								</p>

								<PopoverTrigger>
									<CalendarIcon className="stroke-white/60" />
								</PopoverTrigger>
							</div>

							<Input
								onChange={(e) => setSecondTimeValue(e.target.value)}
								value={secondTimeValue}
								className="h-[31px]"
								placeholder="From"
								type="time"
							/>
						</div>

						<PopoverContent side="bottom">
							<DayPicker
								onDayClick={(day) => {
									handleInputChange(day, setSecondDateSelected);
									setIsSecondDatePickerOpen(false);
								}}
								selected={secondDateSelected}
								mode="single"
								required
							/>
						</PopoverContent>
					</Popover>
				</div>
			);

		case FilterType.datetime64:
			return (
				<Popover
					onOpenChange={setIsSingleDatePickerOpen}
					open={isSingleDatePickerOpen}
				>
					<div className="border-table-separator bg-input-bg text-font-color flex flex-col gap-1 rounded-sm border p-1 tabular-nums">
						<div className="flex h-[31px] w-full items-center justify-between gap-1 pr-1">
							<p className="w-full">
								{singleDateSelected
									? singleDateSelected.toLocaleDateString()
									: "To"}
							</p>

							<PopoverTrigger>
								<CalendarIcon className="stroke-white/60" />
							</PopoverTrigger>
						</div>

						<Input
							onChange={(e) => setSingleTimeValue(e.target.value)}
							value={singleTimeValue}
							className="h-[31px]"
							placeholder="From"
							type="time"
						/>
					</div>
					singleDateSelected
					<PopoverContent side="bottom">
						<DayPicker
							onDayClick={(day) => {
								handleInputChange(day, setSingleDateSelected);
								setIsSingleDatePickerOpen(false);
							}}
							selected={secondDateSelected}
							mode="single"
							required
						/>
					</PopoverContent>
				</Popover>
			);

		default:
			return (
				<div className="flex gap-2">
					<Input
						className="h-[31px]"
						onChange={onChange}
						placeholder="Value"
						type={inputType}
						value={value}
						required
					/>

					{inputType === InputType.TEXT ? (
						<button
							className="aspect-square rounded-xs border h-[31px] border-transparent transition-none data-[is-case-sensitive=true]:border-link-visited/70 data-[is-case-sensitive=true]:bg-button-active button-hover flex items-center justify-center p-1"
							data-is-case-sensitive={childFilter.caseSensitive}
							onPointerUp={handleChangeCaseSensitive}
							title="Match case"
							type="button"
						>
							<CaseSensitive className="size-5 text-primary" />
						</button>
					) : null}
				</div>
			);
	}
};
