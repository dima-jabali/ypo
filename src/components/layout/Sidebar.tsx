"use client";

import { PanelLeft } from "lucide-react";
import { memo } from "react";

import { EmptyFallbackSuspense } from "#/components/empty-fallback-suspense";
import { WithOrganizationIdAndList } from "#/components/with-organization-id-and-list";
import { generalContextStore, MainPage } from "#/contexts/general-ctx/general-context";
import { DefaultSuspenseAndErrorBoundary } from "@/components/fallback-loader";
import dynamic from "next/dynamic";

const NotebookListTab = dynamic(() =>
  import("#/components/layout/notebook-list-tab").then((module) => module.NotebookListTab),
);

function handleToggleTabsOpened() {
  generalContextStore.setState((prev) => ({
    keepSidebarOpen: !prev.keepSidebarOpen,
  }));
}

export const Sidebar = memo(function Sidebar() {
  if (typeof window === "undefined") {
    return null;
  }

  const brieflyKeepSidebarOpen = generalContextStore.use.brieflyKeepSidebarOpen();
  const keepSidebarOpen = generalContextStore.use.keepSidebarOpen();
  const organizationId = generalContextStore.use.organizationId();
  const mainPage = generalContextStore.use.mainPage();

  return (
    <>
      <div
        className="w-14 h-[calc(100vh-65px)] data-[is-open=true]:w-(--open-sidebar-width) pointer-events-none [grid-area:aside] z-0"
        data-is-open={keepSidebarOpen}
        data-placeholder-for-aside
        data-no-print
      ></div>

      {(() => {
        switch (mainPage) {
          case MainPage.Notebook:
          case MainPage.Chats: {
            return (
              <aside
                className="group fixed z-20 h-[calc(100vh-65px)] max-h-[calc(100vh-65px)] @container bg-aside w-14 hover:w-(--open-sidebar-width) transition-[width,opacity] duration-150 ease-out data-[is-open=true]:w-(--open-sidebar-width) flex flex-col gap-4 p-1 [box-shadow:0_0_10px_5px_#20202030]"
                data-is-open={keepSidebarOpen || brieflyKeepSidebarOpen}
                data-no-print
              >
                <div className="flex gap-4 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)] items-center justify-between">
                  <button
                    className="flex items-center justify-center button-hover rounded-lg w-12 p-2 flex-none"
                    onClick={handleToggleTabsOpened}
                    title="Keep menu opened"
                  >
                    <PanelLeft className="size-5 stroke-1 text-muted-foreground" />
                  </button>

                  {/*{organizationSelectorPlacement === OrganizationSelectorPlacement.IN_SIDEBAR ? (
                    <div className="@max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
                      <EmptyFallbackSuspense>
                        <WithOrganizationIdAndList>
                          <SetCurrentOrganizationPopover />
                        </WithOrganizationIdAndList>
                      </EmptyFallbackSuspense>
                    </div>
                  ) : null}*/}
                </div>

                <div className="flex flex-col w-full h-full overflow-hidden">
                  <EmptyFallbackSuspense key={organizationId}>
                    <DefaultSuspenseAndErrorBoundary
                      failedText="Failed to render notebook list tab"
                      fallbackFor="notebook list tab"
                      autoReset
                    >
                      <WithOrganizationIdAndList>
                        <NotebookListTab />
                      </WithOrganizationIdAndList>
                    </DefaultSuspenseAndErrorBoundary>
                  </EmptyFallbackSuspense>
                </div>

                {/*<ul className="flex w-full flex-col gap-2">
                  <div className="flex w-12 gap-1 group-data-[is-open=true]:w-[calc(var(--open-sidebar-width)-8px)]">
                    <div className="w-12 h-9 flex-none">
                      {isValidNumber(notebookId) ? (
                        <EmptyFallbackSuspense key={notebookId}>
                          <WithChatData fallback={null}>
                            <GeneralSettingsModal />
                          </WithChatData>
                        </EmptyFallbackSuspense>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center rounded-lg w-12 h-9 flex-none @max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
                      <EmptyFallbackSuspense key={notebookId}>
                        <WithChatData fallback={null}>
                          <ShareProjectModal />
                        </WithChatData>
                      </EmptyFallbackSuspense>
                    </div>

                    <div className="flex items-center justify-center rounded-lg w-12 h-9 flex-none @max-[14rem]:hidden @max-[15rem]:opacity-0 transition-[opacity] duration-75">
                      <EmptyFallbackSuspense>
                        <ToggleDarkModeButton />
                      </EmptyFallbackSuspense>
                    </div>

                    <MoreOptionsPopover />
                  </div>

                  <li className="flex aspect-square w-12 items-center justify-center">
                    {isUsingClerk ? <UserButton /> : null}
                  </li>
                </ul>*/}
              </aside>
            );
          }

          default: {
            console.error("Sidebar: Unknown main page:", mainPage);

            return null;
          }
        }
      })()}
    </>
  );
});
