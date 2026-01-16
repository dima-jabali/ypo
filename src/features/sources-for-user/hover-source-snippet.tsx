import { memo } from "react";
import { titleCase } from "scule";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/HoverCard";
import { matchIcon } from "#/icons/match-icon";
import type { SourceForUserType } from "#/types/chat";
import { type SourceMainValues } from "./get-source-main-values";
import type { NormalizedSource } from "./get-top-n-sources";

type Props = {
  sourceMainValues: SourceMainValues<SourceForUserType, NormalizedSource["values_type"]>;
};

export const HoverSourceSnippet = memo(function HoverSourceSnippet({ sourceMainValues }: Props) {
  const { titleString, titleJSX, descriptionString, descriptionJSX } = sourceMainValues;

  // If no description is available, no need to open the hover card to show nothing:
  const hasDescription = Boolean(descriptionString || descriptionJSX);
  const props = hasDescription ? undefined : { open: false };

  return (
    <HoverCard {...props}>
      <HoverCardTrigger asChild>
        <li className="flex flex-[1_0_150px] max-w-full min-w-56 gap-2 items-center justify-start border border-border-smooth rounded-full px-2 py-1 bg-user-sources button-hover cursor-default h-[30px] break-normal text-muted">
          <div className="flex max-w-4 max-h-4 overflow-hidden flex-none">
            {matchIcon(sourceMainValues.normalizedSource.source_type)}
          </div>

          {titleJSX || titleString}
        </li>
      </HoverCardTrigger>

      <HoverCardContent className="flex flex-col w-72 max-h-72 p-0" sideOffset={5} side="top">
        <header className="flex items-start justify-between gap-3 w-full p-3">
          <p className="line-clamp-2 text-sm font-bold text-primary" title={titleString}>
            {titleString}
          </p>

          {matchIcon(sourceMainValues.normalizedSource.source_type, "size-7")}
        </header>

        <hr className="border-border-smooth " />

        {descriptionJSX ? (
          <div className="px-3 py-2 simple-scrollbar">{descriptionJSX}</div>
        ) : (
          <article className="simple-scrollbar w-full h-full max-h-full px-3 flex flex-col gap-1">
            <p className="font-bold pt-2 pb-1 text-primary">Description</p>

            <span>{descriptionString}</span>

            <div className="h-3 flex-none"></div>
          </article>
        )}

        <hr className="border-border-smooth " />

        <footer className="flex flex-col gap-1 px-3 py-2 text-xs">
          <section className="flex gap-2 justify-between">
            <span>Type</span>

            <i className="text-primary">
              {titleCase(sourceMainValues.normalizedSource.source_type.toLowerCase())}
            </i>
          </section>
        </footer>
      </HoverCardContent>
    </HoverCard>
  );
});
