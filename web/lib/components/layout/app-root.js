import * as React from "react";
import { RootPane } from "@azure/bonito-ui/lib/components";
export const AppRoot = (props) => {
    return React.createElement(RootPane, { theme: props.theme }, props.children);
};
//# sourceMappingURL=app-root.js.map