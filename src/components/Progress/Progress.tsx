import spinnerStyle from "./file-upload-progress.module.css";
import { ProgressType } from "./utils";

type Props = {
	bytesParagraphRef: React.RefObject<HTMLParagraphElement | null>;
	progressRef: React.RefObject<HTMLProgressElement | null>;
	type: ProgressType;
};

// Styling with CSS. Spinner from https://uiverse.io/AqFox/young-dragon-29
const SPINNER = (
	<div className={spinnerStyle.spinner}>
		<div></div>
		<div></div>
		<div></div>
		<div></div>
		<div></div>
		<div></div>
	</div>
);

export const Progress: React.FC<Props> = ({
	type,
	bytesParagraphRef,
	progressRef,
}) => {
	return (
		<div
			className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border-smooth  p-4"
			title="Upload in progress..."
		>
			{type === ProgressType.RunningWithoutProgress ? (
				SPINNER
			) : (
				<>
					<p className="text-sm tabular-nums" ref={bytesParagraphRef}></p>

					<progress
						className="w-2/3 rounded-full"
						ref={progressRef}
						aria-valuemin={0}
						max={100}
					/>
				</>
			)}
		</div>
	);
};
