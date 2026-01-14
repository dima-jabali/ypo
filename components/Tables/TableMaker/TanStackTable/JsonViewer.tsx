import { memo, useState } from "react";
import { JsonView, allExpanded, darkStyles } from "react-json-view-lite";

import { Dialog, DialogContent, DialogTrigger } from "#/components/Dialog";

const JSON_VIEWER_STYLES: typeof darkStyles = {
	...darkStyles,
	container: "bg-black",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const JsonViewer_: React.FC<{ json: object | any[] }> = ({ json }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger className="py-0.5 px-2 my-1 rounded-md hover:bg-accent active:bg-accent hover:border-primary border border-transparent text-sm italic">
				JSON (click to inspect)
			</DialogTrigger>

			<DialogContent className="overflow-hidden">
				<div className="max-h-[80vh] simple-scrollbar">
					{isOpen ? (
						<JsonView
							shouldExpandNode={allExpanded}
							style={JSON_VIEWER_STYLES}
							data={json}
						/>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export const JsonViewer = memo(JsonViewer_);
