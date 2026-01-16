import { getStatusEnum } from "#/components/layout/projects-helper";
import { useDownloadedNotebookStatus } from "#/hooks/fetch/use-fetch-notebook";
import { NotebookStatus } from "#/types/notebook";

const STATUS_COLORS: { [key: string]: string } = {
  [NotebookStatus.InProgress]: "lightblue",
  [NotebookStatus.Completed]: "green",
  [NotebookStatus.NotStarted]: "grey",
  [NotebookStatus.Blocked]: "red",
};

export function Status() {
  const notebookStatus = useDownloadedNotebookStatus();

  const enumStatus = getStatusEnum(notebookStatus);

  const color = STATUS_COLORS[enumStatus] || "white";

  return (
    <div className="flex gap-2 justify-start items-start h-fit" title="Project's Status">
      <span
        className="size-3 flex-none my-auto rounded-full"
        style={{ backgroundColor: color }}
      ></span>

      <p className="text-sm whitespace-nowrap">{notebookStatus}</p>
    </div>
  );
}
