import { Clock } from "lucide-react";

import { shortDateFormatter } from "../../lib/utils";

type Props = {
	time: string | null;
};

export const TimeBlock: React.FC<Props> = ({ time }) => {
	return (
		<div className="flex h-full w-36 items-center gap-3 p-3 tabular-nums tracking-wider text-xs">
			<Clock className="size-4 flex-none text-primary" />

			{time ? shortDateFormatter.format(new Date(time)) : "—"}
		</div>
	);
};
