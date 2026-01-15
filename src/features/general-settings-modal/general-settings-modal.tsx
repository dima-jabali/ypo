import { Cloud, Settings, X } from "lucide-react";
import { memo, useRef, useState } from "react";

import { Loader } from "#/components/Loader";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/Popover";
import { ToastVariant } from "#/components/Toast/ToastVariant";
import { toast } from "#/components/Toast/useToast";
import { useWithGeneralStoreNotebookId } from "#/contexts/general-ctx/general-context";
import { getErrorMessage } from "#/helpers/utils";
import { useUserRoleInCurrOrg } from "#/hooks/fetch/use-fetch-all-organizations";
import {
	DetailsType,
	SettingsKey,
	useFetchSettings,
	type SettingsBase,
} from "#/hooks/fetch/use-fetch-settings";
import {
	useSetSettings,
	type SetSettingsRequest,
} from "#/hooks/mutation/use-set-settings";
import { OrganizationMemberRole } from "#/types/notebook";
import { BooleanRadio } from "./boolean-radio";
import { ALL_SETTINGS_OPTIONS, SettingsOptions } from "./common";
import { EnumRadio } from "./enum-radio";
import { SettingsTree } from "./settings-tree";
import { StringInput } from "./string-input";
import {
	AGENT_SETTINGS,
	ALL_TABS,
	convertTabToSettings,
	getInheritanceType,
	matchSettingTypeClassName,
	matchSettingValue,
	matchTabToSettingsEntity,
	SettingsModalTab,
	TIMEOUT_TO_SAVE_CHANGES,
} from "./utils";

export const GeneralSettingsModal = memo(function GeneralSettingsModal() {
	const [activeSettingOption, setActiveSettingOption] = useState(
		SettingsOptions.General,
	);
	const [activeTab, setActiveTab] = useState(SettingsModalTab.User);
	const [isSaving, setIsSaving] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const timerToSaveChangesRef = useRef<NodeJS.Timeout>(undefined);
	const formRef = useRef<HTMLFormElement>(null);

	const notebookId = useWithGeneralStoreNotebookId();
	const userRole = useUserRoleInCurrOrg();
	const setSettings = useSetSettings();
	const settings = useFetchSettings();

	const generalSettings: SettingsBase[] = [];
	const agentSettings: SettingsBase[] = [];

	settings[convertTabToSettings(activeTab)]?.forEach((setting) => {
		if (
			setting.details.show_as_project_setting === false &&
			activeTab === SettingsModalTab.Project
		) {
			return;
		}

		if (
			setting.details.show_as_user_setting === false &&
			activeTab === SettingsModalTab.User
		) {
			return;
		}

		if (AGENT_SETTINGS.includes(setting.key)) {
			agentSettings.push(setting);
		} else {
			generalSettings.push(setting);
		}
	});

	function handleSetOpenSettingOptions(option: SettingsOptions) {
		setActiveSettingOption(option);
	}

	async function handleSaveChanges() {
		if (!formRef.current || !isOpen) return;

		const formData = new FormData(formRef.current);
		const entries = [...formData.entries()];

		try {
			setIsSaving(true);

			const newSettings: SetSettingsRequest = {
				project_id:
					activeTab === SettingsModalTab.Project ? notebookId : undefined,
				updates: entries.map(([key, value]) => ({
					entity: matchTabToSettingsEntity(activeTab),
					inheritance_type: getInheritanceType(value),
					value: matchSettingValue(value),
					key: key as SettingsKey,
				})),
			};

			await setSettings.mutateAsync(newSettings);
		} catch (error) {
			console.error("Error saving settings changes!", { error });

			toast({
				description: getErrorMessage(error),
				variant: ToastVariant.Destructive,
				title: "Error saving settings",
			});
		} finally {
			setIsSaving(false);
		}
	}

	function handleOnChange(type: DetailsType) {
		clearTimeout(timerToSaveChangesRef.current);

		timerToSaveChangesRef.current = setTimeout(
			handleSaveChanges,
			type === DetailsType.STRING ? 1_500 : TIMEOUT_TO_SAVE_CHANGES,
		);
	}

	function getActiveSettingOptions() {
		switch (activeSettingOption) {
			case SettingsOptions.Agent:
				return agentSettings;

			case SettingsOptions.General:
				return generalSettings;

			default:
				console.error("Invalid setting option", { activeSettingOption });
				return [];
		}
	}

	function renderSettingOptions(setting: SettingsBase) {
		switch (setting.details.type) {
			case DetailsType.BOOLEAN: {
				return (
					<BooleanRadio
						handleOnChange={handleOnChange}
						activeTab={activeTab}
						setting={setting}
					/>
				);
			}

			case DetailsType.ENUM: {
				return (
					<EnumRadio
						handleOnChange={handleOnChange}
						activeTab={activeTab}
						setting={setting}
					/>
				);
			}

			case DetailsType.JSON: {
				switch (setting.key) {
					case SettingsKey.TOOL_SETTINGS:
						return null;

					default:
						console.error("Invalid setting key for JSON", { setting });
						return null;
				}
			}

			case DetailsType.STRING: {
				return (
					<StringInput handleOnChange={handleOnChange} setting={setting} />
				);
			}

			default:
				console.error("Invalid setting type", { setting });
				return null;
		}
	}

	function makeSettingRow(setting: SettingsBase) {
		return (
			<li
				key={`${setting.key}${setting.inheritance_type}${setting.value}`}
				className={matchSettingTypeClassName(setting.details.type)}
			>
				<div className="flex gap-2 flex-col">
					<p className="text-sm">{setting.details.readable_name}</p>

					<p className="text-xs text-muted-foreground">
						{setting.details.description}
					</p>
				</div>

				{renderSettingOptions(setting)}
			</li>
		);
	}

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				className="flex flex-none h-9 w-12 items-center justify-center rounded-lg data-[state=open]:bg-button-active button-hover"
				title="General settings"
			>
				<Settings className="w-5 stroke-1 stroke-muted-foreground" />
			</PopoverTrigger>

			<PopoverContent
				className="flex flex-col rounded-lg p-3 w-[80vw] max-w-[600px] h-[70vh]"
				sideOffset={5}
				side="right"
				align="end"
			>
				<p className="text-3xl">Settings</p>

				{isOpen ? (
					<>
						<header className="flex mt-6 justify-between w-full">
							<ol className="flex flex-row! w-fit h-10 items-center justify-center rounded-lg bg-muted-strong p-1 text-muted-foreground">
								{ALL_TABS.filter((tab) => {
									// Only show Organization tab if user is an Admin

									if (tab === SettingsModalTab.Organization) {
										return userRole === OrganizationMemberRole.Admin;
									}

									return true;
								}).map((tab) => (
									<button
										className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[is-active=true]:bg-popover data-[is-active=true]:text-primary data-[is-active=true]:shadow-xs"
										data-is-active={activeTab === tab}
										onClick={() => setActiveTab(tab)}
										type="button"
										value={tab}
										key={tab}
									>
										{tab}
									</button>
								))}
							</ol>

							<div className="flex items-center self-end gap-1 text-primary">
								{isSaving ? (
									<Loader className="size-3 mr-1 border-t-primary" />
								) : setSettings.isError ? (
									<X className="size-4 stroke-destructive" />
								) : (
									<Cloud className="size-4" />
								)}

								<p
									className="min-w-max text-xs data-[is-error=true]:text-destructive"
									data-is-error={setSettings.isError}
								>
									{isSaving
										? "Saving..."
										: setSettings.isError
											? "Error saving, try again"
											: "Saved"}
								</p>
							</div>
						</header>

						<p className="text-xs text-muted-foreground mt-1.5">
							Project&apos;s settings overrides User&apos;s, which overrides
							Organization&apos;s.
						</p>

						<hr className="border-border-smooth  my-2" />

						<form className="flex w-full h-full overflow-hidden" ref={formRef}>
							<nav className="flex flex-col gap-10 justify-between border-r border-border-smooth  pr-2">
								<ul>
									{ALL_SETTINGS_OPTIONS.map((option) => (
										<SettingsTree
											onClick={handleSetOpenSettingOptions}
											activeItem={activeSettingOption}
											name={option}
											key={option}
										/>
									))}
								</ul>
							</nav>

							<main className="flex flex-col gap-6 w-full simple-scrollbar">
								<h2 className="text-xl pl-4">{activeSettingOption}</h2>

								<ul className="flex flex-col gap-2 w-full px-2">
									{getActiveSettingOptions().map(makeSettingRow)}
								</ul>
							</main>
						</form>
					</>
				) : null}
			</PopoverContent>
		</Popover>
	);
});
