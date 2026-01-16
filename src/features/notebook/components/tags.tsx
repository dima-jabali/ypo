import { getProjectTagColors } from "#/components/layout/projects-helper";
import { useDownloadedNotebookTags } from "#/hooks/fetch/use-fetch-notebook";

export function Tags() {
  const tags = useDownloadedNotebookTags();

  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {tags.map((tag) => (
        <span
          className={`relative box-border flex w-min items-center justify-center overflow-hidden whitespace-nowrap rounded px-1 py-0.5 text-sm ${getProjectTagColors(
            tag.color,
          )}`}
          key={tag.id}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
