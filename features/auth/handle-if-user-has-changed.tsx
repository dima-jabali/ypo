import { authStore } from "#/contexts/auth/auth";
import { generalContextStore } from "#/contexts/general-ctx/general-context";
import { useFetchBetterbrainUser } from "#/hooks/fetch/use-fetch-betterbrain-user";

export function HandleIfUserHasChanged({ children }: React.PropsWithChildren) {
	const isUsingLocalClerk = authStore.use.isUsingLocalClerk();

	return isUsingLocalClerk ? (
		children
	) : (
		<CheckIfUserHasChanged>{children}</CheckIfUserHasChanged>
	);
}

function CheckIfUserHasChanged({ children }: React.PropsWithChildren) {
	const prevUserId = generalContextStore.use.userId();
	const betterbrainUser = useFetchBetterbrainUser();

	const hasPrevUserId = !!prevUserId;

	if (hasPrevUserId && betterbrainUser.id !== prevUserId) {
		console.log("User has changed, resetting generalContextStore", {
			prevState: generalContextStore.getState(),
			betterbrainUser,
			prevUserId,
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
