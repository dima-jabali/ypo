import React from "react";

if (process.env.NODE_ENV === "development") {
	const whyDidYouRender = await import("@welldone-software/why-did-you-render");

	whyDidYouRender.default(React, {
		trackAllPureComponents: true,
		logOnDifferentValues: true,
		logOwnerReasons: true,
		collapseGroups: true,

		trackHooks: true,
	});
}
