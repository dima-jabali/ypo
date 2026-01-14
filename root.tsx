// import "./wdyr";
import "./react-scan";

import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

import "./global-styles.css";

// eslint-disable-next-line react-refresh/only-export-components
export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://rsms.me/" },
	{
		rel: "stylesheet",
		href: "https://rsms.me/inter/inter.css",
	},
];

export function Layout({ children }: React.PropsWithChildren) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />

				<link rel="icon" type="image/svg+xml" href="/favicon.ico" />

				<meta name="viewport" content="width=device-width, initial-scale=1.0" />

				<title>BetterBrain</title>

				<Meta />

				<Links />
			</head>

			<body>
				{children}

				<ScrollRestoration />

				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let details = "An unexpected error occurred.";
	let stack: string | undefined;
	let message = "Oops!";

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>

			<p>{details}</p>

			{stack ? (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			) : null}
		</main>
	);
}
