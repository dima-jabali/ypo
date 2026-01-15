import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from "#/components/Dialog";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { VERIFY_SQL_QUERY_EDITOR_OPTIONS } from "#/helpers/monaco-editor";
import { SourceForUserType } from "#/types/chat";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useState } from "react";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";
import { ColorScheme } from "#/types/general";

type Props = {
	normalizedSource: Extract<
		NormalizedSource,
		{ source_type: SourceForUserType.ModeQuery }
	>;
};

export function ModeQueryTitleTrigger({ normalizedSource }: Props) {
	const [isOpen, setIsOpen] = useState(false);

	const colorScheme = generalContextStore.use.colorScheme();

	const handleEscapeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.nativeEvent.stopImmediatePropagation();
			event.stopPropagation();
			event.preventDefault();

			setIsOpen(false);
		}
	};

	const { values } = normalizedSource;

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<p
					className="max-h-full break-all truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:link group-data-[is-drawer]/drawer:hover:underline"
					title={values.query}
				>
					<HighlightStringWithFilterRegex string={`${values.query}`} />
				</p>
			</DialogTrigger>

			<DialogContent onKeyDown={handleEscapeKeyDown}>
				<DialogHeader className="text-xl font-bold">Source info</DialogHeader>

				<dl className="flex flex-col gap-1 text-primary">
					<div className="flex gap-1">
						<dt>Name:</dt>
						<dd>{values.name}</dd>
					</div>

					<div className="flex gap-1">
						<dt>Connection type:</dt>
						<dd>{values.connection_type}</dd>
					</div>
				</dl>

				{isOpen ? (
					<MonacoEditor
						theme={colorScheme === ColorScheme.dark ? "vs-dark" : "vs-light"}
						options={VERIFY_SQL_QUERY_EDITOR_OPTIONS}
						value={values.query}
						keepCurrentModel
						language="sql"
						height="15vh"
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
