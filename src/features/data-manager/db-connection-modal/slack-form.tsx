import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog";

export const SlackForm: React.FC = () => {
	return (
		<>
			<DialogHeader>
				<DialogTitle>Add Slack Connection</DialogTitle>
			</DialogHeader>

			<DialogDescription>
				To add a Slack connection, you need to to authorize BetterBrain to
				connect to your desired Slack&apos;s workspace.
			</DialogDescription>
		</>
	);
};
