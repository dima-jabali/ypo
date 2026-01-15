import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/Tooltip";
import { FilterRegexProvider } from "#/contexts/filter-regex";
import { LayoutList, X } from "lucide-react";
import { Portal } from "radix-ui";
import { useEffect, useRef, useState } from "react";

import { DefaultSuspenseAndErrorBoundary } from "#/components/fallback-loader";
import { WithNotebookIdAndList } from "#/components/with-notebook-id-and-list";
import {
	generalContextStore,
	SidebarTab,
} from "#/contexts/general-ctx/general-context";
import { NotebookOutline } from "../notebook-outline/notebook-outline";
import { NotebookDataSources } from "./notebook-data-sources";

export function ToggleNotebookDataSourcesAndOutline() {
	function toggleOpen() {
		generalContextStore.setState((prev) => ({
			sidebarTab:
				prev.sidebarTab !== SidebarTab.None
					? SidebarTab.None
					: SidebarTab.DataSources,
		}));
	}

	return (
		<FilterRegexProvider>
			<Tooltip>
				<TooltipTrigger
					className="flex bg-notebook items-center justify-center border border-border-smooth rounded-r-full button-hover size-6 @3xl:size-7"
					title="Data Sources and Outline"
					onClick={toggleOpen}
				>
					<LayoutList className="size-3 @3xl:size-3.5 stroke-1 text-muted-foreground" />
				</TooltipTrigger>

				<TooltipContent
					className="w-fit max-h-28 simple-scrollbar text-primary text-xs"
					align="center"
				>
					Data Sources and Outline
				</TooltipContent>
			</Tooltip>

			<SourcesDrawer />
		</FilterRegexProvider>
	);
}

function handleCloseSourcesDrawer() {
	generalContextStore.setState({
		sidebarTab: SidebarTab.None,
	});
}

function SourcesDrawer() {
	const [handler, setHandler] = useState<HTMLElement | null>(null);

	const drawerRef = useRef<HTMLDivElement>(null);

	const sidebarTab = generalContextStore.use.sidebarTab();

	const isOpen = sidebarTab !== SidebarTab.None;

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (!handler) {
			console.log("handlerRef not found");

			return;
		}

		const drawer = drawerRef.current;

		if (!drawer) {
			console.log("drawerRef not found");

			return;
		}

		let animationFrame: number | null = null;
		let drawerStartWidth = NaN;
		let startPositionX = NaN;
		let minX = NaN;
		let maxX = NaN;

		const changeXPosition = (e: PointerEvent) => {
			e.stopPropagation();

			const newHandlerX = e.clientX;

			const canChangeWidth = newHandlerX > minX && newHandlerX < maxX;

			if (canChangeWidth) {
				const delta = newHandlerX - startPositionX;

				const newWidthOfDrawer = drawerStartWidth - delta;

				if (animationFrame) {
					cancelAnimationFrame(animationFrame);
				}

				animationFrame = requestAnimationFrame(() => {
					drawer.style.width = `${newWidthOfDrawer}px`;
				});
			}
		};

		const stopChangeXPosition = () => {
			window.removeEventListener("pointermove", changeXPosition, true);

			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};

		const prepareForResize = (e: PointerEvent) => {
			drawerStartWidth = drawer.getBoundingClientRect().width;
			startPositionX = e.pageX;

			const _100vw = document.body.clientWidth;
			// These are kinda inverted cause the width grows from left to right:
			minX = Math.min(300, _100vw * 0.2); // px
			maxX = _100vw - minX; // px

			handler.setPointerCapture(e.pointerId);

			window.addEventListener("pointermove", changeXPosition, {
				passive: false,
				capture: true,
			});
			window.addEventListener("pointerup", stopChangeXPosition, {
				once: true,
			});
		};

		function handleCloseDrawerOnEscape(e: KeyboardEvent) {
			if (e.key === "Escape") {
				handleCloseSourcesDrawer();
			}
		}

		document.addEventListener("keydown", handleCloseDrawerOnEscape);
		handler.addEventListener("pointerdown", prepareForResize);

		return () => {
			document.removeEventListener("keydown", handleCloseDrawerOnEscape);
			handler.removeEventListener("pointerdown", prepareForResize);
		};
	}, [isOpen, handler]);

	return isOpen ? (
		<Portal.Root>
			<section
				className="fixed right-0 top-0 bottom-0 outline-none flex bg-popover border-l z-500 border-border-smooth shadow-lg shadow-black/40 p-0 overflow-hidden w-[min(20vw,300px)] group/drawer"
				ref={drawerRef}
				data-is-drawer
			>
				<div className="relative flex flex-col w-full max-w-full max-h-full h-full">
					<div
						className="absolute left-0 top-0 bottom-0 button-hover w-1 h-full flex-none cursor-ew-resize z-50"
						title="Drag to resize drawer"
						ref={setHandler}
					></div>

					<header className="flex flex-row border-b border-border-smooth flex-none items-center justify-between w-full bg-popover pr-1.5">
						<div className="flex">
							<button
								className="button-hover p-2 text-sm font-semibold data-[active=false]:opacity-30 data-[active=true]:bg-button-hover"
								onClick={() =>
									generalContextStore.setState({
										sidebarTab: SidebarTab.DataSources,
									})
								}
								data-active={sidebarTab === SidebarTab.DataSources}
							>
								{SidebarTab.DataSources}
							</button>

							<button
								className="button-hover p-2 text-sm font-semibold data-[active=false]:opacity-30 data-[active=true]:bg-button-hover"
								onClick={() =>
									generalContextStore.setState({
										sidebarTab: SidebarTab.Outline,
									})
								}
								data-active={sidebarTab === SidebarTab.Outline}
							>
								{SidebarTab.Outline}
							</button>
						</div>

						<button
							className="p-1 button-hover rounded-lg"
							onClick={handleCloseSourcesDrawer}
							title="Close drawer"
						>
							<X className="size-4 stroke-1" />
						</button>
					</header>

					<WithNotebookIdAndList>
						<div
							className="flex flex-col p-2 pt-1 simple-scrollbar max-h-full max-w-full h-full w-full"
							hidden={sidebarTab !== SidebarTab.Outline}
						>
							<DefaultSuspenseAndErrorBoundary
								failedText="Failed to load notebook outline"
								fallbackText="Loading notebook outline..."
								fallbackTextClassName="text-xs"
								fallbackFor="notebook outline"
							>
								<NotebookOutline />
							</DefaultSuspenseAndErrorBoundary>
						</div>

						<div
							className="flex flex-col p-2 pt-1 simple-scrollbar max-h-full max-w-full h-full w-full"
							hidden={sidebarTab !== SidebarTab.DataSources}
						>
							<DefaultSuspenseAndErrorBoundary
								failedText="Failed to load notebook data sources"
								fallbackText="Loading notebook data sources..."
								fallbackFor="notebook data sources"
								fallbackTextClassName="text-xs"
							>
								<NotebookDataSources />
							</DefaultSuspenseAndErrorBoundary>
						</div>
					</WithNotebookIdAndList>
				</div>
			</section>
		</Portal.Root>
	) : null;
}
