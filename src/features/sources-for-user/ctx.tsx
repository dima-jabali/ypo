import { createZustandProvider } from "#/contexts/create-zustand-provider";
import { noop } from "#/helpers/utils";
import type { Virtualizer } from "@tanstack/react-virtual";

type SourcesForUserCtxType = {
  rowVirtualizer: Virtualizer<HTMLElement, HTMLElement>;
  measure: () => void;
};

export const { Provider: SourcesForUserCtxProvider, useStore: useSourcesForUserCtx } =
  createZustandProvider<SourcesForUserCtxType>(
    () => ({
      rowVirtualizer: null!,
      measure: noop,
    }),
    {
      name: "SourcesForUserCtx",
    },
  );
