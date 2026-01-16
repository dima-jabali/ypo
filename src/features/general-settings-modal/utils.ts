import {
  DetailsType,
  InheritanceType,
  SettingsEntity,
  SettingsKey,
  type SettingsBase,
  type SettingsReturnType,
} from "#/hooks/fetch/use-fetch-settings";
import { SettingValues } from "./common";

export function matchSettingTypeClassName(type: DetailsType) {
  switch (type) {
    case DetailsType.JSON: {
      const CLASSNAME =
        "flex gap-2 flex-col even:bg-muted-strong rounded-lg p-2 first:pt-0 list-none";

      return CLASSNAME;
    }

    default: {
      const CLASSNAME =
        "flex gap-10 justify-between w-full even:bg-muted-strong rounded-lg p-2 first:pt-0 list-none";

      return CLASSNAME;
    }
  }
}

export const TIMEOUT_TO_SAVE_CHANGES = 300;

export const getInheritanceType = (newValue: unknown) =>
  newValue === SettingValues.Default ? InheritanceType.DEFAULT : InheritanceType.CUSTOM;

export function matchTabToSettingsEntity(tab: SettingsModalTab): SettingsEntity {
  switch (tab) {
    case SettingsModalTab.Organization:
      return SettingsEntity.ORGANIZATION;
    case SettingsModalTab.User:
      return SettingsEntity.USER;
    case SettingsModalTab.Project:
      return SettingsEntity.PROJECT;
  }
}

export enum SettingsModalTab {
  Organization = "Organization",
  User = "User",
  Project = "Project",
}

export const AGENT_SETTINGS = [SettingsKey.REQUIRE_APPROVAL_FOR_CONVERSATION_PLANS];
export const ALL_TABS = Object.values(SettingsModalTab);

export function convertTabToSettings(tab: SettingsModalTab): keyof SettingsReturnType {
  switch (tab) {
    case SettingsModalTab.Organization:
      return "organization_settings";
    case SettingsModalTab.User:
      return "user_settings";
    case SettingsModalTab.Project:
      return "project_settings";

    default:
      console.error("Invalid tab", { tab });
      return "organization_settings";
  }
}

export function matchSettingValue(value: unknown): SettingsBase["value"] {
  switch (value) {
    case SettingValues.True:
      return true;
    case SettingValues.False:
      return false;
    case SettingValues.Default:
      return undefined;
    default:
      return value as SettingsBase["value"];
  }
}
