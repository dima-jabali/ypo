import { Input } from "#/components/Input";
import { type DetailsType, type SettingsBase } from "#/hooks/fetch/use-fetch-settings";

type Props = {
  setting: SettingsBase;
  handleOnChange(type: DetailsType): void;
};

export function StringInput({ setting, handleOnChange }: Props) {
  return (
    <Input
      className="relative flex min-h-8 h-fit items-center justify-center rounded-lg p-1 text-muted"
      onChange={() => handleOnChange(setting.details.type)}
      defaultValue={setting.value as string}
      name={setting.key}
    />
  );
}
