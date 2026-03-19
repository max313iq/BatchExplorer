import { PlaygroundExample } from "@batch/ui-playground";
import { defaultTheme, listThemes } from "@azure/bonito-ui";
import { MonacoEditor } from "@azure/bonito-ui/lib/components";
import { CertificatePage } from "@batch/ui-react/lib/components/certificate";
import { Dropdown, } from "@fluentui/react/lib/Dropdown";
import * as React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppRoot } from "./layout/app-root";
import { Footer } from "./layout/footer";
import { Header } from "./layout/header";
import { Main } from "./layout/main";
import { Stack } from "@fluentui/react/lib/Stack";
import { PrimaryButton } from "@fluentui/react/lib/Button";
import { translate } from "@azure/bonito-core";
//DefaultButton
const dropdownStyles = {
    dropdown: { width: 300 },
};
/**
 * Represents the entire application
 */
export const Application = () => {
    const [theme, setTheme] = React.useState(defaultTheme);
    const themeOptions = React.useMemo(() => {
        const options = [];
        for (const t of listThemes()) {
            options.push({ key: t.name, text: t.label });
        }
        return options;
    }, []);
    /* const linkStyle = {
        textDecoration: "none",
        color: "white",
        //backgroundColor: "#056ce3",
        backgroundColor: "#0939d6",
        fontSize: "1.2em",
        marginRight: "2em",
    }; */
    const stackTokens = { childrenGap: 30 };
    return (React.createElement(AppRoot, { theme: theme },
        React.createElement(BrowserRouter, null,
            React.createElement(Header, null,
                React.createElement(Stack, { horizontal: true, tokens: stackTokens },
                    React.createElement(PrimaryButton, { text: translate("application.buttons.home"), href: "/" }),
                    React.createElement(PrimaryButton, { text: translate("application.buttons.editor"), href: "/editor" }),
                    React.createElement(PrimaryButton, { text: translate("application.buttons.playground"), href: "/playground" }),
                    React.createElement(Dropdown, { styles: dropdownStyles, defaultSelectedKey: defaultTheme, placeholder: "Select a theme", label: "Theme", options: themeOptions, onRenderLabel: () => React.createElement(React.Fragment, null), onChange: (_, option) => {
                            if (option) {
                                setTheme(option.key);
                            }
                        } }))),
            React.createElement(Main, null,
                React.createElement(Routes, null,
                    React.createElement(Route, { path: "/playground", element: React.createElement(PlaygroundExample, null) }),
                    React.createElement(Route, { path: "/editor", element: React.createElement(MonacoEditor, { language: "json", containerStyle: {
                                display: "flex",
                                flexDirection: "column",
                                flexGrow: 1,
                                width: "100%",
                            }, editorOptions: {
                                minimap: {
                                    enabled: false,
                                },
                            } }) }),
                    React.createElement(Route, { path: "/", element: React.createElement(CertificatePage, null) }))),
            React.createElement(Footer, null))));
};
//# sourceMappingURL=application.js.map