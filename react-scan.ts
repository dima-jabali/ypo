import { scan } from "react-scan"; // must be imported before React and React DOM

import { isDev } from "./helpers/utils";

if (isDev) {
	scan({
		trackUnnecessaryRenders: true,
		animationSpeed: "off",
		enabled: false,
	});
}
