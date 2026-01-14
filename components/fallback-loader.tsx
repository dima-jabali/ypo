// import { QueryErrorResetBoundary } from "@tanstack/react-query";
// import { memo, Suspense, useState, type PropsWithChildren } from "react";
// import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

// import { cn } from "@/lib/utils";
// import { Loader } from "./Loader";
// import { Button } from "./ui/button";

// export function FallbackLoader({
//   fallbackTextClassName,
//   withLoader = true,
//   fallbackText,
//   fallbackFor,
//   className,
//   ...rest
// }: React.ComponentProps<"div"> & {
//   fallbackTextClassName?: string | undefined;
//   fallbackText?: string | undefined;
//   withLoader?: boolean | undefined;
//   fallbackFor: string;
// }) {
//   return (
//     <div
//       className={cn("w-full h-full flex flex-col gap-2 items-center justify-center", className)}
//       data-fallback-for={fallbackFor}
//       contentEditable={false}
//       title="Loading..."
//       {...rest}
//     >
//       {withLoader ? <Loader /> : null}

//       {fallbackText ? (
//         <p contentEditable={false} className={fallbackTextClassName}>
//           {fallbackText}
//         </p>
//       ) : null}
//     </div>
//   );
// }

// FallbackLoader.whyDidYouRender = true;

// export function LoadError({
//   failedClassName,
//   fallbackFor,
//   failedText,
//   error,
//   ...rest
// }: {
//   failedClassName?: string | undefined;
//   error?: Error | undefined;
//   fallbackFor: string;
//   failedText: string;
// } & React.ComponentProps<"div">) {
//   const { resetBoundary } = useErrorBoundary();

//   console.error("Error in", fallbackFor, error);

//   const isUnauthorizedError =
//     error?.message.startsWith("Unauthorized") ||
//     error?.message.startsWith("Notebook does not belong");

//   function retryFromScratch() {
//     // generalContextStore.setState(generalContextStore.getInitialState());
//     resetBoundary();
//   }

//   return (
//     <div
//       className={cn(
//         "text-primary text-sm relative rounded-lg before:inset-0 before:bg-white bg-red-300/30 p-4 flex flex-col items-center justify-center gap-4 w-full h-full",
//         failedClassName,
//       )}
//       {...rest}
//     >
//       <span>{failedText}</span>

//       <details className="text-xs">
//         <summary
//           className="cursor-pointer max-w-full simple-scrollbar flex"
//           title="Open to see error stack"
//         >
//           {error?.message}
//         </summary>

//         <div
//           className="max-w-full simple-scrollbar rounded-md bg-destructive/30 p-4 flex flex-col gap-3"
//           title="Error stack"
//         >
//           <Button onClick={retryFromScratch} size="sm">
//             Retry from scratch
//           </Button>

//           <pre className="whitespace-pre-wrap">{error?.stack}</pre>
//         </div>
//       </details>

//       {isUnauthorizedError ? (
//         <Button onClick={retryFromScratch} size="sm">
//           Retry from scratch
//         </Button>
//       ) : (
//         <Button onClick={resetBoundary} size="sm">
//           Retry
//         </Button>
//       )}
//     </div>
//   );
// }

// LoadError.whyDidYouRender = true;

// export const DefaultSuspenseAndErrorBoundary = memo(function DefaultSuspenseAndErrorBoundary({
//   fallbackTextClassName,
//   fallbackClassName,
//   failedClassName,
//   fallbackText,
//   fallbackFor,
//   failedText,
//   withLoader,
//   children,
// }: PropsWithChildren<{
//   fallbackTextClassName?: string | undefined;
//   fallbackClassName?: string | undefined;
//   failedClassName?: string | undefined;
//   fallbackText?: string | undefined;
//   withLoader?: boolean | undefined;
//   fallbackFor: string;
//   failedText: string;
// }>) {
//   const [error, setError] = useState<Error | undefined>(undefined);

//   if (error) {
//     console.error(error);
//   }

//   return (
//     <Suspense
//       fallback={
//         <FallbackLoader
//           fallbackTextClassName={fallbackTextClassName}
//           className={fallbackClassName}
//           fallbackText={fallbackText}
//           fallbackFor={fallbackFor}
//           withLoader={withLoader}
//         />
//       }
//     >
//       <QueryErrorResetBoundary>
//         {({ reset }) => (
//           <ErrorBoundary
//             fallback={
//               <LoadError
//                 failedClassName={failedClassName}
//                 fallbackFor={fallbackFor}
//                 failedText={failedText}
//                 error={error}
//               />
//             }
//             onError={(error) => setError(error)}
//             onReset={reset}
//           >
//             {children}
//           </ErrorBoundary>
//         )}
//       </QueryErrorResetBoundary>
//     </Suspense>
//   );
// });


import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { memo, Suspense, useState, type PropsWithChildren } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

import { Button, LOADER } from "#/components/Button";
import { classNames } from "#/helpers/class-names";
import type { DivProps } from "#/types/react";
import { generalContextStore } from "#/contexts/general-ctx/general-context";

export function FallbackLoader({
	fallbackTextClassName,
	withLoader = true,
	fallbackText,
	fallbackFor,
	className,
	...rest
}: DivProps & {
	fallbackTextClassName?: string | undefined;
	fallbackText?: string | undefined;
	withLoader?: boolean | undefined;
	fallbackFor: string;
}) {
	return (
		<div
			className={classNames(
				"w-full h-full flex flex-col gap-2 items-center justify-center",
				className,
			)}
			data-fallback-for={fallbackFor}
			contentEditable={false}
			title="Loading..."
			{...rest}
		>
			{withLoader ? LOADER : null}

			{fallbackText ? (
				<p contentEditable={false} className={fallbackTextClassName}>
					{fallbackText}
				</p>
			) : null}
		</div>
	);
}

FallbackLoader.whyDidYouRender = true;

export function LoadError({
	failedClassName,
	fallbackFor,
	failedText,
	error,
	...rest
}: {
	failedClassName?: string | undefined;
	error?: Error | undefined;
	fallbackFor: string;
	failedText: string;
} & DivProps) {
	const { resetBoundary } = useErrorBoundary();

	console.error("Error in", fallbackFor, error);

	const isUnauthorizedError =
		error?.message.startsWith("Unauthorized") ||
		error?.message.startsWith("Notebook does not belong");

	function retryFromScratch() {
		generalContextStore.setState(generalContextStore.getInitialState());
		resetBoundary();
	}

	return (
		<div
			className={classNames(
				"text-primary text-sm relative rounded-lg before:inset-0 before:bg-white bg-red-300/30 p-4 flex flex-col items-center justify-center gap-4 w-full h-full",
				failedClassName,
			)}
			{...rest}
		>
			<span>{failedText}</span>

			<details className="text-xs">
				<summary
					className="cursor-pointer max-w-full simple-scrollbar flex"
					title="Open to see error stack"
				>
					{error?.message}
				</summary>

				<div
					className="max-w-full simple-scrollbar rounded-md bg-destructive/30 p-4 flex flex-col gap-3"
					title="Error stack"
				>
					<Button onClick={retryFromScratch} size="sm">
						Retry from scratch
					</Button>

					<pre className="whitespace-pre-wrap">{error?.stack}</pre>
				</div>
			</details>

			{isUnauthorizedError ? (
				<Button onClick={retryFromScratch} size="sm">
					Retry from scratch
				</Button>
			) : (
				<Button onClick={resetBoundary} size="sm">
					Retry
				</Button>
			)}
		</div>
	);
}

LoadError.whyDidYouRender = true;

export const DefaultSuspenseAndErrorBoundary = memo(
	function DefaultSuspenseAndErrorBoundary({
		fallbackTextClassName,
		fallbackClassName,
		failedClassName,
		fallbackText,
		fallbackFor,
		failedText,
		withLoader,
		children,
	}: PropsWithChildren<{
		fallbackTextClassName?: string | undefined;
		fallbackClassName?: string | undefined;
		failedClassName?: string | undefined;
		fallbackText?: string | undefined;
		withLoader?: boolean | undefined;
		fallbackFor: string;
		failedText: string;
	}>) {
		const [error, setError] = useState<Error | undefined>(undefined);

		if (error) {
			console.error(error);
		}

		return (
			<Suspense
				fallback={
					<FallbackLoader
						fallbackTextClassName={fallbackTextClassName}
						className={fallbackClassName}
						fallbackText={fallbackText}
						fallbackFor={fallbackFor}
						withLoader={withLoader}
					/>
				}
			>
				<QueryErrorResetBoundary>
					{({ reset }) => (
						<ErrorBoundary
							fallback={
								<LoadError
									failedClassName={failedClassName}
									fallbackFor={fallbackFor}
									failedText={failedText}
									error={error}
								/>
							}
							onError={(error) => setError(error)}
							onReset={reset}
						>
							{children}
						</ErrorBoundary>
					)}
				</QueryErrorResetBoundary>
			</Suspense>
		);
	},
);

DefaultSuspenseAndErrorBoundary.whyDidYouRender = true;
