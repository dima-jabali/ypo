import { GeneralFileIndexStatus } from "#/types/notebook";

export const matchIndexStatusColor = (indexStatus: GeneralFileIndexStatus | null) => {
  switch (indexStatus) {
    case "Indexing Text" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.INDEXING_TEXT:
      return "bg-purple-900 text-purple-300";

    case "Storing Text" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.STORING_TEXT:
      return "bg-teal-900 text-teal-300";

    case "Summarizing Text" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.SUMMARIZING_TEXT:
      return "bg-yellow-900 text-yellow-300";

    case "Processing Complete" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.PROCESSING_COMPLETE:
      return "bg-green-900 text-green-300";

    case "Parsing Unstructured Data" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.PARSING_UNSTRUCTURED_DATA:
      return "bg-blue-900 text-link";

    case "Not Started" as GeneralFileIndexStatus:
    case GeneralFileIndexStatus.NOT_STARTED:
      return "bg-stone-700 text-white";

    default:
      return "bg-stone-700 text-white";
  }
};
