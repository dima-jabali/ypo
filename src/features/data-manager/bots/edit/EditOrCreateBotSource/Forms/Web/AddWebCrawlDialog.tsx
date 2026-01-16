import { CheckCircleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { CreateWebCrawlDialog } from "./CreateWebCrawlDialog";
import type { WebCrawl } from "#/types/bot-source";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "#/components/Dialog";
import { Button, ButtonVariant } from "#/components/Button";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";
import { useFetchWebCrawlsPage } from "#/hooks/fetch/use-fetch-web-crawls-page";
import { noop } from "#/helpers/utils";

type Props = {
  selectedWebCrawls: WebCrawl[];
  setSelectedWebCrawls: React.Dispatch<React.SetStateAction<WebCrawl[]>>;
};

export function AddWebCrawlDialog({ selectedWebCrawls, setSelectedWebCrawls }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const fetchWebcrawlsPageQuery = useFetchWebCrawlsPage();

  const handleSelectWebCrawl = (webcrawl: WebCrawl, isAlreadyAdded: boolean) => {
    setSelectedWebCrawls((prev) =>
      isAlreadyAdded
        ? prev.filter((prevWebcrawl) => prevWebcrawl.id !== webcrawl.id)
        : [...prev, webcrawl],
    );
  };

  const handleLoadMore = () => {
    if (!fetchWebcrawlsPageQuery.hasNextPage) return;

    fetchWebcrawlsPageQuery.fetchNextPage().catch(noop);
  };

  const { results: avaliableWebcralws, total } = fetchWebcrawlsPageQuery.data;

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogOverlay className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs" />

      <DialogTrigger asChild>
        <Button className="h-fit px-2 py-1 pr-3" variant={ButtonVariant.SUCCESS}>
          <PlusIcon className="size-5" />

          <p>Add Web Crawl</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[80vh] min-h-[55vh] w-[80vw] min-w-[50vw] flex-col gap-8 rounded-lg border border-border-smooth  bg-popover p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Select Web Crawls</DialogTitle>
        </DialogHeader>

        <article className="flex flex-col justify-between gap-4 text-sm tabular-nums text-primary">
          <p>
            Select the Web Crawls you want to add. Selected:{" "}
            <span className="font-bold">
              {selectedWebCrawls.length}/{total}
            </span>
          </p>
        </article>

        <ul className="simple-scrollbar flex max-h-[70vh] flex-nowrap gap-2 pb-2">
          {avaliableWebcralws.map((webcrawl) => {
            const isAlreadyAdded = selectedWebCrawls.some((item) => item.id === webcrawl.id);

            return (
              <article
                className="simple-scrollbar relative flex w-80 flex-none cursor-pointer flex-col gap-4 rounded-lg border-2 border-border-smooth p-2 pb-4 data-[is-added=true]:bg-slate-400/40 onfocus:bg-button-hover"
                onClick={() => handleSelectWebCrawl(webcrawl, isAlreadyAdded)}
                data-is-added={isAlreadyAdded}
                key={webcrawl.id}
              >
                <CheckCircleIcon
                  className="invisible absolute right-2 top-2 size-5 text-primary data-[is-added=true]:visible"
                  data-is-added={isAlreadyAdded}
                />

                <fieldset className="flex items-center gap-4">
                  <p className="text-sm font-bold">Name</p>

                  <Input defaultValue={webcrawl.name} className="mr-7" readOnly />
                </fieldset>

                <fieldset className="flex items-center gap-4">
                  <p className="whitespace-nowrap text-sm font-bold">Max results:</p>

                  <Input defaultValue={webcrawl.max_results} type="number" readOnly />
                </fieldset>

                <fieldset className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-bold">Description</p>

                  <StyledTextarea defaultValue={webcrawl.description} readOnly />
                </fieldset>

                <fieldset className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-bold">
                    Start URLs
                    <span className="font-normal tabular-nums">
                      {" "}
                      ({webcrawl.start_urls.length})
                    </span>
                    :
                  </p>

                  {webcrawl.start_urls.map((startURL) => (
                    <Input defaultValue={startURL} className="w-full" key={startURL} readOnly />
                  ))}
                </fieldset>

                <fieldset className="flex flex-col gap-1 text-left">
                  <p className="text-sm font-bold">
                    Websites
                    <span className="font-normal tabular-nums"> ({webcrawl.websites.length})</span>:
                  </p>

                  {webcrawl.websites.map((website) => (
                    <Input defaultValue={website.website_url} key={website.id} readOnly />
                  ))}
                </fieldset>
              </article>
            );
          })}
        </ul>

        <DialogFooter className="mt-auto flex w-full items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <CreateWebCrawlDialog setSelectedWebCrawls={setSelectedWebCrawls} />

            <Button
              title={
                fetchWebcrawlsPageQuery.hasNextPage
                  ? "Load more Web Crawls"
                  : "There are no more Web Crawls to load"
              }
              isLoading={fetchWebcrawlsPageQuery.isFetchingNextPage}
              aria-disabled={!fetchWebcrawlsPageQuery.hasNextPage}
              variant={ButtonVariant.GHOST}
              onClick={handleLoadMore}
            >
              Load{fetchWebcrawlsPageQuery.isFetchingNextPage ? "ing" : ""} more
              {fetchWebcrawlsPageQuery.isFetchingNextPage ? "..." : ""}
            </Button>
          </div>

          <Button variant={ButtonVariant.PURPLE} onClick={() => setIsOpen(false)}>
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
