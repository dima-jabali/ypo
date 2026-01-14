import { useRef, useState } from "react";
import cronstrue from "cronstrue";

import { Input } from "./Input";

export function Cron({
	defaultValue,
	onChange,
}: {
	onChange: (cronString: string) => void;
	defaultValue?: string;
}) {
	const [cronString, setCronString] = useState(defaultValue ?? "* * * * * *");
	const [humanCron, setHumanCron] = useState(() =>
		cronstrue.toString(cronString),
	);
	const [isValid, setIsValid] = useState(true);

	const inputRef = useRef<HTMLInputElement | null>(null);

	function updateCronString(e: React.ChangeEvent<HTMLInputElement>) {
		const str = e.target.value;

		setCronString(str);
		onChange(str);

		try {
			const humanCron = cronstrue.toString(str, {
				verbose: true,
				throwExceptionOnParseError: true,
			});

			setHumanCron(humanCron);
			setIsValid(true);

			inputRef.current?.setCustomValidity("");
		} catch (errMsg) {
			console.error(errMsg);

			inputRef.current?.setCustomValidity(errMsg as string);
			setHumanCron(errMsg as string);
			setIsValid(false);
		}
	}

	return (
		<div className="flex flex-col gap-1 pointer-events-auto">
			<Input
				ref={inputRef}
				className="invalid:ring-2 invalid:ring-red-500"
				onChange={updateCronString}
				value={cronString}
				aria-invalid={!isValid}
				type="text"
			/>

			<p
				className="text-xs whitespace-nowrap data-[valid=false]:text-destructive"
				data-valid={isValid}
			>
				{humanCron}
			</p>
		</div>
	);
}
