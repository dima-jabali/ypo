import { createZustandProvider } from "#/contexts/create-zustand-provider";
import type { BlockLabel, BlockType, NotebookBlockUuid } from "#/types/notebook";
import { DEFAULT_FILTER_RESULTS } from "../../utils/utils";

export type FilterResult = {
  icon: React.ReactNode;
  blockType: BlockType;
  subtype: BlockLabel;
  title: string;
};

type Data = {
  anchor: {
    blockAboveUuid: NotebookBlockUuid | null;
    style: { top: number };
  };
  filterResults: FilterResult[];
  filterRawString: string;
  isOpen: boolean;

  close: () => void;
};

export const { Provider: SlashProvider, useStore: useSlashStore } = createZustandProvider<Data>(
  (_get, set) => ({
    filterResults: DEFAULT_FILTER_RESULTS,
    filterRawString: "",
    isOpen: false,
    anchor: {
      blockAboveUuid: null,
      style: {
        left: 0,
        top: 0,
      },
    },

    close() {
      set({
        anchor: { blockAboveUuid: null, style: { top: 0 } },
        filterResults: DEFAULT_FILTER_RESULTS,
        filterRawString: "",
        isOpen: false,
      });
    },
  }),
  {
    name: "SlashProvider",
  },
);
