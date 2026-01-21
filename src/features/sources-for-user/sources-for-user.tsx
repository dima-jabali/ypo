"use client";

import { memo } from "react";

import {
  useSourceCitationContextStore,
  type CitationNumber,
  type SourceID,
} from "#/contexts/source-citation-context";
import type { SourceForUser } from "#/types/chat";
import { getSourceMainValues } from "./get-source-main-values";
import { normalizeSources, sortNormalizedSourcesByRelevance } from "./get-top-n-sources";
import { removeUrlHash } from "./utils";

import "client-only";

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

function Sources({ shouldShow, sources }: { sources: Array<SourceForUser>; shouldShow: boolean }) {
  const sourceCitationsStore = useSourceCitationContextStore();

  const sourcesMainValues = sortNormalizedSourcesByRelevance(normalizeSources(sources)).map(
    getSourceMainValues,
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

  console.log({ sourcesMainValues, allNormalizedSourcesWithId });

  return null;
}
