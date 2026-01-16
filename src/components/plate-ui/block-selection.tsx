import { useBlockSelected } from "@platejs/selection/react";

export function BlockSelection() {
  const isBlockSelected = useBlockSelected();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-1 data-[selected=true]:bg-accent/20"
      data-selected={isBlockSelected}
      contentEditable={false}
    ></div>
  );
}
