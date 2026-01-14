import { type ComponentProps, type PropsWithChildren } from "react";

import { DialogDescription } from "#/components/Dialog";
import { Input } from "#/components/Input";
import { StyledTextarea } from "#/components/styled-text-area";

type Props = PropsWithChildren<
	{
		defaultDescription: string;
		defaultName: string;
	} & ComponentProps<"form">
>;

const MAX_TITLE_LENGTH = 100;

export function BaseBatchTableMetadataForm({
	defaultDescription,
	defaultName,
	children,
	...props
}: Props) {
	return (
		<>
			<DialogDescription>Edit your batch table metadata.</DialogDescription>

			<form className="flex max-w-full flex-col gap-8 mt-6" {...props}>
				<fieldset>
					<label className="flex flex-col gap-2">
						<span className="text-sm">
							Name<sup>*</sup>
						</span>

						<Input
							maxLength={MAX_TITLE_LENGTH}
							defaultValue={defaultName}
							placeholder="Name..."
							minLength={1}
							name="name"
							autoFocus
							required
						/>
					</label>
				</fieldset>

				<fieldset>
					<label className="flex max-w-full flex-col gap-2">
						<span className="text-sm">Description</span>

						<StyledTextarea
							defaultValue={defaultDescription}
							placeholder="Description..."
							className="resize-none"
							name="description"
						/>
					</label>
				</fieldset>

				{children}
			</form>
		</>
	);
}
