import { Plate, PlateContent, type PlateEditor } from "platejs/react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import type { DivProps } from "#/types/react";

type Props = {
  editor: PlateEditor;
} & Omit<DivProps, "style" | "role">;

const preventImagePluginDefaultOnDropHandler = (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();

  return true; // Returning true will make Plate consider the event handled and won't run their code.
};

export function PlateMessageInput({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className,
  editor,
  onKeyDown,
  ...props
}: Props) {
  return (
    <DefaultSuspenseAndErrorBoundary
      failedText="Error on message input!"
      fallbackFor="PlateMessageInput"
    >
      <Plate editor={editor}>
        <PlateContent
          className="w-full h-full relative min-h-[1lh] max-h-[35vh] select-text outline-hidden simple-scrollbar group break-all mix-blend-normal px-3"
          onDrop={preventImagePluginDefaultOnDropHandler}
          onKeyDown={onKeyDown}
          spellCheck={false}
          {...props}
        />
      </Plate>
    </DefaultSuspenseAndErrorBoundary>
  );
}
