import { Link } from "lucide-react";
import { memo } from "react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useSourceCitationContextStore, type SourceID } from "#/contexts/source-citation-context";
import { isDev, log } from "#/helpers/utils";

const REGEX_OF_TEXT_TO_BE_REPLACED = /(^\s+)|(\s+$)|(source-citation)|(WEBSITE:)|(SOURCE:)|\n/g;

export const SourceCitation = memo(function SourceCitation({ text }: { text: string }) {
  const replaceReferenceNumbersWithIcons =
    generalContextStore.use.replaceReferenceNumbersWithIcons();
  const shouldShowAllSourcesSidebar = generalContextStore.use.showSourcesSidebar();
  const shouldShowInlineCitation = generalContextStore.use.showInLineCitations();
  const sourceCitationStore = useSourceCitationContextStore();

  if (!shouldShowInlineCitation) return null;

  // eslint-disable-next-line react-hooks/immutability
  REGEX_OF_TEXT_TO_BE_REPLACED.lastIndex = 0;
  const parsedId = text.replaceAll(REGEX_OF_TEXT_TO_BE_REPLACED, "") as SourceID;

  const state = sourceCitationStore.getState();
  const { allNormalizedSourcesWithId } = state;

  const citationNumber = allNormalizedSourcesWithId.get(parsedId);

  if (citationNumber === undefined) {
    if (isDev) {
      log("Source citation not found:", { parsedId, text });
      console.log({ allNormalizedSourcesWithId });
    }

    return replaceReferenceNumbersWithIcons ? (
      <span
        className="py-1 px-2 mx-0.5 bg-primary/10 rounded-xl inline-block flex-none cursor-not-allowed"
        title={`Source not found: ${parsedId}`}
      >
        <Link className="size-3 flex-none stroke-primary/50" />
      </span>
    ) : (
      <sup
        title={`Source not found: ${parsedId}`}
        className="text-muted tabular-nums"
        data-source-citation-note-found
      >
        [{state.lastCitationNumber++}]
      </sup>
    );
  }

  function handleShowSource() {
    sourceCitationStore.setState({ currentSourceId: parsedId });
  }

  return replaceReferenceNumbersWithIcons ? (
    <button
      className="data-[has-onclick=true]:button-hover flex-none py-1 px-2 mx-0.5 bg-primary/15 rounded-xl inline-block"
      title={`Source citation${shouldShowAllSourcesSidebar ? " (click to show source)" : ""}`}
      data-has-onclick={shouldShowAllSourcesSidebar}
      disabled={!shouldShowAllSourcesSidebar}
      onClick={handleShowSource}
      data-source-citation
    >
      <Link className="size-3 flex-none stroke-primary" />
    </button>
  ) : (
    <sup
      className="data-[has-onclick=true]:hover:underline data-[has-onclick=true]:link data-[has-onclick=true]:cursor-pointer data-[has-onclick=false]:text-muted tabular-nums inline-block"
      title={`Source citation${shouldShowAllSourcesSidebar ? " (click to show source)" : ""}`}
      data-has-onclick={shouldShowAllSourcesSidebar}
      onClick={handleShowSource}
      data-source-citation
    >
      [{citationNumber}]
    </sup>
  );
});
