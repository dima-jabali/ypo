import { memo } from "react";

import { Status } from "./status";
import { Tags } from "./tags";
import { EditNotebookTitle } from "./edit-notebook-title";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { EditNotebookDescription } from "./edit-notebook-description";

export const ToolBar = memo(function ToolBar() {
  return (
    <DefaultSuspenseAndErrorBoundary failedText="Error on toolbar" fallbackFor="Toolbar">
      <header className="notebook-content mb-2 flex flex-col gap-4 max-h-fit">
        <div className="mt-5 flex gap-5">
          <Status />

          <Tags />
        </div>

        <EditNotebookTitle />

        <EditNotebookDescription />
      </header>
    </DefaultSuspenseAndErrorBoundary>
  );
});
