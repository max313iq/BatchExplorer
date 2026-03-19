import * as React from "react";
import { HEADER_HEIGHT } from "./header";
const mainStyles = {
    display: "flex",
    flexDirection: "column",
    flex: "1 0 auto",
    marginTop: HEADER_HEIGHT,
};
export const Main = (props) => {
    return React.createElement("main", { style: mainStyles }, props.children);
};
//# sourceMappingURL=main.js.map