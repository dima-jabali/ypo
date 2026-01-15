import { RadioGroup } from "radix-ui";
import { titleCase } from "scule";

import { SettingValues } from "./common";
import { SettingsModalTab } from "./utils";
import {
	InheritanceType,
	type DetailsType,
	type SettingsBase,
} from "#/hooks/fetch/use-fetch-settings";

type Props = {
	activeTab: SettingsModalTab;
	setting: SettingsBase;
	handleOnChange(type: DetailsType): void;
};

const ALLOWED_VALUES = [SettingValues.True, SettingValues.False];

export const BooleanRadio: React.FC<Props> = ({
	activeTab,
	setting,
	handleOnChange,
}) => {
	return (
		<RadioGroup.Root
			className="flex h-8 items-center justify-center rounded-lg bg-bg-muted p-1 text-muted-foreground"
			onChange={() => handleOnChange(setting.details.type)}
			name={setting.key}
			defaultValue={
				setting.inheritance_type === InheritanceType.DEFAULT
					? SettingValues.Default
					: setting.value === true
						? SettingValues.True
						: SettingValues.False
			}
		>
			<RadioGroup.RadioGroupItem value={SettingValues.Default} asChild>
				<button className="rounded-md px-3 py-0.5 text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-popover data-[state=checked]:text-primary data-[state=checked]:shadow-xs w-full h-full flex button-hover">
					{activeTab === SettingsModalTab.Organization
						? SettingValues.Default
						: "Inherit"}
				</button>
			</RadioGroup.RadioGroupItem>

			{ALLOWED_VALUES.map((value) => (
				<RadioGroup.RadioGroupItem key={value} value={value} asChild>
					<button className="rounded-md px-3 py-0.5 text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-popover data-[state=checked]:text-primary data-[state=checked]:shadow-xs first-letter:uppercase w-full button-hover">
						{titleCase(value.toLowerCase())}
					</button>
				</RadioGroup.RadioGroupItem>
			))}
		</RadioGroup.Root>
	);
};
