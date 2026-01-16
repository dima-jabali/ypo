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

export function EnumRadio({ activeTab, setting, handleOnChange }: Props) {
  const allowedValues = setting.details.allowed_values;

  return (
    <RadioGroup.Root
      className="relative flex min-h-8 h-fit items-center justify-center rounded-lg bg-bg-muted p-1 text-muted-foreground data-[flex-col=true]:flex-col"
      onChange={() => handleOnChange(setting.details.type)}
      data-flex-col={(allowedValues?.length ?? 0) > 2}
      name={setting.key}
      defaultValue={
        setting.inheritance_type === InheritanceType.DEFAULT
          ? SettingValues.Default
          : (setting.value as string)
      }
    >
      <RadioGroup.RadioGroupItem value={SettingValues.Default} asChild>
        <button className="rounded-md px-3 py-0.5 text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-popover data-[state=checked]:text-primary data-[state=checked]:shadow-xs capitalize w-full h-full flex button-hover">
          {activeTab === SettingsModalTab.Organization ? SettingValues.Default : "Inherit"}
        </button>
      </RadioGroup.RadioGroupItem>

      {allowedValues?.map((value) => (
        <RadioGroup.RadioGroupItem key={value} value={value} asChild>
          <button className="rounded-md px-3 py-0.5 text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-popover data-[state=checked]:text-primary data-[state=checked]:shadow-xs capitalize w-full h-full flex button-hover">
            {titleCase(value.toLowerCase())}
          </button>
        </RadioGroup.RadioGroupItem>
      ))}
    </RadioGroup.Root>
  );
}
