export type BaseGeneralSettingsTabProps = {
	activeSettingOption: SettingsOptions;
	handleSetOpenSettingOptions: (option: SettingsOptions) => void;
};

export enum SettingsOptions {
	General = "General",
	Agent = "Agent",
}

export enum SettingValues {
	ChatGptView = "CHATGPT_VIEW",
	TableView = "TABLE_VIEW",
	Default = "Default",
	False = "False",
	True = "True",
}

export const ALL_SETTINGS_OPTIONS = Object.values(SettingsOptions);
