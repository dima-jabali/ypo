import { Moon, SunMedium } from "lucide-react";

import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { ColorScheme } from "#/types/general";
import {
  InheritanceType,
  SettingsEntity,
  SettingsKey,
  useJustFetchSettings,
} from "#/hooks/fetch/use-fetch-settings";
import { useSetSettings } from "#/hooks/mutation/use-set-settings";

export function ToggleDarkModeButton() {
  const colorScheme = generalContextStore.use.colorScheme();
  const setSettings = useSetSettings();

  useJustFetchSettings();

  // Toggle localStorage theme between 'dark' and 'light' then update the theme.
  function toggleTheme() {
    let nextTheme: typeof colorScheme = ColorScheme.dark;

    if (colorScheme === ColorScheme.dark) {
      nextTheme = ColorScheme.light;
    }

    generalContextStore.setState({ colorScheme: nextTheme });

    setSettings.mutate({
      updates: [
        {
          inheritance_type: InheritanceType.CUSTOM,
          key: SettingsKey.DEFAULT_COLOR_SCHEME,
          value: nextTheme.toUpperCase(),
          entity: SettingsEntity.USER,
        },
      ],
    });
  }

  return (
    <button
      className="button-hover rounded-lg text-sm p-2 w-12 h-9 flex items-center justify-center"
      title="Toggle color scheme"
      onClick={toggleTheme}
      id="theme-toggle"
      type="button"
    >
      {colorScheme === ColorScheme.dark ? (
        <Moon className="size-5 stroke-1 stroke-muted-foreground" />
      ) : (
        <SunMedium className="size-5 stroke-1 stroke-muted-foreground" />
      )}
    </button>
  );
}
