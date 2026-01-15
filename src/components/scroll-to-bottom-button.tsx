import { ChevronDownIcon } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { useChatStore } from "#/contexts/chat-context";

function scrollToBottom(scrollContainer: HTMLOListElement | null) {
	requestAnimationFrame(() => {
		if (!scrollContainer) return;

		scrollContainer.scrollTo({
			top: scrollContainer.scrollHeight,
			behavior: "instant",
		});
	});
}

export const ScrollToBottomButton = memo(function ScrollToBottomButton() {
	const [button, setButton] = useState<HTMLButtonElement | null>(null);

	const scrollContainer = useChatStore().use.scrollContainer();

	useEffect(() => {
		if (!(scrollContainer && button)) {
			return;
		}

		// Scroll to bottom when it first appears:
		scrollToBottom(scrollContainer);

		const handleScroll = () => {
			requestAnimationFrame(() => {
				const { scrollHeight, scrollTop } = scrollContainer;

				const shouldAppear = scrollTop < scrollHeight - 1_000;

				button.style.display = shouldAppear ? "flex" : "none";
			});
		};

		scrollContainer.addEventListener("scroll", handleScroll, {
			passive: true,
		});

		return () => {
			scrollContainer.removeEventListener("scroll", handleScroll);
		};
	}, [scrollContainer, button]);

	return (
		<div
			className="absolute left-0 right-0 -top-10 [margin-inline:auto] w-fit z-20"
			data-no-print
		>
			<button
				className="relative size-6 rounded-full flex-none border border-muted-foreground bg-muted-strong hover:brightness-75 active:brightness-125 shadow-lg shadow-black/40 text-muted-foreground items-center justify-center hidden mr-(--simple-scrollbar-width)"
				onClick={() => scrollToBottom(scrollContainer)}
				title="Scroll to bottom"
				ref={setButton}
				type="button"
			>
				<ChevronDownIcon className="size-4" />
			</button>
		</div>
	);
});
