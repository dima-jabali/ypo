import { App } from "#/app.client";
import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import type { Route } from "../+types/root";
import { action as allActions } from "./actions";

// eslint-disable-next-line react-refresh/only-export-components
export async function action(actionArgs: Route.ActionArgs) {
	return allActions(actionArgs);
}

export default function Home() {
	return (
		<DefaultSuspenseAndErrorBoundary
			failedText="Error on main app"
			fallbackFor="Home"
		>
			<App />
		</DefaultSuspenseAndErrorBoundary>
	);
}
