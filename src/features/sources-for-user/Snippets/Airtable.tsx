import { isValidNumber } from "#/helpers/utils";
import { SourceForUserType } from "#/types/chat";
import { useSourcesForUserCtx } from "../ctx";
import type { NormalizedSource } from "../get-top-n-sources";
import { HighlightStringWithFilterRegex } from "../highlight-string-with-filter-regex";

type Props = {
  normalizedSource: Extract<NormalizedSource, { source_type: SourceForUserType.Airtable }>;
};

export function AirtableTable({ normalizedSource }: Props) {
  const sourcesForUserCtx = useSourcesForUserCtx();

  const { values } = normalizedSource;

  function remeasureHeight(e: React.ToggleEvent<HTMLDetailsElement>) {
    if (e.newState === "closed") {
      requestAnimationFrame(() => {
        const index = Number(
          (e.target as HTMLElement).closest("[data-index]")?.getAttribute("data-index"),
        );

        if (isValidNumber(index)) {
          sourcesForUserCtx.getState().rowVirtualizer.resizeItem(index, 100);
        } else {
          sourcesForUserCtx.getState().measure();
        }
      });
    }
  }

  return (
    <details onToggle={remeasureHeight}>
      <summary
        className="hover:underline underline-offset-2 cursor-pointer my-1 text-xs"
        title="More info about this Airtable source"
      >
        More info
      </summary>

      <section className="flex max-w-full flex-col gap-2 overflow-auto data-[on-hover-ui=true]:p-2 simple-scrollbar text-xs border border-border-smooth rounded-lg">
        <table>
          <tbody className="[&>tr]:even:bg-alt-row">
            <tr>
              <th className="px-2 text-left">Connection ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.airtable_connection_id}`} />
              </td>
            </tr>

            <tr>
              <th className="px-2 text-left">Base ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.base_id}`} />
              </td>
            </tr>

            <tr>
              <th className="px-2 text-left">Record ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.record_id}`} />
              </td>
            </tr>

            <tr>
              <th className="px-2 text-left">Table ID</th>

              <td>
                <HighlightStringWithFilterRegex string={`${values.table_id}`} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </details>
  );
}

export function AirtableDescription({ normalizedSource }: Props) {
  const { fields } = normalizedSource.values;

  return (
    <div className="flex max-w-full flex-col gap-2 overflow-auto data-[on-hover-ui=true]:p-2 simple-scrollbar text-xs border border-border-smooth rounded-lg">
      <table>
        <tbody>
          {Object.entries(fields).map(([key, value]) => (
            <tr className="even:bg-alt-row" key={key}>
              <th className="px-2 text-left max-h-[2lh] whitespace-nowrap">{key}</th>

              <td className="pr-2">
                <HighlightStringWithFilterRegex string={`${value}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
