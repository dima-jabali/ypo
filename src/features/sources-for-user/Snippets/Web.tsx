import { SourceForUserType } from "#/types/chat";
import { useSourcesForUserCtx } from "../ctx";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";

type Props = {
  normalizedSource: Extract<NormalizedSource, { source_type: SourceForUserType.Web }>;
};

export function WebDescription({ normalizedSource }: Props) {
  const sourcesForUserCtx = useSourcesForUserCtx();

  function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
    if (e.newState === "closed") {
      requestAnimationFrame(() => {
        sourcesForUserCtx.getState().measure();
      });
    }
  }

  return (
    <details onToggle={remeasureHeight}>
      <summary className="text-xs hover:underline underline-offset-2 cursor-pointer my-1">
        Text content
      </summary>

      <section className="w-[95%] border border-border-smooth  rounded-md bg-slate-800 flex flex-col max-h-96 simple-scrollbar p-2">
        <HighlightStringWithFilterRegex string={normalizedSource.values.text} />
      </section>
    </details>
  );
}
