import { useState } from "react";

import { LOADER } from "#/components/Button";
import { Dialog, DialogContent } from "#/components/Dialog";
import { NativePdfViewer } from "#/components/native-pdf-viewer";
import { useFetchPdfFileById } from "#/hooks/fetch/use-fetch-pdf-file-by-id";
import { SourceForUserType } from "#/types/chat";
import type { NormalizedSource } from "../get-top-n-sources";

type Props = {
  normalizedSource: Extract<NormalizedSource, { source_type: SourceForUserType.Pdf }>;
};

export function PdfTitlePopoverTrigger({ normalizedSource }: Props) {
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [canDownloadPdf, setCanDownloadPdf] = useState(false);

  const { values } = normalizedSource;

  const fetchPdfFileByIdQuery = useFetchPdfFileById(canDownloadPdf, values.pdf_id);

  function handleEscapeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();

      setIsPdfPreviewOpen(false);
    }
  }

  function handleOpenPreview(event: React.MouseEvent<HTMLButtonElement>) {
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
    event.preventDefault();

    setIsPdfPreviewOpen(true);
    setCanDownloadPdf(true);
  }

  return (
    <>
      {isPdfPreviewOpen ? (
        <Dialog onOpenChange={setIsPdfPreviewOpen} open>
          <DialogContent
            className="flex p-0 z-100 rounded-lg items-center justify-center h-[90vh] min-w-[50vw] max-w-[90vw]"
            onKeyDown={handleEscapeKeyDown}
            overlayClassName="z-100"
            showCloseButton={false}
          >
            {fetchPdfFileByIdQuery.isError ? (
              <p>Failed to fetch PDF file!</p>
            ) : fetchPdfFileByIdQuery.isPending ? (
              LOADER
            ) : fetchPdfFileByIdQuery.data ? (
              <div className="h-[calc(90vh-2px)] w-full simple-scrollbar">
                <NativePdfViewer fileBlobUrl={fetchPdfFileByIdQuery.data.fileUrl} />
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}

      <button
        className="max-h-full break-all text-left truncate group-data-[is-drawer]/drawer:font-bold group-data-[is-drawer]/drawer:text-base group-data-[is-drawer]/drawer:link hover:underline"
        onClick={handleOpenPreview}
      >
        PDF file snippet
      </button>
    </>
  );
}
