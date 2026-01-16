import { InfoIcon, Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button, ButtonVariant } from "#/components/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "#/components/Dialog";
import { Input } from "#/components/Input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { StyledTextarea } from "#/components/styled-text-area";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { getErrorMessage } from "#/helpers/utils";
import {
  useCreateWebCrawl,
  type CreateWebCrawlRequest,
} from "#/hooks/mutation/use-create-web-crawl";
import { useCurrentOrganization } from "#/hooks/use-current-organization";
import { useForceRender } from "#/hooks/use-force-render";
import type { WebCrawl } from "#/types/bot-source";

type Props = {
  setSelectedWebCrawls: React.Dispatch<React.SetStateAction<WebCrawl[]>>;
};

type FormDataEntries = {
  [Key in keyof Omit<CreateWebCrawlRequest, "organizationId" | "start_urls">]: string;
};

export const CreateWebCrawlDialog: React.FC<Props> = ({ setSelectedWebCrawls }) => {
  const currentOrganization = useCurrentOrganization();

  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const createWebCrawl = useCreateWebCrawl();
  const forceRender = useForceRender();

  const formRef = useRef<HTMLFormElement>(null);
  const excludeURLGlobsRef = useRef([""]);
  const includeURLGlobsRef = useRef([""]);
  const startURLsRef = useRef([""]);

  const handleRemoveWebcrawlStartURL = (index: number) => {
    startURLsRef.current.splice(index, 1);

    if (startURLsRef.current.length === 0) {
      startURLsRef.current.push("");
    }

    forceRender();
  };

  const handleAddStartURL = () => {
    startURLsRef.current.push("");

    forceRender();
  };

  const handleUpdateStartURL = (index: number, value: string) => {
    startURLsRef.current[index] = value;
  };

  const handleRemoveIncludeURLGlob = (index: number) => {
    includeURLGlobsRef.current.splice(index, 1);

    forceRender();
  };

  const handleAddIncludeURLGlob = () => {
    includeURLGlobsRef.current.push("");

    forceRender();
  };

  const handleUpdateIncludeURLGlob = (index: number, value: string) => {
    includeURLGlobsRef.current[index] = value;
  };

  const handleRemoveExcludeURLGlob = (index: number) => {
    excludeURLGlobsRef.current.splice(index, 1);

    forceRender();
  };

  const handleAddExcludeURLGlob = () => {
    excludeURLGlobsRef.current.push("");

    forceRender();
  };

  const handleUpdateExcludeURLGlob = (index: number, value: string) => {
    excludeURLGlobsRef.current[index] = value;
  };

  const handleSendForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    if (!currentOrganization) {
      toast({
        variant: ToastVariant.Destructive,
        title: "No organization selected!",
      });

      return;
    }

    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries()) as FormDataEntries;

    const startURLs = startURLsRef.current.filter(Boolean);

    if (startURLs.length === 0) {
      toast({
        variant: ToastVariant.Destructive,
        title: "No start URLs provided!",
      });

      return;
    }

    const args: CreateWebCrawlRequest = {
      ...data,
      dynamic_content_wait_seconds: Number(data.dynamic_content_wait_seconds) || 0.01,
      include_url_globs: includeURLGlobsRef.current.filter(Boolean),
      exclude_url_globs: excludeURLGlobsRef.current.filter(Boolean),
      initial_concurrency: Number(data.initial_concurrency) || 1,
      max_concurrency: Number(data.max_concurrency) || 1,
      max_crawl_depth: Number(data.max_crawl_depth) || 1,
      aggressive_prune: data.aggressive_prune === "on",
      max_results: Number(data.max_results) || 1,
      use_sitemaps: data.use_sitemaps === "on",
      max_pages: Number(data.max_pages) || 1,
      organizationId: currentOrganization.id,
      description: data.description || "",
      run: data.run === "on",
      start_urls: startURLs,
      name: data.name,
    };

    try {
      setIsLoading(true);

      const newWebcrawl = await createWebCrawl.mutateAsync(args);

      setSelectedWebCrawls((prev) => {
        if (!newWebcrawl) {
          return prev;
        }

        const index = prev.findIndex((s) => s.id === newWebcrawl.id);

        if (index === -1) {
          return [newWebcrawl, ...prev];
        }

        const next = prev.with(index, newWebcrawl);

        return next;
      });

      toast({
        title: "Successfully created Web Crawl!",
        variant: ToastVariant.Success,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Error creating Web Crawl:", error);

      toast({
        description: getErrorMessage(error),
        title: "Error creating Web Crawl!",
        variant: ToastVariant.Destructive,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogOverlay className="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs" />

      <DialogTrigger asChild>
        <Button variant={ButtonVariant.GHOST}>Create a new Web Crawl</Button>
      </DialogTrigger>

      <DialogContent className="simple-scrollbar flex max-h-[80vh] w-[80vw] flex-col justify-between gap-1 rounded-[8px] border border-border-smooth  p-4 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Create Web Crawl</DialogTitle>
        </DialogHeader>

        <form
          className="mt-10 flex flex-col gap-4 p-4"
          onSubmit={(e) => handleSendForm(e)}
          id="webcrawl-form-id"
          ref={formRef}
        >
          <label className="flex items-center gap-4">
            <p className="text-sm font-bold">Name</p>

            <Input name="name" required />
          </label>

          <label className="flex items-center gap-4" htmlFor="max_results">
            <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
              Max results:
              <InfoPopover text="The maximum number of resulting web pages to store. The crawler will automatically finish after reaching this number. This setting is useful to prevent accidental crawler runaway. If both Max page and Max results are defined, then the crawler will finish when the first limit is reached. Note that the crawler skips pages with the canonical URL of a page that has already been crawled, hence it might crawl more pages than there are results." />
            </p>

            <Input
              placeholder="9999999"
              name="max_results"
              id="max_results"
              max={9999999}
              type="number"
              required
              min={0}
            />
          </label>

          <label className="flex flex-col gap-1 text-left">
            <p className="text-sm font-bold">Description</p>

            <StyledTextarea name="description" />
          </label>

          <label className="flex items-center gap-4">
            <p className="text-sm font-bold">Run</p>

            <Input name="run" type="checkbox" className="size-4" />
          </label>

          <label className="flex flex-col gap-1 text-left" htmlFor="start_urls">
            <p className="flex items-center gap-1 text-sm font-bold">
              Start URLs
              <span className="font-normal tabular-nums"> ({startURLsRef.current.length}):</span>
              <InfoPopover
                text={
                  <p>
                    One or more URLs of pages where the crawler will start.
                    <br />
                    <br />
                    By default, the Actor will also crawl sub-pages of these URLs. For example, for
                    start URL
                    <i className="font-mono"> https://example.com/blog</i>, it will crawl also{" "}
                    <i className="font-mono">
                      https://example.com/blog/post or https://example.com/blog/article
                    </i>
                    . The Include URLs (globs) option overrides this automation behavior.
                  </p>
                }
              />
            </p>

            <section className="flex flex-col gap-2 rounded-lg border border-border-smooth  p-2">
              {startURLsRef.current.map((startURL, startURLIndex) => (
                <div className="flex items-center gap-2" key={Math.random()}>
                  <Input
                    onChange={(e) => handleUpdateStartURL(startURLIndex, e.target.value)}
                    defaultValue={startURL}
                    type="url"
                  />

                  <Button
                    onClick={() => handleRemoveWebcrawlStartURL(startURLIndex)}
                    variant={ButtonVariant.DESTRUCTIVE}
                    title="Remove Start URL"
                    className="size-10 p-0"
                  >
                    <X className="size-5" />
                  </Button>
                </div>
              ))}

              <button
                className="flex w-fit flex-none items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-blue-500/30 px-2 py-1 pr-3 text-sm onfocus:bg-blue-500/70 active:bg-blue-500"
                onClick={handleAddStartURL}
                type="button"
              >
                <Plus className="size-5" />

                <p>Add Start URL</p>
              </button>
            </section>
          </label>

          <details className="rounded-lg border border-transparent p-2 open:border-border-smooth ">
            <summary className="cursor-pointer select-none text-sm">Advanced Configuration</summary>

            <section className="mt-8 flex flex-col gap-4 p-2">
              <label className="flex items-center gap-4" htmlFor="max_crawl_depth">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Max crawl depth:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        The maximum number of links starting from the start URL that the crawler
                        will recursively follow. The start URLs have depth 0, the pages linked
                        directly from the start URLs have depth 1, and so on.
                        <br />
                        <br />
                        This setting is useful to prevent accidental crawler runaway. By setting it
                        to 0, the Actor will only crawl the Start URLs.
                      </p>
                    }
                  />
                </p>

                <Input
                  name="max_crawl_depth"
                  id="max_crawl_depth"
                  placeholder="1"
                  type="number"
                  max={99}
                  min={0}
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="max_pages">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Max pages:
                  <InfoPopover text="The maximum number pages to crawl. It includes the start URLs, pagination pages, pages with no content, etc. The crawler will automatically finish after reaching this number. This setting is useful to prevent accidental crawler runaway." />
                </p>

                <Input
                  placeholder="10000"
                  name="max_pages"
                  id="max_pages"
                  type="number"
                  max={100000}
                  min={1}
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="dynamic_content_wait_seconds">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Dynamic content wait seconds:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        The maximum time to wait for dynamic page content to load. By default, it is
                        10 seconds. The crawler will continue either if this time elapses, or if it
                        detects the network became idle as there are no more requests for additional
                        resources.
                        <br />
                        <br />
                        Note that this setting is ignored for the raw HTTP client, because it
                        doesn&apos;t execute JavaScript or loads any dynamic resources.
                      </p>
                    }
                  />
                </p>

                <Input
                  name="dynamic_content_wait_seconds"
                  id="dynamic_content_wait_seconds"
                  defaultValue="10"
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={99}
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="initial_concurrency">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Initial concurrency:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        The initial number of web browsers or HTTP clients running in parallel. The
                        system scales the concurrency up and down based on the current CPU and
                        memory load. If the value is set to 0 (default), the Actor uses the default
                        setting for the specific crawler type.
                        <br />
                        <br />
                        Note that if you set this value too high, the Actor will run out of memory
                        and crash. If too low, it will be slow at start before it scales the
                        concurrency up.
                      </p>
                    }
                  />
                </p>

                <Input
                  name="initial_concurrency"
                  id="initial_concurrency"
                  defaultValue="0"
                  type="number"
                  max={16}
                  min={0}
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="max_concurrency">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Max concurrency:
                  <InfoPopover text="The maximum number of web browsers or HTTP clients running in parallel. This setting is useful to avoid overloading the target websites and to avoid getting blocked." />
                </p>

                <Input
                  name="max_concurrency"
                  id="max_concurrency"
                  defaultValue="200"
                  type="number"
                  max={200}
                  min={1}
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="expand_clickable_elements">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Expand clickable elements:
                  <InfoPopover text="A CSS selector matching DOM elements that will be clicked. This is useful for expanding collapsed sections, in order to capture their text content." />
                </p>

                <Input
                  defaultValue='[aria-expanded="false"]'
                  name="expand_clickable_elements"
                  id="expand_clickable_elements"
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="aggressive_prune">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Aggresive prune:
                </p>

                <Input
                  name="aggressive_prune"
                  id="aggressive_prune"
                  className="size-4"
                  type="checkbox"
                />
              </label>

              <label className="flex items-center gap-4" htmlFor="use_sitemaps">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Use sitemaps:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        If enabled, the crawler will look for{" "}
                        <a
                          className="text-link onfocus:underline"
                          href="https://en.wikipedia.org/wiki/Sitemaps"
                        >
                          Sitemaps
                        </a>{" "}
                        at the domains of the provided Start URLs and enqueue matching URLs
                        similarly as the links found on crawled pages. You can also reference a
                        sitemap.xml file directly by adding it as another Start URL (e.g.{" "}
                        <i className="font-mono">https://www.example.com/sitemap.xml</i>
                        )
                        <br />
                        <br />
                        This feature makes the crawling more robust on websites that support
                        Sitemaps, as it includes pages that might be not reachable from Start URLs.
                        Note that if a page is found via a Sitemap, it will have depth 1.
                      </p>
                    }
                  />
                </p>

                <Input name="use_sitemaps" className="size-4" id="use_sitemaps" type="checkbox" />
              </label>

              <section className="flex flex-col gap-1">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Include URL globs:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        Glob patterns matching URLs of pages that will be included in crawling.
                        <br />
                        <br />
                        Setting this option will disable the default Start URLs based scoping and
                        will allow you to customize the crawling scope yourself. Note that this
                        affects only links found on pages, but not Start URLs - if you want to crawl
                        a page, make sure to specify its URL in the Start URLs field.
                        <br />
                        <br />
                        For example,{" "}
                        <i className="font-mono">{"https://{store,docs}.example.com/**"}</i>
                        &nbsp;&nbsp; lets the crawler to access all URLs starting with{" "}
                        <i className="font-mono">https://store.example.com/</i> or{" "}
                        <i className="font-mono">https://docs.example.com/</i>, and{" "}
                        <i className="font-mono">{"https://example.com/**/*\\?*foo=*"}</i>
                        &nbsp; allows the crawler to access all URLs that contain foo query
                        parameter with any value.
                        <br />
                        <br />
                        Learn more about globs and test them{" "}
                        <a
                          href="https://www.digitalocean.com/community/tools/glob?comments=true&glob=https%3A%2F%2Fexample.com%2Fscrape_this%2F%2A%2A&matches=false&tests=https%3A%2F%2Fexample.com%2Ftools%2F&tests=https%3A%2F%2Fexample.com%2Fscrape_this%2F&tests=https%3A%2F%2Fexample.com%2Fscrape_this%2F123%3Ftest%3Dabc&tests=https%3A%2F%2Fexample.com%2Fdont_scrape_this"
                          className="text-link onfocus:underline"
                        >
                          here
                        </a>
                        .
                      </p>
                    }
                  />
                </p>

                <section className="flex flex-col gap-2 rounded-lg border border-border-smooth  p-2">
                  {includeURLGlobsRef.current.map((includeURLGlob, includeURLGlobIndex) => (
                    <div className="flex items-center gap-2" key={Math.random()}>
                      <Input
                        onChange={(e) =>
                          handleUpdateIncludeURLGlob(includeURLGlobIndex, e.target.value)
                        }
                        defaultValue={includeURLGlob}
                      />

                      <Button
                        onClick={() => handleRemoveIncludeURLGlob(includeURLGlobIndex)}
                        variant={ButtonVariant.DESTRUCTIVE}
                        title="Remove include URL glob"
                        className="size-10 p-0"
                      >
                        <X className="size-5" />
                      </Button>
                    </div>
                  ))}

                  <button
                    className="flex w-fit flex-none items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-blue-500/30 px-2 py-1 pr-3 text-sm onfocus:bg-blue-500/70 active:bg-blue-500"
                    onClick={handleAddIncludeURLGlob}
                    type="button"
                  >
                    <Plus className="size-5" />

                    <span>Add include URL glob</span>
                  </button>
                </section>
              </section>

              <section className="flex flex-col gap-1">
                <p className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
                  Exclude URL globs:
                  <InfoPopover
                    text={
                      <p className="tabular-nums">
                        Glob patterns matching URLs of pages that will be excluded from crawling.
                        Note that this affects only links found on pages, but not Start URLs, which
                        are always crawled.
                        <br />
                        <br />
                        For example,{" "}
                        <i className="font-mono">{"https://{store,docs}.example.com/**"}</i>{" "}
                        excludes all URLs starting with{" "}
                        <i className="font-mono">https://store.example.com/</i> or{" "}
                        <i className="font-mono">https://docs.example.com/</i>, and{" "}
                        <i className="font-mono">https://example.com/**/*\?*foo=*</i> &nbsp;
                        excludes all URLs that contain foo query parameter with any value.
                        <br />
                        <br />
                        Learn more about globs and test them{" "}
                        <a
                          href="https://www.digitalocean.com/community/tools/glob?comments=true&glob=https%3A%2F%2Fexample.com%2Fdont_scrape_this%2F%2A%2A&matches=false&tests=https%3A%2F%2Fexample.com%2Ftools%2F&tests=https%3A%2F%2Fexample.com%2Fdont_scrape_this%2F&tests=https%3A%2F%2Fexample.com%2Fdont_scrape_this%2F123%3Ftest%3Dabc&tests=https%3A%2F%2Fexample.com%2Fscrape_this"
                          className="text-link onfocus:underline"
                        >
                          here
                        </a>
                        .
                      </p>
                    }
                  />
                </p>

                <section className="flex flex-col gap-2 rounded-lg border border-border-smooth  p-2">
                  {excludeURLGlobsRef.current.map((excludeURLGlob, excludeURLGlobIndex) => (
                    <div className="flex items-center gap-2" key={Math.random()}>
                      <Input
                        onChange={(e) =>
                          handleUpdateExcludeURLGlob(excludeURLGlobIndex, e.target.value)
                        }
                        defaultValue={excludeURLGlob}
                      />

                      <Button
                        onClick={() => handleRemoveExcludeURLGlob(excludeURLGlobIndex)}
                        variant={ButtonVariant.DESTRUCTIVE}
                        title="Remove exclude URL glob"
                        className="size-10 p-0"
                      >
                        <X className="size-5" />
                      </Button>
                    </div>
                  ))}

                  <button
                    className="flex w-fit flex-none items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-blue-500/30 px-2 py-1 pr-3 text-sm onfocus:bg-blue-500/70 active:bg-blue-500"
                    onClick={handleAddExcludeURLGlob}
                    type="button"
                  >
                    <Plus className="size-5" />

                    <span>Add exclude URL glob</span>
                  </button>
                </section>
              </section>
            </section>
          </details>
        </form>

        <DialogFooter>
          <Button
            variant={ButtonVariant.SUCCESS}
            form="webcrawl-form-id"
            isLoading={isLoading}
            className="mt-auto"
            type="submit"
          >
            Creat{isLoading ? "ing..." : "e"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoPopover: React.FC<{ text: React.ReactNode }> = ({ text }) => {
  return (
    <Popover>
      <PopoverTrigger className="rounded-full button-hover" title="Info">
        <InfoIcon className="size-5 stroke-primary" />
      </PopoverTrigger>

      <PopoverContent
        className="simple-scrollbar z-50 flex min-w-60 max-w-md flex-col gap-[1px] rounded-sm border-2 border-border-smooth  bg-[rgb(56,56,73)] p-4 text-sm shadow-2xl shadow-black scrollbar-width-2"
        align="center"
        side="top"
      >
        {text}
      </PopoverContent>
    </Popover>
  );
};
