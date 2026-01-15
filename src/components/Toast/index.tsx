import { Toast as ToastPrimitives } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	type ReactElement,
	forwardRef,
} from "react";
import { X } from "lucide-react";

import { classNames } from "../../helpers/class-names";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = forwardRef<
	ElementRef<typeof ToastPrimitives.Viewport>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Viewport
		ref={ref}
		className={classNames(
			"border-green fixed top-0 z-500 flex max-h-screen w-full flex-col-reverse gap-4 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
			className,
		)}
		{...props}
	/>
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
	"group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full",
	{
		variants: {
			variant: {
				default: "group border-gray-700 bg-gray-600 text-primary",
				destructive:
					"destructive group border-destructive bg-destructive text-destructive-foreground",
				warning: "group border-yellow-600 bg-yellow-600 text-primary",
				success: "group border-green-600 bg-green-600 text-primary",
				blue: "group border-blue-600 bg-blue-600 text-primary",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const Toast = forwardRef<
	ElementRef<typeof ToastPrimitives.Root>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
		VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
	return (
		<ToastPrimitives.Root
			ref={ref}
			className={classNames(toastVariants({ variant }), className)}
			{...props}
		/>
	);
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = forwardRef<
	ElementRef<typeof ToastPrimitives.Action>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Action
		ref={ref}
		className={classNames(
			"group-[.destructive]:border-muted/40 hover:group-[.destructive]:border-destructive/30 inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-hidden focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:group-[.destructive]:bg-destructive hover:group-[.destructive]:text-white text-white focus:group-[.destructive]:ring-destructive",
			className,
		)}
		{...props}
	/>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = forwardRef<
	ElementRef<typeof ToastPrimitives.Close>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Close
		ref={ref}
		className={classNames(
			"absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity hover:text-primary focus:opacity-100 focus:outline-hidden focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 hover:group-[.destructive]:text-red-50 focus:group-[.destructive]:ring-destructive focus:group-[.destructive]:ring-offset-red-600 text-white",
			className,
		)}
		toast-close=""
		{...props}
	>
		<X className="size-4" />
	</ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = forwardRef<
	ElementRef<typeof ToastPrimitives.Title>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Title
		ref={ref}
		className={classNames(
			"text-sm font-semibold tabular-nums [&+div]:text-xs text-white",
			className,
		)}
		{...props}
	/>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = forwardRef<
	ElementRef<typeof ToastPrimitives.Description>,
	ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Description
		ref={ref}
		className={classNames(
			"line-clamp-4 text-sm tabular-nums opacity-90 text-white",
			className,
		)}
		{...props}
	/>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = ReactElement<typeof ToastAction>;

export {
	Toast,
	ToastAction,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
	type ToastActionElement,
	type ToastProps,
};
