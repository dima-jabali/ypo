import { classNames } from "#/helpers/class-names";

export function NativePdfViewer({
  fileBlobUrl,
  className,
}: {
  className?: string | undefined;
  fileBlobUrl: string;
}) {
  return fileBlobUrl ? (
    <object
      className={classNames("flex h-full w-full rounded-md min-h-[50vh]", className)}
      type="application/pdf"
      data={fileBlobUrl}
      data-no-print
    >
      Your browser does not support displaying PDFs.
    </object>
  ) : null;
}
