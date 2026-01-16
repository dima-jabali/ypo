import { Loader } from "#/components/Loader";
import { matchIcon } from "#/icons/match-icon";
import type { DatabaseConnectionType } from "#/types/databases";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { IconType } from "./types";

const RightArrowIcon = <ChevronRightIcon className="size-4 flex-none stroke-primary" />;
const DownArrowIcon = <ChevronDownIcon className="size-4 flex-none stroke-primary" />;
const EmptySpace = <span className="-m-0.5 h-4 w-0 flex-none" />;
const LoaderIcon = <Loader className="size-4 border-t-primary" />;

export function getSchemaTreeIcon(
  isOpen: boolean,
  isLoading: boolean,
  isAParent: boolean,
  type: DatabaseConnectionType | IconType,
) {
  let secondIcon = EmptySpace;
  let firstIcon = EmptySpace;

  if (isAParent) {
    secondIcon = matchIcon(type);

    if (isLoading) {
      firstIcon = LoaderIcon;
    } else if (isOpen) {
      firstIcon = DownArrowIcon;
    } else {
      firstIcon = RightArrowIcon;
    }
  } else if (isLoading) {
    secondIcon = LoaderIcon;
    firstIcon = EmptySpace;
  } else {
    secondIcon = matchIcon(type);
  }

  return (
    <>
      {firstIcon}

      {secondIcon}
    </>
  );
}
