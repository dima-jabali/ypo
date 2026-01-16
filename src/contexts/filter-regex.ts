"use client";
import { createZustandProvider } from "./create-zustand-provider";

type SourceCitationsData = {
  filterRegex: RegExp | undefined;
};

export const { Provider: FilterRegexProvider, useStore: useFilterRegexStore } =
  createZustandProvider<SourceCitationsData>(
    () => ({
      filterRegex: undefined,
    }),
    {
      shallowComparison: false,
      name: "FilterRegex",
    },
  );
