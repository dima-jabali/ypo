import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog";
import { Input } from "#/components/Input";

export const YouTubeForm: React.FC<{
	formRef: React.RefObject<HTMLFormElement | null>;
}> = ({ formRef }) => {
	return (
		<>
			<DialogHeader>
				<DialogTitle>Add YouTube Connection</DialogTitle>
			</DialogHeader>

			<DialogDescription>
				To add a YouTube connection, you need to to authorize BetterBrain to
				connect to your desired YouTube&apos;s workspace.
			</DialogDescription>

			<form className="my-6 flex flex-col gap-4" ref={formRef}>
				<fieldset className="flex items-center gap-4">
					<label
						className="whitespace-nowrap font-bold"
						htmlFor="connection_name"
					>
						YouTube connection name:
					</label>

					<Input name="connection_name" id="connection_name" required />
				</fieldset>
			</form>
		</>
	);
};
