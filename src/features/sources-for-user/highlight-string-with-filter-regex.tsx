import { useId } from "react";
import { Fragment } from "react/jsx-runtime";

import { useFilterRegexStore } from "#/contexts/filter-regex";
import { highlightString } from "#/helpers/highlight-string";

const URL_REGEX = /(?:\b)(?<url>https?:\/\/[^\s)>]+|www\.[^\s)>]+\/?)/g;

export function HighlightStringWithFilterRegex({
	withLink = true,
	string,
}: {
	withLink?: boolean;
	string: string;
}) {
	const filterRegex = useFilterRegexStore().use.filterRegex();
	const id = useId();

	if (!string) {
		return null;
	}

	const jsxs: Array<React.ReactNode> = [];
	let lastStringIndex = 0;

	if (withLink) {
		// eslint-disable-next-line react-hooks/immutability
		URL_REGEX.lastIndex = 0;

		string.matchAll(URL_REGEX).forEach((match) => {
			const url = match.groups?.url;

			if (!url) {
				return;
			}

			const startIndex = match.index;

			const stringBefore = string.slice(lastStringIndex, startIndex);

			lastStringIndex = startIndex + url.length;

			jsxs.push(
				<Fragment key={startIndex}>
					{highlightString(stringBefore, filterRegex, "inline")}

					<a
						className="link break-all inline w-fit"
						rel="noopener noreferrer"
						target="_blank"
						href={url}
					>
						{highlightString(url, filterRegex, "", "")}
					</a>
				</Fragment>,
			);
		});
	}

	return (
		<Fragment key={id}>
			{jsxs.length > 0 ? (
				<>
					{jsxs}

					{highlightString(
						string.slice(lastStringIndex),
						filterRegex,
						"inline",
					)}
				</>
			) : (
				highlightString(string, filterRegex)
			)}
		</Fragment>
	);
}
