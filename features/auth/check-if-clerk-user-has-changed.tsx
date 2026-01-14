import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";

export function CheckIfClerkUserHasChanged({
	children,
}: React.PropsWithChildren) {
	const prevUserId = generalContextStore.use.userId();
	const betterbrainUser = useFetchBetterbrainUser();

	const hasPrevUserId = !!prevUserId;

	if (hasPrevUserId && betterbrainUser.id !== prevUserId) {
		console.log("Clerk user has changed, resetting generalContextStore", {
			prevUserId,
			betterbrainUser,
			prevState: generalContextStore.getState(),
		});

		generalContextStore.setState(generalContextStore.getInitialState());

		console.log(
			"generalContextStore after reset",
			generalContextStore.getState(),
		);
	} else if (!hasPrevUserId) {
		generalContextStore.setState({
			userId: betterbrainUser.id,
		});
	}

	return children;
}
