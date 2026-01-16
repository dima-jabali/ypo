"use client";

import { useLayoutEffect } from "react";

import { DATASET_COLOR_SCHEME_NAME } from "#/helpers/utils";
import type { ColorScheme } from "#/types/general";
import { dataManagerStore } from "../data-manager";
import { databasesSchemaStore } from "../databases-schema";
import { droppedFiles } from "../dropped-files";
import { generalContextStore, MainPage } from "./general-context";

function applyTheme(theme: keyof typeof ColorScheme) {
  const htmlDataset = document.querySelector("html")?.dataset;

  if (!htmlDataset) {
    console.log("Unable to apply theme because there is no html dataset", theme);

    return;
  }

  htmlDataset[DATASET_COLOR_SCHEME_NAME] = theme;
}

export function GeneralContextListeners() {
  useLayoutEffect(() => {
    applyTheme(generalContextStore.getState().colorScheme);

    generalContextStore.setState((prev) => ({
      isNotebookMode: prev.mainPage === MainPage.Notebook,
      isChatMode: prev.mainPage === MainPage.Chats,
    }));

    const unsubs = [
      generalContextStore.subscribe(
        (state) => state.organizationId,
        (organizationId, prevOrganizationId) => {
          if (prevOrganizationId !== organizationId) {
            databasesSchemaStore.setState(databasesSchemaStore.getInitialState());
            dataManagerStore.setState(dataManagerStore.getInitialState());
            droppedFiles.clear();
          }
        },
      ),

      generalContextStore.subscribe(
        (state) => state.colorScheme,
        (colorScheme) => {
          applyTheme(colorScheme);
        },
      ),

      generalContextStore.subscribe(
        (state) => state.mainPage,
        (mainPage) => {
          generalContextStore.setState({
            isNotebookMode: mainPage === MainPage.Notebook,
            isChatMode: mainPage === MainPage.Chats,
          });
        },
      ),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  return null;
}
