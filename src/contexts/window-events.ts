export enum CustomWindowEvents {
  CloseSourcesDrawer = "close-sources-drawer",
  OpenSourcesDrawer = "open-sources-drawer",
}

export function sendOpenSourcesDrawerEvent() {
  window.dispatchEvent(new CustomEvent(CustomWindowEvents.OpenSourcesDrawer));
}

export function sendCloseSourcesDrawerEvent() {
  window.dispatchEvent(new CustomEvent(CustomWindowEvents.CloseSourcesDrawer));
}
