import { memo } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { FilterRegexProvider } from "#/contexts/filter-regex";
import {
	useSourceCitationContextStore,
	type CitationNumber,
	type SourceID,
} from "#/contexts/source-citation-context";
import type { SourceForUser } from "#/types/chat";
import { AllSourcesInDrawer } from "./all-sources-in-drawer";
import { getSourceMainValues } from "./get-source-main-values";
import {
	normalizeSources,
	sortNormalizedSourcesByRelevance,
} from "./get-top-n-sources";
import { HoverSourceSnippet } from "./hover-source-snippet";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { removeUrlHash } from "./utils";

export const SourcesForUser = memo(function SourcesForUser({
	shouldShow,
	sources,
}: {
	sources: SourceForUser[] | null;
	shouldShow: boolean;
}) {
	return sources && sources.length > 0 ? (
		<Sources sources={sources} shouldShow={shouldShow} />
	) : null;
});

function Sources({
	shouldShow,
	sources,
}: {
	sources: Array<SourceForUser>;
	shouldShow: boolean;
}) {
	const shouldShowAllSourcesSidebar =
		generalContextStore.use.showSourcesSidebar();
	const sourceCitationsStore = useSourceCitationContextStore();

	const sourcesMainValues = sortNormalizedSourcesByRelevance(
		normalizeSources(sources),
	).map(getSourceMainValues);

	const mostRelevantMainValues = sourcesMainValues.slice(
		0,
		shouldShowAllSourcesSidebar ? 8 : 9,
	);

	const mostRelevantMainValuesJSXs = mostRelevantMainValues.map(
		(sourceMainValues) => (
			<HoverSourceSnippet
				sourceMainValues={sourceMainValues}
				key={sourceMainValues.id}
			/>
		),
	);

	const state = sourceCitationsStore.getState();

	const { allNormalizedSourcesWithId } = state;

	for (const sourceMainValues of sourcesMainValues) {
		const id = removeUrlHash(sourceMainValues.id) as SourceID;

		if (!allNormalizedSourcesWithId.has(id)) {
			const citationNumber = (state.lastCitationNumber + 1) as CitationNumber;

			state.lastCitationNumber = citationNumber;

			allNormalizedSourcesWithId.set(id, citationNumber);
			allNormalizedSourcesWithId.set(citationNumber, id);
		}
	}

	sourceCitationsStore.setState({
		lastCitationNumber: state.lastCitationNumber,
	});

	if (!shouldShow) {
		return null;
	}

	return (
		<DefaultSuspenseAndErrorBoundary
			failedText="Failed to load sources"
			fallbackFor="Sources for user"
		>
			<FilterRegexProvider>
				<ul className="sources-wrapper my-4 empty:hidden flex flex-wrap gap-2 max-w-full text-sm tabular-nums text-primary">
					{mostRelevantMainValuesJSXs}

					{shouldShowAllSourcesSidebar ? (
						<AllSourcesInDrawer
							sourcesMainValues={sourcesMainValues}
							shouldShow
						/>
					) : null}
				</ul>
			</FilterRegexProvider>
		</DefaultSuspenseAndErrorBoundary>
	);
}
