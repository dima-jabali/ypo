import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type PropsWithChildren, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export function EmptyFallbackSuspense({ children }: PropsWithChildren) {
	return (
		<Suspense fallback={null}>
			<QueryErrorResetBoundary>
				<ErrorBoundary fallback={null}>{children}</ErrorBoundary>
			</QueryErrorResetBoundary>
		</Suspense>
	);
}
