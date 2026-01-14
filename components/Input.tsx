import { forwardRef } from "react";

import { classNames } from "#/helpers/class-names";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export interface InputWithIconsProps extends InputProps {
	wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
	iconRight?: React.ReactNode;
	iconLeft?: React.ReactNode;
	disabled?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type = "text", ...props }, ref) => {
		return (
			<input
				type={type}
				className={classNames(
					"flex h-10 w-full rounded-md border border-border-smooth bg-popover px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);

export const InputWithIcons = forwardRef<HTMLInputElement, InputWithIconsProps>(
	(
		{
			wrapperProps: {
				className: wrapperClassName = "",
				...restWrapperProps
			} = {},
			className: inputClassName,
			iconRight,
			disabled,
			iconLeft,
			type = "text",
			...restInputProps
		},
		ref,
	) => {
		return (
			<div
				className={classNames(
					"flex h-10 w-full items-center gap-2 rounded-md border border-border-smooth bg-popover p-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium text-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
					wrapperClassName,
				)}
				aria-disabled={disabled}
				{...restWrapperProps}
			>
				{iconLeft}

				<input
					className={classNames(
						"w-full bg-transparent leading-8 outline-hidden disabled:cursor-not-allowed",
						inputClassName,
					)}
					{...restInputProps}
					disabled={disabled}
					type={type}
					ref={ref}
				/>

				{iconRight}
			</div>
		);
	},
);

InputWithIcons.displayName = "InputWithIcons";
Input.displayName = "Input";
